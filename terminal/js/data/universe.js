/* ==========================================================================
   TANG TERMINAL — data/universe.js
   The instrument universe: every symbol the dashboard tracks, grouped by
   widget. `live` holds the provider symbol used by the live adapter;
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
      { sym: "XAU", name: "Gold Futures",      unit: "oz", live: "xauusd", base: 3398.5, digits: 2 },
      { sym: "XAG", name: "Silver Futures",    unit: "oz", live: "xagusd", base: 38.42,  digits: 3 },
      { sym: "XPT", name: "Platinum Futures",  unit: "oz", live: "xptusd", base: 1342.0, digits: 2 },
      { sym: "XPD", name: "Palladium Futures", unit: "oz", live: "xpusd",  base: 1128.0, digits: 2 },
      { sym: "HG",  name: "Copper Futures",    unit: "lb", live: "hg.f",   base: 4.52,   digits: 3 }
    ],

    /* ------------------------------------------------------ energy complex */
    energy: [
      { sym: "CL", name: "WTI Crude", live: "cl.f", base: 63.9, digits: 2, unit: "bbl" },
      { sym: "BZ", name: "Brent Crude", live: "BZ=F", base: 67.4, digits: 2, unit: "bbl" },
      { sym: "NG", name: "Natural Gas", live: "ng.f", base: 2.94, digits: 3, unit: "MMBtu" },
      { sym: "RB", name: "RBOB Gasoline", live: "RB=F", base: 2.08, digits: 3, unit: "gal" },
      { sym: "HO", name: "Heating Oil", live: "HO=F", base: 2.18, digits: 3, unit: "gal" }
    ],

    /* ------------------------------------------- broad commodity universe */
    commodities: [
      { group: "ENERGY", members: ["CL", "BZ", "NG", "RB", "HO"] },
      { group: "METALS", members: ["XAU", "XAG", "HG", "XPT", "XPD", "ALI"] },
      { group: "AGRICULTURE", members: ["ZC", "ZW", "ZS", "KC", "SB", "CC", "CT"] },
      { group: "LIVESTOCK", members: ["LE", "HE"] }
    ],

    commodityExtras: [
      { sym: "ALI", name: "Aluminium Futures", live: "ALI=F", base: 2500, digits: 2, unit: "t" },
      { sym: "ZC", name: "Corn Futures", live: "ZC=F", base: 420, digits: 2, unit: "bu" },
      { sym: "ZW", name: "Wheat Futures", live: "ZW=F", base: 535, digits: 2, unit: "bu" },
      { sym: "ZS", name: "Soybean Futures", live: "ZS=F", base: 1020, digits: 2, unit: "bu" },
      { sym: "KC", name: "Coffee Futures", live: "KC=F", base: 310, digits: 2, unit: "lb" },
      { sym: "SB", name: "Sugar Futures", live: "SB=F", base: 18.2, digits: 2, unit: "lb" },
      { sym: "CC", name: "Cocoa Futures", live: "CC=F", base: 7350, digits: 0, unit: "t" },
      { sym: "CT", name: "Cotton Futures", live: "CT=F", base: 68, digits: 2, unit: "lb" },
      { sym: "LE", name: "Live Cattle Futures", live: "LE=F", base: 218, digits: 2, unit: "lb" },
      { sym: "HE", name: "Lean Hogs Futures", live: "HE=F", base: 95, digits: 2, unit: "lb" }
    ],

    /* ------------------------------------------------------ tanker equities */
    tankers: [
      { sym: "FRO", name: "Frontline", live: "fro.us", base: 22, digits: 2 },
      { sym: "STNG", name: "Scorpio Tankers", live: "stng.us", base: 46, digits: 2 },
      { sym: "DHT", name: "DHT Holdings", live: "dht.us", base: 12, digits: 2 },
      { sym: "INSW", name: "International Seaways", live: "insw.us", base: 42, digits: 2 },
      { sym: "TNK", name: "Teekay Tankers", live: "tnk.us", base: 48, digits: 2 },
      { sym: "NAT", name: "Nordic American", live: "nat.us", base: 3.4, digits: 2 },
      { sym: "TRMD", name: "TORM", live: "trmd.us", base: 22, digits: 2 },
      { sym: "ASC", name: "Ardmore Shipping", live: "asc.us", base: 13, digits: 2 }
    ],

    /* ------------------------------------------------ cross-asset signals */
    macro: [
      { sym: "VIX", name: "CBOE Volatility", live: "^VIX", base: 18, digits: 2 },
      { sym: "DXY", name: "US Dollar Index", live: "DX-Y.NYB", base: 98, digits: 3 },
      { sym: "US10Y", name: "US 10Y Yield", live: "^TNX", base: 4.25, digits: 3 },
      { sym: "EURUSD", name: "EUR / USD", live: "EURUSD=X", base: 1.16, digits: 4 },
      { sym: "BTC", name: "Bitcoin USD", live: "BTC-USD", base: 110000, digits: 0 }
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
    addAll(TT.universe.energy);
    addAll(TT.universe.commodityExtras);
    addAll(TT.universe.tankers);
    addAll(TT.universe.macro);
    TT.universe.heatmap.forEach(function (g) { addAll(g.members); });
    return map;
  })();
})(window.TT = window.TT || {});
