# Bloomberg Terminal Benchmark and TANG Roadmap

Research date: 25 August 2026

## Executive view

Bloomberg's durable advantage is integration, not visual style. A selected security connects market data, charts, news, research, estimates, ownership, events, portfolio exposure, alerts, collaboration, and execution. Launchpad makes those components configurable; the command workflow makes them fast.

TANG already has the beginnings of a personal Launchpad: a persistent canvas, global monitor, heatmap, instrument drawer, news, technical studies, local AI, and now a watchlist. It is not comparable to Bloomberg in data breadth, licensing, proprietary research, institutional messaging, or trade execution. A credible goal is a high-quality local research and monitoring terminal for a self-directed user.

## Capability comparison

| Bloomberg capability | TANG today | Best next improvement |
|---|---|---|
| Launchpad workspaces | Persistent drag/resize canvas | Named workspace profiles; linked panels; import/export layout |
| Command-driven navigation | Mouse/keyboard activation of visible instruments | Global command bar: `NVDA DES`, `NVDA CHART`, `NEWS AI`, `PORT` |
| Cross-asset security master | Curated equities, indices, energy, metals | Provider-neutral symbol search, canonical IDs, exchange/currency/session metadata |
| Real-time market monitoring | Demo and polled Yahoo chart feed | Pluggable licensed adapter, WebSocket stream, stale-data guard, quality console |
| Advanced charting | Seven ranges, line price and SMA20 | Candles, volume, comparison series, indicator registry, annotations, event markers, templates |
| News and research | On-demand recent headlines | Live watchlist news, topic filters, deduplication, event timeline, cited AI summaries |
| Equity screening and relative value | Fixed mega-cap/sector lists | Configurable screener, peer sets, ranking, valuation and growth factors |
| Fundamentals and estimates | None | SEC filing facts, financial statements, earnings history, estimates from an entitled provider |
| Analyst recommendations | Local mechanical technical bias | Separate provider-sourced consensus/targets from TANG's transparent rule-based signals |
| Economics and calendars | Session clocks | Economic calendar, earnings/events calendar, FRED macro monitor, yield curve |
| Alerts | Feed status only | Price/volume/technical/news/event rules with desktop notifications and audit history |
| Portfolio and risk | None | Paper portfolio/CSV positions, P&L, allocation, drawdown, beta, correlation, scenarios |
| Quant research/backtesting | Local indicators | Strategy lab with reproducible assumptions, costs, benchmarks, walk-forward results |
| Conversational AI | Local Ollama snapshot commentary | Tool-using, cited answers with timestamped evidence and UI deep links |
| Collaboration and messaging | None | Keep out of core scope unless a private team deployment is required |
| Execution/OMS | None | Keep explicitly out of scope until regulated broker integrations and controls exist |

## What Bloomberg demonstrates

### 1. Everything follows the selected security

Bloomberg's equity workflow connects market overview, screening, relative valuation, financial analysis, estimates, analyst recommendations, ownership, filings, news, events, and charts. TANG should create a canonical `InstrumentContext` so every panel can follow one selection. This is more valuable than adding disconnected widgets.

### 2. Fast navigation is a product feature

Bloomberg functions are terse and composable. TANG should add a command bar with searchable verbs and aliases. Examples:

- `AAPL DES` — overview
- `AAPL GP` — chart
- `AAPL NEWS` — news and filings
- `AAPL TECH` — technical workbench
- `EQS` — screener
- `ECON` — economics dashboard
- `PORT` — portfolio view
- `ALERT NVDA > 325` — create alert

The command bar should coexist with mouse/touch UI, not replace it.

### 3. Trust is visible

Professional users need to see source, exchange, currency, adjustment policy, delay, observation time, retrieval time, and fallback state. TANG should add a Data Quality panel and attach provenance to every number. Conflicting-provider checks should be possible for critical quotes.

### 4. News must be connected to price and events

Bloomberg integrates tailored alerts, news analytics, and security tools. TANG should plot earnings, dividends, splits, filings, and headlines on the chart. Its local AI should summarize only fetched documents and cite each headline or filing it used.

### 5. Portfolio context changes the answer

Bloomberg PORT joins positions, performance, attribution, exposures, and scenario analysis. TANG's AI cannot give portfolio-relevant commentary until it knows positions, cost basis, currency, benchmark, and risk limits. A local paper portfolio is therefore a higher priority than generic model prose.

