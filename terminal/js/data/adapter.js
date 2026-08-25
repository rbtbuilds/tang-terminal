/* Data adapters: deterministic demo stream plus a local-server live feed. */
(function (TT) {
  "use strict";

  function allInstruments() {
    var seen = {};
    var result = [];
    [TT.universe.indices, TT.universe.stocks, TT.universe.metals].forEach(function (list) {
      list.forEach(function (item) {
        if (!seen[item.sym]) { seen[item.sym] = true; result.push(item); }
      });
    });
    TT.universe.heatmap.forEach(function (group) {
      group.members.forEach(function (item) {
        if (!seen[item.sym]) { seen[item.sym] = true; result.push(item); }
      });
    });
    return result;
  }

  function seededChange(symbol) {
    var hash = 0;
    for (var i = 0; i < symbol.length; i += 1) hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
    return ((Math.abs(hash) % 500) / 100) - 2.2;
  }

  function DemoAdapter(onData, onStatus) {
    this.onData = onData;
    this.onStatus = onStatus;
    this.timer = null;
    this.rows = {};
    allInstruments().forEach(function (item) {
      var change = seededChange(item.sym);
      this.rows[item.sym] = {
        sym: item.sym, price: item.base * (1 + change / 100), change: change,
        digits: item.digits || 2, source: "SIM"
      };
    }, this);
  }
  DemoAdapter.prototype.start = function () {
    var self = this;
    self.onStatus("ok", "SIMULATED");
    self.onData(self.rows);
    self.timer = window.setInterval(function () {
      Object.keys(self.rows).forEach(function (sym) {
        var row = self.rows[sym];
        var drift = (Math.random() - 0.49) * 0.045;
        row.price = Math.max(0.001, row.price * (1 + drift / 100));
        row.change += drift;
      });
      self.onData(self.rows);
    }, 2200);
  };
  DemoAdapter.prototype.stop = function () { window.clearInterval(this.timer); };

  function LiveAdapter(onData, onStatus) {
    this.onData = onData; this.onStatus = onStatus; this.timer = null; this.rows = {};
  }
  LiveAdapter.prototype.fetch = function () {
    var self = this;
    var symbols = allInstruments().map(function (x) { return x.live; }).filter(Boolean).join(",");
    self.onStatus("warn", "CONNECTING");
    return window.fetch("/api/quotes?symbols=" + encodeURIComponent(symbols), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Feed returned " + response.status);
        return response.json();
      })
      .then(function (payload) {
        var byLive = payload.quotes || {};
        allInstruments().forEach(function (item) {
          var q = byLive[item.live];
          if (q && Number.isFinite(q.price)) {
            self.rows[item.sym] = {
              sym: item.sym, price: q.price, change: Number(q.change) || 0,
              digits: item.digits || 2, source: "YAHOO FINANCE",
              timestamp: Number(q.timestamp) || 0, exchange: q.exchange || ""
            };
          }
        });
        if (!Object.keys(self.rows).length) throw new Error("No live quotes available");
        var stamp = payload.retrievedAt ? new Date(payload.retrievedAt * 1000).toISOString().slice(11, 19) : "NOW";
        self.onStatus("ok", "LIVE · " + stamp + " UTC · " + Object.keys(self.rows).length);
        self.onData(self.rows);
      })
      .catch(function () {
        self.onStatus("bad", "LIVE UNAVAILABLE");
      });
  };
  LiveAdapter.prototype.start = function () {
    var self = this;
    if (window.location.protocol === "file:") {
      self.onStatus("bad", "START LOCAL LAUNCHER");
      return;
    }
    self.fetch();
    self.timer = window.setInterval(function () { self.fetch(); }, 60000);
  };
  LiveAdapter.prototype.stop = function () { window.clearInterval(this.timer); };

  TT.data = {
    instruments: allInstruments,
    create: function (mode, onData, onStatus) {
      return mode === "live" ? new LiveAdapter(onData, onStatus) : new DemoAdapter(onData, onStatus);
    }
  };
})(window.TT = window.TT || {});
