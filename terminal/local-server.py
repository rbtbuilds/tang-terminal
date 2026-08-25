#!/usr/bin/env python3
"""TANG Terminal local server: static files, market-data bridge, Ollama bridge."""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent
OLLAMA = os.environ.get("TANG_OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
RANGE_INTERVALS = {
    "1d": "5m", "5d": "15m", "1mo": "1h", "3mo": "1d",
    "6mo": "1d", "1y": "1d", "5y": "1wk",
}


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
        }
    except (KeyError, TypeError, ValueError, OSError, json.JSONDecodeError, urllib.error.URLError):
        return symbol, None


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


class Handler(SimpleHTTPRequestHandler):
    server_version = "TangTerminal/1.2"

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
            symbols = [s for s in urllib.parse.parse_qs(parsed.query).get("symbols", [""])[0].split(",") if s][:60]
            with ThreadPoolExecutor(max_workers=10) as pool:
                pairs = list(pool.map(fetch_quote, symbols))
            self.send_json({
                "quotes": {symbol: quote for symbol, quote in pairs if quote},
                "provider": "Yahoo Finance",
                "retrievedAt": int(time.time()),
            })
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