## Recommended delivery sequence

### Phase A — Reliability and navigation

1. Canonical instrument/security-master model.
2. Adapter contract with capability flags, timestamps, delays, caching, retries, and validation.
3. Data Quality panel showing stale/missing/conflicting values.
4. Global symbol search and command bar.
5. Linked-panel context and named workspaces.
6. Watchlist price, technical, news, and event alerts.

### Phase B — Research depth

1. Candlestick/volume charts with compare mode and saved templates.
2. Indicator registry: EMA, MACD, Bollinger Bands, stochastic, relative strength, beta, correlation.
3. Security overview with profile, exchange, sector, valuation, financial trend, and capital structure.
4. SEC EDGAR filing feed and normalized company facts for US issuers.
5. Earnings, dividends, splits, economic releases, and central-bank calendar.
6. Peer comparison and an explainable equity screener.

### Phase C — Portfolio and risk

1. Manual and CSV position import with local encryption option.
2. P&L, allocation, currency and sector exposure, concentration, and benchmark comparison.
3. Volatility, drawdown, beta, correlation, historical VaR, and stress scenarios.
4. Portfolio-aware news and alerts.
5. AI portfolio brief with citations and explicit missing-data disclosures.

### Phase D — Quant lab

1. Reproducible backtests with benchmark, fees, spread, slippage, survivorship, and look-ahead warnings.
2. Strategy parameter explorer and walk-forward validation.
3. Exportable research notebooks/reports.
4. Scheduled local jobs and result history.

## Data architecture recommendation

Do not make an undocumented public endpoint the only live source. Keep demo mode, but add provider adapters behind the local server:

- A licensed market-data provider for streaming and historical OHLCV. Twelve Data documents REST/WebSocket access and broad cross-asset coverage; Polygon documents consolidated US-equity coverage. Entitlements and delay labels must be preserved.
- SEC `data.sec.gov` for US filings and XBRL company facts.
- FRED/ALFRED for economic releases, histories, and vintages.
- A separately entitled fundamentals/estimates/news provider where needed.

API keys should live only in the local server environment or OS credential store. Cache normalized results in SQLite with raw-provider payload hashes, retrieval timestamps, and schema versions.

## Guardrails

- Never present a technical heuristic as analyst consensus.
- Never label delayed quotes as real-time.
- Keep price timestamp and retrieval timestamp distinct.
- Preserve adjusted and unadjusted series explicitly.
- Treat missing values as missing, not zero.
- Cite every AI claim to a quote, filing, event, or headline available in the local evidence set.
- Keep execution disabled until broker authorization, suitability, audit, reconciliation, and failure controls are intentionally designed.

## Sources

- [Bloomberg Terminal overview](https://professional.bloomberg.com/products/bloomberg-terminal/)
- [Bloomberg chart tools](https://professional.bloomberg.com/products/bloomberg-terminal/charts/)
- [Bloomberg news](https://professional.bloomberg.com/products/bloomberg-terminal/news/)
- [Bloomberg Portfolio & Risk Analytics](https://professional.bloomberg.com/products/bloomberg-terminal/portfolio-analytics/)
- [Bloomberg MARS](https://professional.bloomberg.com/products/risk/mars/)
- [Bloomberg BQuant](https://professional.bloomberg.com/products/bloomberg-terminal/research/bquant/)
- [Bloomberg AI / ASKB](https://professional.bloomberg.com/products/bloomberg-terminal/ai/)
- [Bloomberg Terminal Essentials: equity functions](https://professional.content.cirrus.bloomberg.com/professional2023/insights/technology/bloomberg-terminal-essentials-best-equities-functions/)
- [Bloomberg Terminal Essentials: Launchpad and Worksheets](https://www.bloomberg.com/professional/insights/technology/bloomberg-terminal-essentials-ib-worksheets-launchpad/)
- [SEC EDGAR APIs](https://www.sec.gov/edgar/sec-api-documentation)
- [FRED API](https://fred.stlouisfed.org/docs/api/fred/)
- [Twelve Data API](https://twelvedata.com/docs)
- [Polygon stocks API](https://polygon.io/docs/rest/stocks/overview)
