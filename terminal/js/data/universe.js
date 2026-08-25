/* ==========================================================================
   TANG TERMINAL — data/universe.js
   The instrument universe: every symbol the dashboard tracks, grouped by
   widget. `live` holds the symbol used by the live adapter (Stooq format);
   `base` is the demo adapter's anchor price; `digits` controls formatting.
   ========================================================================== */
(function (TT) {
  "use strict";

  TT.universe = {
    /* ------------------------------------------------------ global indices */
    indices: [
      { sym: "SPX",    name: "S&P 500",      region: "US",  live: "^spx",  base: 6420.5,  digits: 2 },
      { sym: "NDX",    name: "Nasdaq 100",   region: "US",  live: "^ndq",  base: 23410.2, digits: 2 },
      { sym: "DJI",    name: "Dow Jones",    region: "US",  live: "^dji",  base: 44910.8, digits: 2 },
      { sym: "FTSE",   name: "FTSE 100",     region: "UK",  live: "^ukx",  base: 9155.4,  digits: 2 },
      { sym: "DAX",    name: "DAX 40",       region: "DE",  live: "^dax",  base: 24360.1, digits: 2 },
      { sym: "CAC",    name: "CAC 40",       region: "FR",  live: "^cac",  base: 7950.3,  digits: 2 },
      { sym: "N225",   name: "Nikkei 225",   region: "JP",  live: "^nkx",  base: 42710.6, digits: 2 },
      { sym: "HSI",    name: "Hang Seng",    region: "HK",  live: "^hsi",  base: 25390.7, digits: 2 },
      { sym: "SHCOMP", name: "Shanghai Comp",region: "CN",  live: "^shc",  base: 3825.9,  digits: 2 },
      { sym: "ASX",    name: "ASX 200",      region: "AU",  live: "^axd",  base: 8960.2,  digits: 2 }
    ],

    /* ------------------------------------- heatmap groups (AI / energy / fin) */
    heatmap: [
      {
        group: "AI & SEMIS",
        weight: 3,
        members: [
          { sym: "NVDA", name: "NVIDIA",     live: "nvda.us", base: 182.7,  digits: 2 },
          { sym: "MSFT", name: "Microsoft",  live: "msft.us", base: 505.1,  digits: 2 },
          { sym: "GOOGL",name: "Alphabet",   live: "googl.us",base: 205.4,  digits: 2 },
          { sym: "AMD",  name: "AMD",        live: "amd.us",  base: 176.3,  digits: 2 },
          { sym: "TSM",  name: "TSMC",       live: "tsm.us",  base: 241.8,  digits: 2 },
          { sym: "AVGO", name: "Broadcom",   live: "avgo.us", base: 298.6,  digits: 2 }
        ]
      },
      {
        group: "ENERGY",
        weight: 2,
        members: [
          { sym: "XOM",  name: "ExxonMobil", live: "xom.us",  base: 108.4,  digits: 2 },
          { sym: "CVX",  name: "Chevron",    live: "cvx.us",  base: 156.9,  digits: 2 },
          { sym: "SHEL", name: "Shell",      live: "shel.us", base: 72.3,   digits: 2 },
          { sym: "CL",   name: "WTI Crude",  live: "cl.f",    base: 63.9,   digits: 2 },
          { sym: "NG",   name: "Nat Gas",    live: "ng.f",    base: 2.94,   digits: 3 }
        ]
      },
      {
        group: "FINANCIALS",
        weight: 2,
        members: [
          { sym: "JPM",  name: "JPMorgan",   live: "jpm.us",  base: 291.5,  digits: 2 },
          { sym: "GS",   name: "Goldman",    live: "gs.us",   base: 726.8,  digits: 2 },
          { sym: "BAC",  name: "BofA",       live: "bac.us",  base: 48.6,   digits: 2 },
          { sym: "V",    name: "Visa",       live: "v.us",    base: 342.1,  digits: 2 },
          { sym: "BRK.B",name: "Berkshire",  live: "brk-b.us",base: 473.2,  digits: 2 }
        ]
      }
    ],

    /* ------------------------------------------------------ biggest stocks */
    stocks: [
      { sym: "NVDA", name: "NVIDIA",      live: "nvda.us",  base: 182.7,  digits: 2, mcap: 4460 },
      { sym: "MSFT", name: "Microsoft",   live: "msft.us",  base: 505.1,  digits: 2, mcap: 3755 },
      { sym: "AAPL", name: "Apple",       live: "aapl.us",  base: 232.6,  digits: 2, mcap: 3450 },
      { sym: "GOOGL",name: "Alphabet",    live: "googl.us", base: 205.4,  digits: 2, mcap: 2490 },
      { sym: "AMZN", name: "Amazon",      live: "amzn.us",  base: 228.9,  digits: 2, mcap: 2430 },
      { sym: "META", name: "Meta",        live: "meta.us",  base: 748.2,  digits: 2, mcap: 1900 },
      { sym: "AVGO", name: "Broadcom",    live: "avgo.us",  base: 298.6,  digits: 2, mcap: 1400 },
      { sym: "TSLA", name: "Tesla",       live: "tsla.us",  base: 335.5,  digits: 2, mcap: 1080 },
      { sym: "BRK.B",name: "Berkshire B", live: "brk-b.us", base: 473.2,  digits: 2, mcap: 1020 },
      { sym: "JPM",  name: "JPMorgan",    live: "jpm.us",   base: 291.5,  digits: 2, mcap: 810  }
    ],

    /* ------------------------------------------------------- precious metals */
    metals: [
      { sym: "XAU", name: "Gold",      unit: "oz", live: "xauusd", base: 3398.5, digits: 2 },
      { sym: "XAG", name: "Silver",    unit: "oz", live: "xagusd", base: 38.42,  digits: 3 },
      { sym: "XPT", name: "Platinum",  unit: "oz", live: "xptusd", base: 1342.0, digits: 2 },
      { sym: "XPD", name: "Palladium", unit: "oz", live: "xpusd",  base: 1128.0, digits: 2 },
      { sym: "HG",  name: "Copper",    unit: "lb", live: "hg.f",   base: 4.52,   digits: 3 }
    ],

    /* -------------------------------------------------------- world clocks */
    clocks: [
      { city: "SYDNEY",     tz: "Australia/Sydney",     open: 10, close: 16 },
      { city: "TOKYO",      tz: "Asia/Tokyo",           open: 9,  close: 15 },
      { city: "SHANGHAI",   tz: "Asia/Shanghai",        open: 9,  close: 15 },
      { city: "FRANKFURT",  tz: "Europe/Berlin",        open: 9,  close: 17 },
      { city: "LONDON",     tz: "Europe/London",        open: 8,  close: 16 },
      { city: "NEW YORK",   tz: "America/New_York",     open: 9,  close: 16 },
      { city: "CHICAGO",    tz: "America/Chicago",      open: 8,  close: 15 },
      { city: "LOS ANGELES",tz: "America/Los_Angeles",  open: 6,  close: 13 }
    ]
  };

  /** Flat lookup: display symbol -> instrument definition. */
  TT.universe.index = (function () {
    var map = {};
    function addAll(list) {
      list.forEach(function (inst) { map[inst.sym] = inst; });
    }
    addAll(TT.universe.indices);
    addAll(TT.universe.stocks);
    addAll(TT.universe.metals);
    TT.universe.heatmap.forEach(function (g) { addAll(g.members); });
    return map;
  })();
})(window.TT = window.TT || {});
