#!/usr/bin/env python3
"""TANG Terminal local server: static files, market-data bridge, Ollama bridge."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import mimetypes
import os
import pathlib
import re
import secrets
import socket
import ssl
import struct
import time
import threading
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent


def load_local_environment() -> None:
    """Load ignored local credentials without exposing them to the browser."""
    path = ROOT / ".tang-terminal.env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip())


load_local_environment()
OLLAMA = os.environ.get("TANG_OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
AIS_KEY = os.environ.get("TANG_AISSTREAM_API_KEY", "").strip()
RANGE_INTERVALS = {
    "1d": "5m", "5d": "15m", "1mo": "1h", "3mo": "1d",
    "6mo": "1d", "1y": "1d", "5y": "1wk",
}
QUOTE_CACHE: dict[str, tuple[float, dict[str, dict]]] = {}
QUOTE_CACHE_LOCK = threading.Lock()
INTELLIGENCE_CACHE: tuple[float, dict] | None = None
INTELLIGENCE_CACHE_LOCK = threading.Lock()
SEC_USER_AGENT = os.environ.get(
    "TANG_SEC_USER_AGENT", "TANG Terminal local research tang-terminal@example.invalid"
)

# Busy global streams are intentionally narrowed to the major energy corridors.
AIS_CORRIDORS = [
    [[30.5, 48.0], [22.0, 60.5]],       # Strait of Hormuz / Gulf
    [[31.8, 31.0], [27.5, 34.8]],       # Suez / eastern Mediterranean
    [[7.0, 99.0], [-1.5, 106.5]],       # Singapore / Malacca
    [[53.0, -7.0], [47.0, 4.0]],        # English Channel
    [[31.0, -98.0], [17.0, -80.0]],     # Gulf of Mexico / Caribbean
    [[-30.0, 14.0], [-36.5, 22.0]],     # Cape of Good Hope
]


def websocket_frame(payload: bytes, opcode: int = 1) -> bytes:
    """Encode a masked client WebSocket frame (RFC 6455)."""
    mask = secrets.token_bytes(4)
    length = len(payload)
    header = bytes([0x80 | opcode])
    if length < 126:
        header += bytes([0x80 | length])
    elif length < 65536:
        header += bytes([0x80 | 126]) + struct.pack("!H", length)
    else:
        header += bytes([0x80 | 127]) + struct.pack("!Q", length)
    masked = bytes(value ^ mask[index % 4] for index, value in enumerate(payload))
    return header + mask + masked


def recv_exact(connection: socket.socket, length: int) -> bytes:
    data = bytearray()
    while len(data) < length:
        chunk = connection.recv(length - len(data))
        if not chunk:
            raise ConnectionError("AIS stream closed")
        data.extend(chunk)
    return bytes(data)


def websocket_message(connection: socket.socket) -> tuple[int, bytes]:
    first, second = recv_exact(connection, 2)
    opcode = first & 0x0F
    length = second & 0x7F
    if length == 126:
        length = struct.unpack("!H", recv_exact(connection, 2))[0]
    elif length == 127:
        length = struct.unpack("!Q", recv_exact(connection, 8))[0]
    if second & 0x80:
        mask = recv_exact(connection, 4)
        payload = bytes(value ^ mask[index % 4] for index, value in enumerate(recv_exact(connection, length)))
    else:
        payload = recv_exact(connection, length)
    return opcode, payload


class AISMonitor:
    """Small server-side AISStream bridge with bounded in-memory retention."""

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.positions: dict[str, dict] = {}
        self.types: dict[str, str] = {}
        self.lock = threading.Lock()
        self.thread: threading.Thread | None = None
        self.state = "NOT CONFIGURED" if not api_key else "READY"
        self.updated_at = 0
        self.error = ""

    def start(self) -> None:
        if not self.api_key or (self.thread and self.thread.is_alive()):
            return
        self.thread = threading.Thread(target=self.run, name="tang-ais", daemon=True)
        self.thread.start()

    def connect(self) -> socket.socket:
        raw = socket.create_connection(("stream.aisstream.io", 443), timeout=12)
        connection = ssl.create_default_context().wrap_socket(raw, server_hostname="stream.aisstream.io")
        key = base64.b64encode(secrets.token_bytes(16)).decode("ascii")
        request = (
            "GET /v0/stream HTTP/1.1\r\nHost: stream.aisstream.io\r\nUpgrade: websocket\r\n"
            f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        )
        connection.sendall(request.encode("ascii"))
        response = b""
        while b"\r\n\r\n" not in response:
            response += connection.recv(4096)
            if len(response) > 16384:
                raise ConnectionError("Invalid AIS handshake")
        if b" 101 " not in response.split(b"\r\n", 1)[0]:
            raise ConnectionError("AIS handshake rejected")
        expected = base64.b64encode(hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest())
        if expected.lower() not in response.lower():
            raise ConnectionError("AIS handshake validation failed")
        return connection

    def consume(self, payload: dict) -> None:
        metadata = payload.get("MetaData") or {}
        mmsi = str(metadata.get("MMSI") or "")
        if not mmsi:
            return
        message = payload.get("Message") or {}
        if payload.get("MessageType") in {"ShipStaticData", "StaticDataReport"}:
            values = next(iter(message.values()), {}) if message else {}
            ship_type = values.get("Type") or values.get("TypeAndCargo") or values.get("ShipType")
            if ship_type is not None:
                with self.lock:
                    self.types[mmsi] = str(ship_type)
            return
        latitude = metadata.get("Latitude", metadata.get("latitude"))
        longitude = metadata.get("Longitude", metadata.get("longitude"))
        if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
            return
        values = next(iter(message.values()), {}) if message else {}
        now = int(time.time())
        row = {
            "mmsi": mmsi,
            "name": str(metadata.get("ShipName") or "").strip() or "MMSI " + mmsi,
            "lat": round(float(latitude), 5),
            "lon": round(float(longitude), 5),
            "speed": values.get("Sog"),
            "course": values.get("Cog"),
            "type": self.types.get(mmsi, "AIS TARGET"),
            "seen": now,
        }
        with self.lock:
            self.positions[mmsi] = row
            self.updated_at = now
            if len(self.positions) > 3500:
                oldest = sorted(self.positions, key=lambda key: self.positions[key]["seen"])[:500]
                for key in oldest:
                    self.positions.pop(key, None)

    def run(self) -> None:
        delay = 2
        while self.api_key:
            connection: socket.socket | None = None
            try:
                self.state = "CONNECTING"
                connection = self.connect()
                subscription = {
                    "APIKey": self.api_key,
                    "BoundingBoxes": AIS_CORRIDORS,
                    "FilterMessageTypes": ["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport", "ShipStaticData", "StaticDataReport"],
                }
                connection.sendall(websocket_frame(json.dumps(subscription).encode("utf-8")))
                connection.settimeout(45)
                self.state = "LIVE"
                self.error = ""
                delay = 2
                while True:
                    opcode, data = websocket_message(connection)
                    if opcode == 8:
                        raise ConnectionError("AIS stream closed")
                    if opcode == 9:
                        connection.sendall(websocket_frame(data, 10))
                        continue
                    if opcode not in {1, 2}:
                        continue
                    self.consume(json.loads(data.decode("utf-8", "replace")))
            except (OSError, ValueError, json.JSONDecodeError, ConnectionError) as error:
                self.state = "RECONNECTING"
                self.error = str(error)[:160]
                time.sleep(delay)
                delay = min(30, delay * 2)
            finally:
                if connection:
                    try:
                        connection.close()
                    except OSError:
                        pass

    def snapshot(self) -> dict:
        self.start()
        cutoff = int(time.time()) - 1800
        with self.lock:
            rows = [row.copy() for row in self.positions.values() if row["seen"] >= cutoff]
        rows.sort(key=lambda row: row["seen"], reverse=True)
        return {
            "configured": bool(self.api_key),
            "state": self.state,
            "updatedAt": self.updated_at,
            "coverage": "Six major energy-shipping corridors; terrestrial AIS coverage varies",
            "positions": rows[:800],
            "count": len(rows),
            "error": self.error if self.state != "LIVE" else "",
        }


AIS_MONITOR = AISMonitor(AIS_KEY)


YAHOO_SYMBOLS = {
    "^spx": "^GSPC", "^ndq": "^NDX", "^dji": "^DJI", "^ukx": "^FTSE",
    "^dax": "^GDAXI", "^cac": "^FCHI", "^nkx": "^N225", "^hsi": "^HSI",
    "^shc": "000001.SS", "^axd": "^AXJO", "cl.f": "CL=F", "ng.f": "NG=F",
    "hg.f": "HG=F", "xauusd": "GC=F", "xagusd": "SI=F", "xptusd": "PL=F",
    "xpusd": "PA=F",
}


def yahoo_symbol(symbol: str) -> str:
    if symbol in YAHOO_SYMBOLS:
        return YAHOO_SYMBOLS[symbol]
    if symbol.endswith(".us"):
        return symbol[:-3].upper().replace("BRK-B", "BRK-B")
    return symbol.upper()


def documented_delay_minutes(provider_symbol: str, exchange: str = "") -> int | None:
    """Conservative Yahoo delay labels based on its published exchange table."""
    upper = provider_symbol.upper()
    exchange = exchange.upper()
    if upper.endswith(".L") or "LONDON" in exchange:
        return 20
    if upper.endswith("=F") or exchange in {"NYM", "CMX", "CBT", "NYB"}:
        return 30 if exchange in {"NYM", "CMX", "NYB"} or upper.endswith("=F") else 10
    if upper in {"^FTSE", "^HSI", "^VIX", "^AXJO"}:
        return 15
    if upper.endswith((".SS", ".SW")):
        return 30
    if upper.endswith((".HK", ".T", ".AX")):
        return 20
    if upper.endswith((".PA", ".DE", ".F", ".MI")):
        return 15
    if upper.endswith("=X") or upper.endswith("-USD"):
        return 0
    if exchange in {"NMS", "NYQ", "NGM", "PCX", "NAS", "NASDAQ", "NYSE"}:
        return 0
    return None


def fetch_quote(symbol: str) -> tuple[str, dict | None]:
    """Fetch one quote from Yahoo's public chart feed."""
    safe = urllib.parse.quote(yahoo_symbol(symbol), safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{safe}?range=1d&interval=1m"
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 TANG-Terminal/1.0"})
        with urllib.request.urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8", "replace"))
        results = payload.get("chart", {}).get("result") or []
        if not results:
            return symbol, None
        result = results[0]
        meta = result.get("meta", {})
        close = float(meta.get("regularMarketPrice") or 0)
        previous = float(meta.get("previousClose") or meta.get("chartPreviousClose") or 0)
        if close <= 0 or previous <= 0:
            return symbol, None
        return symbol, {
            "price": close,
            "change": ((close - previous) / previous) * 100,
            "timestamp": int(meta.get("regularMarketTime") or 0),
            "exchange": meta.get("exchangeName") or "",
            "currency": meta.get("currency") or "",
            "delayMinutes": documented_delay_minutes(yahoo_symbol(symbol), meta.get("exchangeName") or ""),
        }
    except (KeyError, TypeError, ValueError, OSError, json.JSONDecodeError, urllib.error.URLError):
        return symbol, None


def fetch_quotes(symbols: list[str]) -> dict[str, dict]:
    """Fetch a batch of quotes in one upstream request for fast dashboard loads."""
    if not symbols:
        return {}
    provider_map = {yahoo_symbol(symbol): symbol for symbol in symbols}
    joined = ",".join(urllib.parse.quote(symbol, safe="") for symbol in provider_map)
    url = f"https://query1.finance.yahoo.com/v7/finance/spark?symbols={joined}&range=1d&interval=1m"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 TANG-Terminal/1.0"})
    with urllib.request.urlopen(request, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8", "replace"))
    quotes = {}
    for result in payload.get("spark", {}).get("result") or []:
        provider_symbol = result.get("symbol") or ""
        original = provider_map.get(provider_symbol)
        responses = result.get("response") or []
        if not original or not responses:
            continue
        meta = responses[0].get("meta") or {}
        price = float(meta.get("regularMarketPrice") or 0)
        previous = float(meta.get("previousClose") or meta.get("chartPreviousClose") or 0)
        if price <= 0 or previous <= 0:
            continue
        quotes[original] = {
            "price": price,
            "change": ((price - previous) / previous) * 100,
            "timestamp": int(meta.get("regularMarketTime") or 0),
            "exchange": meta.get("exchangeName") or "",
            "currency": meta.get("currency") or "",
            "delayMinutes": documented_delay_minutes(provider_symbol, meta.get("exchangeName") or ""),
        }
    return quotes


def search_symbols(query: str) -> list[dict]:
    """Search Yahoo's security directory and normalize selectable instruments."""
    encoded = urllib.parse.quote(query, safe="")
    url = (
        "https://query1.finance.yahoo.com/v1/finance/search"
        f"?q={encoded}&quotesCount=12&newsCount=0&enableFuzzyQuery=true"
    )
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 TANG-Terminal/1.0"})
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8", "replace"))
    allowed = {"EQUITY", "ETF", "INDEX", "MUTUALFUND", "FUTURE", "CURRENCY", "CRYPTOCURRENCY"}
    results = []
    for item in payload.get("quotes") or []:
        symbol = item.get("symbol")
        quote_type = item.get("quoteType") or item.get("typeDisp") or ""
        if symbol and quote_type.upper() in allowed:
            results.append({
                "symbol": symbol,
                "name": item.get("longname") or item.get("shortname") or symbol,
                "exchange": item.get("exchDisp") or item.get("exchange") or "",
                "type": item.get("typeDisp") or quote_type,
            })
    return results


def fetch_chart(symbol: str, chart_range: str) -> dict:
    """Fetch normalized OHLCV chart points and provenance metadata."""
    interval = RANGE_INTERVALS.get(chart_range, "1d")
    chart_range = chart_range if chart_range in RANGE_INTERVALS else "3mo"
    safe = urllib.parse.quote(yahoo_symbol(symbol), safe="")
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{safe}"
        f"?range={chart_range}&interval={interval}&events=div%2Csplits"
    )
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 TANG-Terminal/1.0"})
    with urllib.request.urlopen(request, timeout=12) as response:
        payload = json.loads(response.read().decode("utf-8", "replace"))
    results = payload.get("chart", {}).get("result") or []
    if not results:
        raise ValueError("No chart data returned")
    result = results[0]
    meta = result.get("meta", {})
    timestamps = result.get("timestamp") or []
    quote = (result.get("indicators", {}).get("quote") or [{}])[0]
    points = []
    for index, timestamp in enumerate(timestamps):
        close_values = quote.get("close") or []
        if index >= len(close_values) or close_values[index] is None:
            continue
        point = {"t": timestamp, "c": close_values[index]}
        for short, key in (("o", "open"), ("h", "high"), ("l", "low"), ("v", "volume")):
            values = quote.get(key) or []
            point[short] = values[index] if index < len(values) else None
        points.append(point)
    if not points:
        raise ValueError("Chart contained no prices")
    return {
        "symbol": symbol,
        "providerSymbol": yahoo_symbol(symbol),
        "range": chart_range,
        "interval": interval,
        "currency": meta.get("currency") or "USD",
        "exchange": meta.get("fullExchangeName") or meta.get("exchangeName") or "",
        "timezone": meta.get("exchangeTimezoneName") or "UTC",
        "instrumentType": meta.get("instrumentType") or "",
        "marketTime": int(meta.get("regularMarketTime") or points[-1]["t"]),
        "retrievedAt": int(time.time()),
        "delayMinutes": documented_delay_minutes(yahoo_symbol(symbol), meta.get("exchangeName") or ""),
        "price": float(meta.get("regularMarketPrice") or points[-1]["c"]),
        "previousClose": float(meta.get("previousClose") or meta.get("chartPreviousClose") or 0),
        "points": points,
    }


def fetch_news(symbol: str) -> list[dict]:
    """Fetch a small recent-news set for the provider symbol."""
    query = urllib.parse.quote(yahoo_symbol(symbol), safe="")
    url = (
        "https://query1.finance.yahoo.com/v1/finance/search"
        f"?q={query}&quotesCount=1&newsCount=8&enableFuzzyQuery=false"
    )
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 TANG-Terminal/1.0"})
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8", "replace"))
    news = []
    for item in payload.get("news") or []:
        title, link = item.get("title"), item.get("link")
        if title and link and link.startswith(("https://", "http://")):
            news.append({
                "title": title,
                "publisher": item.get("publisher") or "Unknown publisher",
                "published": int(item.get("providerPublishTime") or 0),
                "link": link,
            })
    return news


def fetch_text(url: str, user_agent: str = "Mozilla/5.0 TANG-Terminal/3.1") -> str:
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": user_agent})
            with urllib.request.urlopen(request, timeout=20) as response:
                return response.read().decode("utf-8", "replace")
        except (OSError, urllib.error.URLError) as error:
            last_error = error
            if attempt == 0:
                time.sleep(0.4)
    raise last_error or OSError("Upstream request failed")


def xml_value(node: ET.Element, path: str) -> str:
    found = node.find(path)
    return (found.text or "").strip() if found is not None else ""


def fetch_sec_insiders(limit: int = 10) -> list[dict]:
    """Read recent open-market purchases/sales from official Form 4 XML."""
    feed = fetch_text(
        "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&owner=include&count=60&output=atom",
        SEC_USER_AGENT,
    )
    atom = ET.fromstring(feed)
    links = []
    filing_ids = set()
    for entry in atom.findall("{http://www.w3.org/2005/Atom}entry"):
        link = entry.find("{http://www.w3.org/2005/Atom}link")
        href = link.get("href", "") if link is not None else ""
        filing_id = href.rsplit("/", 1)[-1] if href else ""
        if href and filing_id not in filing_ids:
            links.append(href)
            filing_ids.add(filing_id)
    rows = []
    for filing_url in links[:24]:
        try:
            index_html = fetch_text(filing_url, SEC_USER_AGENT)
            matches = [path for path in re.findall(r'href="([^"]+\.xml)"', index_html, re.I) if "/xsl" not in path]
            if not matches:
                continue
            xml_url = urllib.parse.urljoin(filing_url, matches[-1].replace("&amp;", "&"))
            root = ET.fromstring(fetch_text(xml_url, SEC_USER_AGENT))
            issuer = xml_value(root, "issuer/issuerName")
            ticker = xml_value(root, "issuer/issuerTradingSymbol")
            owner = xml_value(root, "reportingOwner/reportingOwnerId/rptOwnerName")
            for transaction in root.findall("nonDerivativeTable/nonDerivativeTransaction"):
                code = xml_value(transaction, "transactionCoding/transactionCode")
                if code not in ("P", "S"):
                    continue
                shares = float(xml_value(transaction, "transactionAmounts/transactionShares/value") or 0)
                price = float(xml_value(transaction, "transactionAmounts/transactionPricePerShare/value") or 0)
                rows.append({
                    "symbol": ticker, "issuer": issuer, "owner": owner,
                    "side": "BUY" if code == "P" else "SELL",
                    "date": xml_value(transaction, "transactionDate/value"),
                    "shares": shares, "price": price, "notional": shares * price,
                    "link": filing_url,
                })
                if len(rows) >= limit:
                    return rows
            time.sleep(0.11)
        except (OSError, ValueError, ET.ParseError, urllib.error.URLError):
            continue
    return rows


def fetch_congress_trades(limit: int = 12) -> tuple[list[dict], dict]:
    """Use CongressInvests as a normalized index; row links remain official filings."""
    payload = json.loads(fetch_text(
        f"https://congressinfor-production.up.railway.app/trades/recent?limit={limit}"
    ))
    trades = payload.get("trades") or payload.get("data") or []
    updated = payload.get("last_updated") or payload.get("lastUpdated") or ""
    parsed_updated = 0.0
    if updated:
        try:
            parsed_updated = time.mktime(time.strptime(updated[:19], "%Y-%m-%dT%H:%M:%S"))
        except ValueError:
            pass
    return trades[:limit], {
        "provider": "CongressInvests", "lastUpdated": updated,
        "stale": not parsed_updated or time.time() - parsed_updated > 172800,
    }


def fetch_intelligence() -> dict:
    global INTELLIGENCE_CACHE
    with INTELLIGENCE_CACHE_LOCK:
        cache_ttl = 90 if INTELLIGENCE_CACHE and INTELLIGENCE_CACHE[1].get("errors") else 900
        if INTELLIGENCE_CACHE and time.time() - INTELLIGENCE_CACHE[0] < cache_ttl:
            return INTELLIGENCE_CACHE[1]
    payload = {"retrievedAt": int(time.time()), "news": [], "insiders": [], "congress": [], "sources": {}, "errors": {}}
    try:
        seen = set()
        for symbol in ("SPY", "QQQ", "CL=F"):
            for item in fetch_news(symbol):
                key = item["link"]
                if key not in seen:
                    item["context"] = symbol
                    payload["news"].append(item)
                    seen.add(key)
        payload["news"] = sorted(payload["news"], key=lambda row: row["published"], reverse=True)[:10]
        payload["sources"]["news"] = {"provider": "Yahoo Finance search; links open publishers"}
    except (OSError, ValueError, json.JSONDecodeError, urllib.error.URLError) as error:
        payload["errors"]["news"] = str(error)
    try:
        payload["insiders"] = fetch_sec_insiders()
        payload["sources"]["insiders"] = {"provider": "SEC EDGAR Forms 4", "scope": "Open-market P/S only"}
    except (OSError, ValueError, ET.ParseError, urllib.error.URLError) as error:
        payload["errors"]["insiders"] = str(error)
    try:
        payload["congress"], payload["sources"]["congress"] = fetch_congress_trades()
    except (OSError, ValueError, json.JSONDecodeError, urllib.error.URLError) as error:
        payload["errors"]["congress"] = str(error)
    with INTELLIGENCE_CACHE_LOCK:
        INTELLIGENCE_CACHE = (time.time(), payload)
    return payload


class Handler(SimpleHTTPRequestHandler):
    server_version = "TangTerminal/3.1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        print("[TANG]", fmt % args)

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - http.server API
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/quotes":
            symbols = [s for s in urllib.parse.parse_qs(parsed.query).get("symbols", [""])[0].split(",") if s][:120]
            cache_key = ",".join(symbols)
            with QUOTE_CACHE_LOCK:
                cached = QUOTE_CACHE.get(cache_key)
            if cached and time.time() - cached[0] < 20:
                quotes = cached[1]
            else:
                quotes = {}
                for index in range(0, len(symbols), 30):
                    try:
                        quotes.update(fetch_quotes(symbols[index:index + 30]))
                    except (OSError, ValueError, json.JSONDecodeError, urllib.error.URLError):
                        with ThreadPoolExecutor(max_workers=10) as pool:
                            pairs = list(pool.map(fetch_quote, symbols[index:index + 30]))
                        quotes.update({symbol: quote for symbol, quote in pairs if quote})
                with QUOTE_CACHE_LOCK:
                    QUOTE_CACHE[cache_key] = (time.time(), quotes)
            self.send_json({
                "quotes": quotes,
                "provider": "Yahoo Finance",
                "retrievedAt": int(time.time()),
            })
            return
        if parsed.path == "/api/search":
            query = (urllib.parse.parse_qs(parsed.query).get("q") or [""])[0].strip()[:80]
            if len(query) < 1:
                self.send_json({"results": []})
                return
            try:
                self.send_json({"results": search_symbols(query), "provider": "Yahoo Finance"})
            except (OSError, ValueError, json.JSONDecodeError, urllib.error.URLError) as error:
                self.send_json({"error": "Symbol search unavailable", "detail": str(error)}, 503)
            return
        if parsed.path == "/api/instrument":
            params = urllib.parse.parse_qs(parsed.query)
            symbol = (params.get("symbol") or [""])[0][:24]
            chart_range = (params.get("range") or ["3mo"])[0]
            if not symbol:
                self.send_json({"error": "Symbol is required"}, 400)
                return
            try:
                chart = fetch_chart(symbol, chart_range)
                try:
                    chart["news"] = fetch_news(symbol)
                except (OSError, ValueError, json.JSONDecodeError, urllib.error.URLError):
                    chart["news"] = []
                chart["provider"] = "Yahoo Finance"
                self.send_json(chart)
            except (OSError, ValueError, json.JSONDecodeError, urllib.error.URLError) as error:
                self.send_json({"error": "Market data unavailable", "detail": str(error)}, 503)
            return
        if parsed.path == "/api/intelligence":
            self.send_json(fetch_intelligence())
            return
        if parsed.path == "/api/ais/positions":
            self.send_json(AIS_MONITOR.snapshot())
            return
        if parsed.path == "/api/ollama/api/tags":
            self.proxy_ollama("GET", "/api/tags")
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802 - http.server API
        if self.path == "/api/ollama/api/generate":
            self.proxy_ollama("POST", "/api/generate")
            return
        self.send_json({"error": "Not found"}, 404)

    def proxy_ollama(self, method: str, path: str) -> None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else None
            request = urllib.request.Request(
                OLLAMA + path,
                data=body,
                method=method,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=180) as response:
                payload = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except (OSError, urllib.error.URLError) as error:
            self.send_json({"error": "Ollama unavailable", "detail": str(error)}, 503)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run TANG Terminal locally")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()
    mimetypes.add_type("text/javascript", ".js")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"TANG Terminal: http://127.0.0.1:{args.port}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping TANG Terminal.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
