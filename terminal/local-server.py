#!/usr/bin/env python3
"""TANG Terminal local server: static files, Stooq quote bridge, Ollama bridge."""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import pathlib
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent
OLLAMA = os.environ.get("TANG_OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")


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
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{safe}?range=5d&interval=1d"
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
        previous = float(meta.get("chartPreviousClose") or meta.get("previousClose") or 0)
        if close <= 0 or previous <= 0:
            return symbol, None
        return symbol, {"price": close, "change": ((close - previous) / previous) * 100}
    except (KeyError, TypeError, ValueError, OSError, json.JSONDecodeError, urllib.error.URLError):
        return symbol, None


class Handler(SimpleHTTPRequestHandler):
    server_version = "TangTerminal/1.0"

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
            self.send_json({"quotes": {symbol: quote for symbol, quote in pairs if quote}})
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
