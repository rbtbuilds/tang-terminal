# TANG Terminal

TANG Terminal is a compact, terminal-style global market canvas. It runs with no package manager, framework, CDN, analytics, or cloud account. Panels can be dragged, resized, and restored; the arrangement persists in `localStorage`.

## Dashboard

- Global index board for the US, Europe, and Asia-Pacific
- AI/semiconductors, energy, and financials market heatmap
- Mega-cap equity monitor and precious-metals board
- Eight daylight-saving-aware world session clocks
- Demo and live data adapters, plus a scrolling market tape
- Local AI assistant backed by an Ollama model of your choice
- Click-through instrument research with seven chart ranges, calculated technicals, educational bull/bear scenarios, and recent headlines
- Persistent watchlist panel; pin or unpin an instrument from its research drawer
- Responsive full-screen canvas with keyboard-friendly controls

## Quick start

### macOS

1. Open the `terminal` folder.
2. Double-click `install-macos.command` (or run `./install-macos.command` in Terminal).
3. Double-click **TANG Terminal** on the Desktop.

If macOS blocks the first run, Control-click the installer, choose **Open**, and confirm. Python 3 is required for live market data and the Ollama bridge. The demo dashboard can also be opened directly by double-clicking `index.html`.

### Windows 10/11

From PowerShell in the extracted `terminal` folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
```

Then use the **TANG Terminal** desktop shortcut. Python 3 must be available as `python` or `py` for live data and the Ollama bridge.

### Linux / manual

```bash
python3 terminal/local-server.py --port 8787
```

Open <http://127.0.0.1:8787>. Direct `file://` opening remains supported in demo mode.

## Ollama assistant

1. Install Ollama from its official distribution.
2. Start Ollama and pull a model, for example: `ollama pull llama3.2:3b`.
3. Launch TANG Terminal, open the assistant panel, and select **CONNECT**.
4. Choose any installed model from the model menu.

By default the launcher bridges to `http://127.0.0.1:11434`. To use another endpoint, set `TANG_OLLAMA_URL` before launching the local server. When opened directly, the assistant uses the host entered in the panel; Ollama must allow the page origin.

The assistant receives the current visible quote snapshot with each prompt. It is designed for market commentary, not order execution. Its output is not financial advice.

## Using the terminal

- Drag a panel by its `⠿` grip to reorder it.
- Select **↔ SIZE** to cycle among compact, medium, and full width.
- Select **RESET LAYOUT** to restore the factory arrangement.
- Select **DATA: DEMO/LIVE** to switch adapters. Live mode requires the local launcher and internet access.
- Select **FULLSCREEN** to enter a borderless browser canvas. Move the browser window to the desired display first, then enter fullscreen. Browser security requires this user gesture.
- Open an instrument and select **+ WATCHLIST** to pin it to the persistent watchlist panel. Select **★ WATCHING** or the row's × button to remove it.

Layout and preferences are stored only in the browser's `localStorage`. Different browser profiles and `file://` versus `http://` keep separate layouts.

## Data adapters

`DemoAdapter` is deterministic at startup and applies small simulated ticks every 2.2 seconds. It is always available offline and labels its feed as simulated.

`LiveAdapter` requests public chart-market data from Yahoo Finance through the bundled local server once per minute. Intraday percentage changes use the provider's previous close rather than the first bar in a multi-day range. Every research drawer shows the provider, exchange, and market timestamp. Quotes may be delayed according to exchange/provider rules. Availability and symbol coverage depend on the upstream service; a failed request is shown as unavailable and does not break the dashboard. Market-cap values are illustrative reference values, not live quotes. Metals use exchange-traded futures as transparent live proxies rather than claiming to be spot prices.

The technical signal is calculated locally from the selected range using SMA20, SMA50, RSI14, ATR14, and recent support/resistance. Bull and bear scenarios are mechanical educational examples—not individualized recommendations or executable orders. News headlines are fetched on demand and link to the original publisher through Yahoo Finance search.

## Project structure

```text
terminal/
  index.html              Application shell and local script order
  css/terminal.css        Tokens, layout, components, responsive rules
  js/store.js             Versioned local settings/layout persistence
  js/data/                Instrument universe and data adapters
  js/widgets/             Isolated panel renderers
  js/grid.js              Drag/drop and panel sizing
  js/ollama.js            Local model client
  js/main.js              Application orchestration
  local-server.py         Static server, live feed, and Ollama bridges
  install-* / launch-*    Desktop installers and launchers
```

The browser code deliberately uses classic scripts and ES5-compatible syntax so `index.html` works from `file://` without module/CORS errors. There are no runtime dependencies to install and no remote UI assets.

The product benchmark and phased roadmap are documented in [docs/BLOOMBERG-BENCHMARK.md](docs/BLOOMBERG-BENCHMARK.md).

## Reliability and privacy

- Storage access, fullscreen requests, network calls, and model calls fail gracefully.
- User prompts are sent only to the configured local Ollama endpoint.
- The local server binds to `127.0.0.1`, not the network.
- No credentials are stored or requested.
- The demo experience works entirely offline.

## Development checks

```bash
python3 -m py_compile terminal/local-server.py
node --check terminal/js/main.js
python3 terminal/local-server.py --port 8787
```

Open the page, test panel drag/resize/reset, switch feeds, enter/exit fullscreen, and connect to Ollama. Changes require no build step.

## License

MIT — see [LICENSE](LICENSE).
