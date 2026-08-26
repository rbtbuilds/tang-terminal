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

The optional Twelve Data Basic adapter supplies OHLCV candles for free-covered symbols. TANG labels it real-time only where the provider indicates free real-time coverage, refreshes at most once per minute, and displays the free plan's venue-coverage limitation. Twelve Data states that its default US feed covers all listed US equities but represents roughly 5% of aggregate US trading volume; it is not described as a consolidated execution feed. The configured free quota is 8 API credits per minute and 800 per day.

## Derived analytics

SMA20, SMA50, RSI14, ATR14, support and resistance are calculated locally from the selected provider range. One-day, one-week, one-month, three-month, year-to-date and one-year returns, one-year maximum drawdown and annualized daily volatility are calculated from Yahoo daily closes. Bull and bear scenarios are transparent mechanical examples based on recent structure and ATR. They are not analyst consensus, recommendations, executable prices or personalized advice.

Crack-spread values are simple product-minus-crude proxies. Tanker-equity panels contain listed operators, not freight rates. Indicative map routes are visual context, not actual vessel histories.

## News and disclosures

Overview headlines are discovered through Yahoo Finance search and link to the original publisher. A headline is not independently verified by TANG.

Company-insider rows are parsed from official SEC EDGAR Form 4 XML and limited to transaction codes P and S (reported open-market purchase and sale). They are reported transactions, not real-time orders, and can include amendments or filing corrections.

Congressional rows are normalized by CongressInvests from House and Senate public disclosures, with source-document links preserved. TANG displays the adapter update state and warns when it is stale. Periodic transaction reports may legally arrive after a transaction, so the board states a lag of up to 45 days. Neither disclosure set is a complete order-flow feed or trading signal.

## Analyst research contract

Analyst recommendations are licensed, attributed research rather than public facts. Any future adapter must retain the source provider, named institution when supplied, rating/action, publication date, coverage count, target currency, freshness and entitlement level. Consensus labels such as `Strong Buy` must be presented as the provider's aggregation—not as advice from TANG or its local model. Missing or plan-restricted fields must never be inferred.

## Earnings forecasts

Live earnings dates, announcement timing, EPS estimates and revenue estimates come from the configured Finnhub calendar adapter. Finnhub describes these EPS/revenue figures as non-GAAP estimates sourced from sell-side and buy-side analysts. TANG requests the next 28 days, filters to tracked equities and watchlist symbols, caches responses for one hour, and leaves absent fields blank. The free configuration uses the US calendar; international access is entitlement-dependent.

The `BEAT-LEAN`, `MIXED`, and `MISS-LEAN` label is calculated locally from the sign of up to four available historical earnings surprises. A 67% threshold separates directional labels from mixed history. This tiny sample is not a statistical forecast, does not incorporate valuation, guidance, revisions, seasonality, options-implied moves or macro conditions, and must never be described as a probability of the next result. Demo calendar values are simulated and labelled accordingly.

For a selected US equity, the expanded sheet also reads Finnhub's nearest returned future earnings event, four historical reported surprises, latest monthly recommendation-trend counts, standardized basic metrics, and peers. TANG's `POSITIVE PLURALITY`, `NEGATIVE PLURALITY`, or `MIXED / HOLD-HEAVY` text is a transparent comparison of those counts—not a TANG rating. The free endpoint does not provide named-bank actions or price targets.

## AIS semantics

AISStream data is event-driven and has no uptime or delivery SLA. The browser receives only normalized position fields: MMSI, name, latitude, longitude, speed, course, class and observation time. Static ship classification may arrive after a position, so unknown targets remain explicitly unclassified. The configured stream covers selected energy corridors and should not be described as complete global satellite coverage.

## AI evidence contract

The Ollama prompt receives only the normalized quote snapshot and its provenance. It is instructed to avoid unsupported causation, news, flow, consensus and portfolio claims; to separate evidence from counter-signals; and to state data limitations. Model output remains probabilistic and must be verified against the displayed evidence.

## Credential handling

`.tang-terminal.env`, `.tang-finnhub.env`, and `.tang-twelvedata.env` are loaded only by the local server and ignored by Git. Upstream authentication uses headers where providers support them. API endpoints expose configuration state only, never credential values. A release ZIP containing any configured file is sensitive and should be distributed privately; rotate credentials if disclosure is suspected.
