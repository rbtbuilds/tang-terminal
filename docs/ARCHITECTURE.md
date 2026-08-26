# TANG Terminal architecture

## Design boundaries

TANG is a local browser application with a small Python bridge. It deliberately avoids a build tool, package manager, remote UI assets, framework, and database. Classic scripts keep the read-only demo usable from `file://`; network-backed features require `local-server.py`.

The browser owns presentation and device-local preferences. The local server owns upstream credentials, network normalization, quote batching, AIS streaming, and Ollama proxying. Credentials must never enter HTML, JavaScript, localStorage, query strings, or API responses.

## Browser modules

- `main.js` orchestrates pages, status, the command field, watch rail and adapters.
- `store.js` is the only direct owner of versioned localStorage records.
- `grid.js` converts measured or user-selected pixel height into fixed CSS-grid row spans. This is what guarantees collision-free reflow.
- `data/universe.js` contains canonical built-in instrument definitions.
- `symbols.js` adds provider-discovered instruments to that canonical index.
- `data/adapter.js` normalizes demo and connected quote updates.
- `widgets/` contains isolated renderers. A widget exposes `create()` and may expose `update(quotes)` plus cleanup handles.
- `details.js` owns independent chart-style and data-feed selection, one-minute live refresh, performance, earnings, analyst/fundamental context, technicals, scenarios, provenance and news rendering.
- `intelligence.js` owns the single cached browser request for overview news and disclosure widgets.
- `earnings.js` owns demo/live earnings loading for the tracked equity and watchlist universe.
- `ollama.js` owns the local-model request contract and evidence-constrained system prompt.

## Layout lifecycle

Each page has an independent ordered layout in localStorage. In automatic mode, `grid.js` measures the panel header plus the body's natural `scrollHeight`, converts the result to an 8-pixel row grid and assigns `grid-row-end`. A `MutationObserver` remeasures after quote or content changes.

In edit mode, pointer movement on the lower handle stores an explicit `heightPx`; the right-edge handle converts pointer movement into an exact `widthCols` span on the 12-column grid. CSS Grid reserves both dimensions before placing later panels, so panels reflow instead of overlapping. Selecting the height button clears `heightPx` and restores natural measurement, while the width button remains a quick 4/6/12-column preset cycle. Responsive minimums are applied only at render time, preserving the user's desktop span.

## Page model

Pages use URL hashes and a shared shell:

- Overview — global briefing with quotes, news, movements and public disclosures.
- Markets — indices, sectors, leaders, metals and cross-asset signals.
- Energy — the commodity complex, product spreads and tanker equities.
- Shipping — dominant AIS map linked to tanker and energy monitors.
- Research — watchlist, cross-asset context and recent briefing headlines.

The watchlist rail, command field and collapsible local-AI dock remain available across pages. Selecting any market symbol opens the same research context.

## Server services

`local-server.py` binds only to `127.0.0.1` and exposes:

- `/api/quotes` — batched, cached normalized quote indications.
- `/api/search` — provider-supported security discovery.
- `/api/instrument` — normalized Yahoo or optional Twelve Data OHLCV, provenance and recent headline metadata.
- `/api/research` — cached Finnhub earnings/recommendation/metric/peer context plus locally calculated Yahoo historical performance.
- `/api/intelligence` — cached, normalized news, SEC Form 4 and Congressional disclosure briefing.
- `/api/earnings` — optional Finnhub calendar, consensus estimates and recent-surprise context; credentials remain server-side.
- `/api/ais/positions` — bounded, key-free browser snapshot of recent AIS positions.
- `/api/ollama/*` — local Ollama proxy.

The AIS bridge implements the RFC 6455 client handshake with Python's standard library, subscribes to bounded energy corridors, handles ping/pong and reconnects with exponential backoff. It retains at most 3,500 targets in memory and serves at most 800 recent positions observed within the last 30 minutes per browser poll.

## Failure behavior

Every upstream feature has an explicit local fallback. Quotes remain blank rather than fabricated in connected mode. AIS shows labelled demo vessels until authenticated live positions arrive. Instrument research reports provider failure without closing the drawer. Ollama failure affects only the assistant. Corrupt browser storage restores defaults.

Twelve Data requests use an `Authorization` header, are cached for 55 seconds per symbol/range, and occur only while its feed is selected. Finnhub research calls run concurrently, cache for 15 minutes, and are restricted to compatible US equity symbols. Neither provider credential enters a browser URL or response.
