# Contributing to TANG Terminal

Thanks for helping build Trading Analytics & Navigation Grid into a trustworthy open-source research toolkit.

## Before contributing

1. Search existing issues and discussions before proposing overlapping work.
2. Open an issue before a large feature or new network dependency.
3. Never commit API keys, personal data, paid datasets, copied research reports, or redistributed market data without explicit rights.
4. Preserve the boundaries in `docs/DATA-PROVENANCE.md` and `docs/PROJECT-STATE.md`.

## Local setup

No dependency installation or build step is required.

```bash
python3 terminal/local-server.py --port 8787
```

Open <http://127.0.0.1:8787>. You can also open `terminal/index.html` directly to test offline demo mode.

Copy `terminal/.tang-terminal.env.example` to `.tang-terminal.env` only when testing optional local credentials such as AISStream or Finnhub. The real file is ignored by Git.

## Code expectations

- Keep browser modules as readable classic scripts so `file://` remains supported.
- Keep the Python bridge standard-library-only unless a dependency is discussed first.
- Normalize network responses at the server boundary and expose provenance, freshness, delay, and failure state.
- Never describe simulated, delayed, stale, or incomplete data as live.
- Keep widgets modular: a renderer exposes `create()` and optionally `update(quotes)` plus cleanup handles.
- Persist user preferences through `store.js` using backward-compatible versioned state.
- Reflow panels through the grid; never position widgets so they can overlap.
- Use plain language and accessible labels for interactive controls.

## Checks

Run before submitting:

```bash
python3 -m py_compile terminal/local-server.py
for file in terminal/js/*.js terminal/js/widgets/*.js terminal/js/data/*.js; do node --check "$file"; done
git diff --check
```

Also test:

- direct-file demo mode;
- local-server demo and live modes;
- all five workspaces;
- 85%, 100%, and 145% typography;
- widget reorder and horizontal/vertical resizing;
- instrument research and watchlist persistence;
- graceful behavior when upstream services and Ollama are unavailable.

## Data-adapter checklist

A new adapter must document its operator, endpoint, authentication, license/redistribution constraints, market coverage, timestamps, delays, rate limits, cache behavior, symbol mapping and failure semantics. Provider opinions such as analyst ratings must remain attributed and visually separate from local calculations.

## Pull requests

Keep changes focused. Explain the user outcome, data implications, tests performed, and screenshots when the layout changes. Update the README, architecture, provenance, roadmap, changelog, and example environment file when applicable.
