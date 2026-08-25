# Retail research adapter roadmap

TANG aims to be an open-source research workbench, not a signal-selling product. It should help a user discover an idea, test the thesis, inspect risk, identify upcoming events and trace every external claim to a source.

## Product surfaces

| Surface | Minimum fields | Preferred source class | Status |
| --- | --- | --- | --- |
| Market briefing | headline, publisher, time, linked symbols | attributed news index | shipped |
| Movers | universe, price, change, observation time, delay | quote adapter | shipped for loaded universe |
| Insider activity | issuer, owner, side, shares, price, transaction/filing dates | SEC Form 4 | shipped |
| Congress activity | member, asset, range, action, transaction/disclosure dates, official filing | House/Senate disclosures | shipped via freshness-labelled normalizer |
| Fundamentals | revenue, margins, cash flow, leverage, shares, reporting period | SEC XBRL / issuer filings | next |
| Events | earnings, dividends, splits, economic calendar | exchange/issuer or attributed provider | next |
| Discovery screener | liquidity, momentum, relative volume, trend, valuation, event proximity | normalized quotes + fundamentals | next |
| Analyst consensus | strong buy/buy/hold/sell counts, coverage, period | licensed provider | adapter-ready |
| Rating actions | institution, action, prior/new rating, target, currency, date | licensed provider | adapter-ready |
| Institutional holdings | filer, security, value, period, filing date | SEC 13F | planned |
| Options/unusual activity | contract, volume, OI, IV, timestamp, venue scope | licensed options feed | planned |

## Evaluated analyst-data adapters

- **Finnhub** documents recommendation trends with strong-buy/buy/hold/sell counts. Consensus price targets are premium. It is a low-friction first optional adapter.
- **Twelve Data** documents recommendations, price targets, EPS revisions and named analyst ratings for US and international markets. Entitlements depend on plan.
- **Financial Modeling Prep** documents analyst estimates, targets and upgrade/downgrade consensus, including bulk surfaces. It suits broader fundamentals coverage.
- **Alpha Vantage** documents fundamentals, earnings, news sentiment, gainers/losers, insiders and calendars. Real-time or delayed mover entitlements may require a paid plan.
- **SEC EDGAR** provides keyless official submissions and XBRL facts updated throughout the day. It is preferred for US filing evidence but does not provide bank ratings.

Keys belong only in ignored `.tang-terminal.env` entries and are consumed by the local server. The browser receives normalized results plus provenance, never credentials.

## Required UX rules

- Never display an unattributed `BUY` or `STRONG BUY` badge.
- Show rating date, firm/provider and analyst coverage beside consensus.
- Keep analyst consensus, local technical calculations and Ollama commentary visually distinct.
- Flag stale data and delayed filings in the primary view.
- Let users inspect methodology and open the source whenever licensing permits.
- Do not rank thinly traded securities as “hot” without liquidity and spread warnings.
- All discovery screens need an explicit universe and timestamp.

## Suggested implementation sequence

1. Add SEC company-facts cards and an earnings/event calendar to instrument research.
2. Define a server-side `ResearchAdapter` response schema with capability flags.
3. Add one optional analyst adapter, beginning with Finnhub recommendation counts.
4. Add a reproducible discovery screener over the loaded universe; expose every filter.
5. Add 13F change tracking, followed later by licensed options-flow data.
