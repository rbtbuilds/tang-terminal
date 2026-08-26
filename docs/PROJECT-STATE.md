# TANG Terminal project state

This file is the durable product memory for future development sessions.

## Product direction

TANG Terminal is an open-source, local-first research toolkit for retail traders. It should make global monitoring, idea discovery, portfolio research and source verification approachable without pretending to be an execution venue or a licensed Bloomberg replacement.

## Current experience

- Five focused workspaces: Overview, Markets, Energy & Commodities, Shipping, and Research.
- A persistent watchlist, global symbol search, instrument drawer and collapsible local Ollama assistant.
- Demo/offline and connected adapters with prominent provider, delay and stale-data semantics.
- Overview news, loaded-universe movers, educational mechanical setups, SEC insider filings and Congressional disclosures.
- Upcoming earnings with attributed analyst consensus and a transparent recent-surprise-history lean; live mode requires an optional server-side Finnhub key.
- Switchable Yahoo global and optional free Twelve Data live candles, with explicit quota, venue-coverage and freshness labels.
- Expanded US equity research with upcoming earnings, four reported surprises, monthly analyst counts, fundamentals, peers and reproducible 1D–1Y performance.
- Local Natural Earth map and optional server-side AISStream vessel positions.
- Per-workspace layouts with drag reorder, continuous height and 3–12-column width resizing, automatic natural height, and readable responsive minimums.

## Non-negotiable trust rules

- Never invent or silently infer prices, analyst ratings, targets, news, flows or causation.
- Keep public records, licensed provider research, local calculations and model commentary visually distinct.
- Every externally sourced claim needs provenance, observation/publication time and applicable delay or stale state.
- `Strong Buy` and similar labels must be attributed to a provider or named institution and dated; they are not TANG recommendations.
- Credentials stay in ignored server-side configuration and must never reach browser code or Git.
- Demo mode must remain useful offline and clearly labelled as simulated.

## Engineering constraints

- Zero-build classic browser scripts, no remote UI dependencies and graceful `file://` behavior.
- Standard-library Python bridge bound to `127.0.0.1`.
- Modular widgets and adapters, versioned localStorage migrations, readable code and no panel overlap.
- Large-font and narrow-screen behavior take precedence over preserving an exact desktop density.

## Next research priorities

Follow [RETAIL-RESEARCH-ROADMAP.md](RETAIL-RESEARCH-ROADMAP.md): SEC XBRL fundamentals and events first, then an optional attributed analyst-consensus adapter, reproducible stock discovery, 13F tracking, and only later licensed options-flow data.
