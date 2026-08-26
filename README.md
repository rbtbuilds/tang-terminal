# TANG Terminal

### Trading Analytics & Navigation Grid

[![License: MIT](https://img.shields.io/badge/License-MIT-34f57a.svg)](LICENSE)
[![Checks](https://github.com/rbtbuilds/tang-terminal/actions/workflows/checks.yml/badge.svg)](https://github.com/rbtbuilds/tang-terminal/actions/workflows/checks.yml)
[![No build step](https://img.shields.io/badge/build-none-34f57a.svg)](#quick-start)
[![Local first](https://img.shields.io/badge/data-local--first-34f57a.svg)](#reliability-and-privacy)

TANG Terminal—**Trading Analytics & Navigation Grid**—is an open-source, terminal-style global market research workstation for retail traders. It runs with no package manager, framework, CDN, analytics, or cloud account. Purpose-built pages replace the former continuous dashboard, while collision-free panel layouts persist in `localStorage`.

> TANG is a research and monitoring interface, not a broker, execution venue, fiduciary, or source of personalized financial advice. Verify connected data and original sources before making decisions.

## Dashboard

- Global index board for the US, Europe, and Asia-Pacific
- AI/semiconductors, energy, and financials market heatmap
- Mega-cap equity monitor and precious-metals board
- Eight daylight-saving-aware world session clocks
- Demo and live data adapters, plus a scrolling market tape
- Local AI assistant backed by an Ollama model of your choice
- Persistent collapsible AI dock shared by every workspace
- Overview briefing with recent news, quote-derived movers, educational setups, and public disclosures
- Upcoming earnings radar with analyst EPS/revenue consensus and a recent-surprise-history lean
- Click-through instrument research with seven chart ranges, calculated technicals, educational bull/bear scenarios, and recent headlines
- Persistent watchlist panel; pin or unpin an instrument from its research drawer
- Global security search for provider-supported LSE, NYSE, Nasdaq and other exchange-listed instruments
- Five routed workspaces: Overview, Markets, Energy & Commodities, Shipping Map, and Research
- Persistent left-side watchlist and global ticker/function command field
- Local Natural Earth world map with live AISStream energy-corridor positions and an offline demo fallback
- Add/remove widget catalog with dedicated energy, broad commodities, tanker-equity and cross-asset panels
- Adjustable 85–145% terminal typography with the preference stored locally
- Content-measured widget heights plus continuous lower- and right-edge drag resizing without overlap
- Responsive full-screen pages with keyboard-friendly controls

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
3. Launch TANG Terminal, open the assistant dock at the bottom, and select **CONNECT**.
4. Choose any installed model from the model menu.

By default the launcher bridges to `http://127.0.0.1:11434`. To use another endpoint, set `TANG_OLLAMA_URL` before launching the local server. When opened directly, the assistant uses the host entered in the panel; Ollama must allow the page origin.

The assistant receives the current visible quote snapshot with each prompt. It is designed for market commentary, not order execution. Its output is not financial advice.

## Live shipping map

Live vessel positions use AISStream through the bundled local server. The key is never returned to browser code.

1. Create an AISStream API key.
2. Copy `terminal/.tang-terminal.env.example` to `terminal/.tang-terminal.env`.
3. Replace the placeholder with your key and launch normally.

The real configuration file is ignored by Git. If it is included in a private release ZIP, that archive becomes sensitive and must not be published or forwarded. Rotate the key if the archive is lost.

TANG subscribes to six major energy-shipping corridors rather than the entire global firehose. AIS reception is terrestrial and event-driven; coverage, classification and update frequency vary. Targets expire from the display after 30 minutes. Unclassified targets are shown in blue; confirmed tanker-class AIS types are amber.

## Live earnings calendar

Demo mode includes a clearly simulated earnings board. Live upcoming earnings use an optional Finnhub key:

1. Create a free key at [Finnhub](https://finnhub.io/register).
2. Add `TANG_FINNHUB_API_KEY=your_key` to the ignored `terminal/.tang-terminal.env` file.
3. Restart TANG Terminal and select **LIVE** mode.

The widget covers tracked equities and watchlist symbols found in the provider calendar over the next 28 days. EPS and revenue are non-GAAP analyst consensus estimates. `BEAT-LEAN`, `MIXED`, and `MISS-LEAN` use only the last four available surprise outcomes; they are deliberately weak historical heuristics, not model certainty, analyst advice, or a substitute for guidance and fundamentals.

## Using the terminal

- Select **EDIT LAYOUT** to reveal move, resize, and remove controls.
- Drag a panel by its `⠿` grip to reorder it. Drag its dotted lower edge for continuous height or its highlighted right edge for continuous width.
- The width control shows the current column span, such as `↔ 7/12`; select it to cycle through 4-, 6-, and 12-column presets. Select the height label to restore content-measured **AUTO** height.
- Exact desktop width and height choices persist independently for every page. At narrow breakpoints TANG temporarily expands panels for readability without discarding the desktop setting.
- Select **RESET** to restore the current page's factory arrangement.
- Select **DATA: DEMO/LIVE** to switch adapters. Live mode requires the local launcher and internet access.
- Select **FULLSCREEN** to enter a borderless browser canvas. Move the browser window to the desired display first, then enter fullscreen. Browser security requires this user gesture.
- Open an instrument and select **+ WATCHLIST** to pin it to the persistent watchlist panel. Select **★ WATCHING** or the row's × button to remove it.
- Select **+ TICKER**, search by company or provider ticker, confirm the exchange, and add the result. London listings normally use the `.L` suffix (for example `BP.L`). Custom instruments persist locally and receive the same chart, technical and news drawer.
- Switch among **OVERVIEW**, **MARKETS**, **ENERGY & COMMODITIES**, **SHIPPING MAP**, and **RESEARCH**. Each has an independent persistent layout and URL hash.
- Select **+ WIDGET** to add panels to the current workspace. Use a panel's × control to remove it without deleting its data.
- Use **A−** and **A+** to scale terminal typography between 85% and 145%.

Layout and preferences are stored only in the browser's `localStorage`. Different browser profiles and `file://` versus `http://` keep separate layouts.

## Data adapters

`DemoAdapter` is deterministic at startup and applies small simulated ticks every 2.2 seconds. It is always available offline and labels its feed as simulated.

`LiveAdapter` requests public chart-market data from Yahoo Finance through the bundled local server once per minute. Dashboard quotes are retrieved in batches—rather than one upstream request per instrument—to keep startup and page switching responsive. Intraday percentage changes use the provider's previous close rather than the first bar in a multi-day range. Research views distinguish observation and retrieval times, currency, exchange, provider and documented delay. For example, Yahoo documents LSE data as 20 minutes delayed and many NYMEX/COMEX futures as 30 minutes delayed; TANG preserves those labels instead of describing the whole connection as real-time. Availability and symbol coverage depend on the upstream service; a failed request is shown as unavailable and does not break the dashboard. Market-cap values are illustrative reference values, not live quotes. Commodity panels use front-month exchange-traded futures proxies; tanker panels show listed operator equities rather than freight rates.

The optional earnings adapter requests Finnhub's upcoming calendar once per hour and adds recent reported-surprise context for at most 12 tracked events. Missing credentials, estimates, history, or provider coverage remain visibly unavailable rather than being inferred.

The technical signal is calculated locally from the selected range using SMA20, SMA50, RSI14, ATR14, and recent support/resistance. Bull and bear scenarios are mechanical educational examples—not individualized recommendations or executable orders. News headlines are fetched on demand and link to the original publisher through Yahoo Finance search.

The Overview disclosure board reads open-market purchase/sale codes from official SEC Form 4 filings. Congressional rows use CongressInvests as a normalizer but retain links to official disclosures; the widget exposes a stale-provider warning and notes the statutory reporting lag. These are filing monitors, not complete order-flow feeds.

## Open-source research roadmap

TANG separates authoritative public records, attributed provider research, and reproducible local calculations. Named-bank upgrades, consensus labels, estimates, and targets must retain their provider, institution, publication date, coverage and freshness; they are never relabelled as TANG advice. The evaluated adapter plan is in [docs/RETAIL-RESEARCH-ROADMAP.md](docs/RETAIL-RESEARCH-ROADMAP.md).

## Project structure

```text
terminal/
  index.html              Application shell and local script order
  css/terminal.css        Tokens, layout, components, responsive rules
  data/world-110m.geojson Packaged Natural Earth public-domain basemap
  js/store.js             Versioned local settings/layout persistence
  js/symbols.js           Persistent user-added security registry
  js/data/                Instrument universe and data adapters
  js/widgets/             Isolated panel renderers
  js/intelligence.js      Shared cached briefing/disclosure client
  js/earnings.js          Optional earnings calendar client and offline demo
  js/grid.js              Collision-free auto layout and pointer resizing
  js/ollama.js            Local model client
  js/main.js              Application orchestration
  local-server.py         Static, market, AISStream, and Ollama bridges
  install-* / launch-*    Desktop installers and launchers
```

The browser code deliberately uses classic scripts so `index.html` works from `file://` without module/CORS errors in modern browsers. There are no runtime dependencies to install and no remote UI assets.

The durable product direction is captured in [docs/PROJECT-STATE.md](docs/PROJECT-STATE.md). The product benchmark is documented in [docs/BLOOMBERG-BENCHMARK.md](docs/BLOOMBERG-BENCHMARK.md). Internal boundaries and feed semantics are described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DATA-PROVENANCE.md](docs/DATA-PROVENANCE.md).

## Reliability and privacy

- Storage access, fullscreen requests, network calls, and model calls fail gracefully.
- User prompts are sent only to the configured local Ollama endpoint.
- The local server binds to `127.0.0.1`, not the network.
- Market and AIS credentials remain in the ignored server-only `.tang-terminal.env`; endpoints never return them.
- The demo experience works entirely offline.

## Development checks

```bash
python3 -m py_compile terminal/local-server.py
node --check terminal/js/main.js
python3 terminal/local-server.py --port 8787
```

Open the page, test panel drag/resize/reset, switch feeds, enter/exit fullscreen, and connect to Ollama. Changes require no build step.

## Contributing

Contributions are welcome, especially well-attributed data adapters, reproducible analytics, accessibility improvements, and reliability fixes. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security issues should follow [SECURITY.md](SECURITY.md), not a public issue.

By participating, you agree to the project [Code of Conduct](CODE_OF_CONDUCT.md). Release history is recorded in [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](LICENSE).
