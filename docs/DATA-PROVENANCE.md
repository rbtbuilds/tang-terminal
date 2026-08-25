# Data provenance and trust model

TANG is a monitoring and educational research interface, not an execution or entitlement system. Connected does not mean every value is real-time.

## Quote metadata

Normalized quotes carry:

- display symbol and provider symbol;
- price and change from the provider's previous close;
- exchange and currency when supplied;
- market observation timestamp;
- local retrieval timestamp;
- provider name;
- documented delay in minutes when known.

The research drawer exposes these fields. A missing delay is labelled unknown, never assumed to be zero. Demo values are labelled `SIMULATED — NOT MARKET DATA`.

Yahoo Finance documents exchange-specific delays and restrictions. TANG currently applies conservative labels for the supported suffixes and futures used by the built-in universe. Those mappings must be reviewed when providers or instruments change.

## Derived analytics

SMA20, SMA50, RSI14, ATR14, support and resistance are calculated locally from the selected provider range. Bull and bear scenarios are transparent mechanical examples based on recent structure and ATR. They are not analyst consensus, recommendations, executable prices or personalized advice.

Crack-spread values are simple product-minus-crude proxies. Tanker-equity panels contain listed operators, not freight rates. Indicative map routes are visual context, not actual vessel histories.

## AIS semantics

AISStream data is event-driven and has no uptime or delivery SLA. The browser receives only normalized position fields: MMSI, name, latitude, longitude, speed, course, class and observation time. Static ship classification may arrive after a position, so unknown targets remain explicitly unclassified. The configured stream covers selected energy corridors and should not be described as complete global satellite coverage.

## AI evidence contract

The Ollama prompt receives only the normalized quote snapshot and its provenance. It is instructed to avoid unsupported causation, news, flow, consensus and portfolio claims; to separate evidence from counter-signals; and to state data limitations. Model output remains probabilistic and must be verified against the displayed evidence.

## Credential handling

`.tang-terminal.env` is loaded by the local server and ignored by Git. API endpoints must expose configuration state only, never credential values. A release ZIP containing that file is sensitive and should be distributed privately; rotate the credential if disclosure is suspected.

