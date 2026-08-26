(function (TT) {
  "use strict";
  var requests = {};

  function equitySymbols() {
    var seen = {}; var symbols = [];
    [TT.universe.stocks, TT.universe.tankers].forEach(function (list) {
      list.forEach(function (item) { if (!seen[item.sym]) { seen[item.sym] = true; symbols.push(item.sym); } });
    });
    TT.universe.heatmap.forEach(function (group) {
      group.members.forEach(function (item) {
        if (!/^(CL|NG)$/.test(item.sym) && !seen[item.sym]) { seen[item.sym] = true; symbols.push(item.sym); }
      });
    });
    TT.watchlist.get().forEach(function (symbol) { if (!seen[symbol]) { seen[symbol] = true; symbols.push(symbol); } });
    return symbols;
  }

  function demoPayload() {
    var day = 86400000; var start = Date.now();
    var samples = [
      ["NVDA", 1, "amc", 1.42, 39800000000, 75, "BEAT-LEAN"],
      ["AAPL", 3, "amc", 1.78, 98500000000, 50, "MIXED"],
      ["MSFT", 6, "amc", 3.31, 76700000000, 67, "BEAT-LEAN"],
      ["AVGO", 9, "amc", 1.66, 15800000000, 75, "BEAT-LEAN"],
      ["AMZN", 13, "amc", 1.47, 159000000000, 50, "MIXED"],
      ["META", 16, "amc", 6.18, 49100000000, 25, "MISS-LEAN"]
    ];
    return { configured: true, demo: true, provider: "SIMULATED — NOT MARKET DATA", retrievedAt: Math.floor(start / 1000), events: samples.map(function (row) {
      return { symbol: row[0], date: new Date(start + row[1] * day).toISOString().slice(0, 10), hour: row[2], epsEstimate: row[3], revenueEstimate: row[4], recentBeatRate: row[5], historyQuarters: 4, lean: row[6] };
    }) };
  }

  TT.earnings = {
    load: function (mode) {
      var result;
      if (mode === "demo") result = Promise.resolve(demoPayload());
      else if (window.location.protocol === "file:") result = Promise.resolve({ configured: false, offline: true, events: [] });
      else if (!requests.live) {
        requests.live = window.fetch("/api/earnings?symbols=" + encodeURIComponent(equitySymbols().join(",")), { cache: "no-store" })
          .then(function (response) { if (!response.ok) throw new Error("Earnings feed unavailable"); return response.json(); })
          .catch(function (error) { return { configured: true, events: [], error: error.message }; });
        result = requests.live;
      } else {
        result = requests.live;
      }
      return result.then(function (payload) { TT.earnings.latest = payload; return payload; });
    },
    clear: function () { requests = {}; TT.earnings.latest = null; },
    snapshotText: function () {
      var payload = TT.earnings.latest;
      if (!payload) return "Earnings calendar: not loaded.";
      if (!payload.configured) return "Earnings calendar: live adapter not configured.";
      return "UPCOMING EARNINGS (" + payload.provider + "):\n" + ((payload.events || []).slice(0, 8).map(function (event) {
        return "- " + event.symbol + " " + event.date + " " + (event.hour || "time TBC") + " | EPS consensus " + (event.epsEstimate == null ? "unavailable" : event.epsEstimate) + " | recent-surprise lean " + (event.lean || "NO EDGE");
      }).join("\n") || "- no tracked events in the current window");
    }
  };
})(window.TT = window.TT || {});
