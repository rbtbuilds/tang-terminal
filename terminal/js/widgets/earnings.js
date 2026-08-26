(function (TT) {
  "use strict";
  function compactMoney(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return number >= 1000000000 ? "$" + (number / 1000000000).toFixed(1) + "B" : "$" + (number / 1000000).toFixed(0) + "M";
  }
  function eventTime(hour) {
    return { bmo: "BEFORE OPEN", amc: "AFTER CLOSE", dmh: "MARKET HOURS" }[String(hour || "").toLowerCase()] || "TIME TBC";
  }
  function dayLabel(value) {
    var date = new Date(value + "T12:00:00Z");
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  }
  function leanClass(lean) { return lean === "BEAT-LEAN" ? "up" : lean === "MISS-LEAN" ? "down" : "flat"; }

  TT.widgets.earnings = {
    create: function () {
      var panel = TT.widgets.panel("earnings", "EARNINGS RADAR · UPCOMING & CONSENSUS");
      var body = panel.querySelector(".panel-body"); var activeMode = "";
      function render(payload) {
        if (!payload.configured) {
          body.innerHTML = '<div class="earnings-setup"><strong>LIVE EARNINGS ADAPTER NOT CONFIGURED</strong><p>Add <code>TANG_FINNHUB_API_KEY</code> to the ignored <code>.tang-terminal.env</code> file, then restart TANG.</p><a href="https://finnhub.io/register" target="_blank" rel="noopener">GET A FINNHUB KEY ↗</a></div>';
          return;
        }
        if (!payload.events.length) {
          body.innerHTML = '<div class="brief-empty">' + (payload.error ? "EARNINGS FEED TEMPORARILY UNAVAILABLE" : "NO TRACKED EARNINGS IN THE NEXT 28 DAYS") + '</div>';
          return;
        }
        body.innerHTML = '<div class="earnings-table"><div class="earnings-head"><span>DATE / EVENT</span><span>CONSENSUS FORECAST</span><span>HISTORY-BASED LEAN</span></div>' + payload.events.map(function (event) {
          var instrument = TT.universe.index[event.symbol] || { name: event.symbol };
          var eps = Number(event.epsEstimate);
          var forecast = Number.isFinite(eps) ? "EPS " + (eps >= 0 ? "$" : "−$") + Math.abs(eps).toFixed(2) : "EPS —";
          var history = event.historyQuarters ? event.recentBeatRate + "% BEATS · " + event.historyQuarters + "Q" : "INSUFFICIENT HISTORY";
          return '<button class="earnings-row quote-action" data-symbol="' + TT.widgets.escapeHTML(event.symbol) + '"><span class="earnings-event"><b>' + dayLabel(event.date) + '</b><strong>' + TT.widgets.escapeHTML(event.symbol) + ' <small>' + TT.widgets.escapeHTML(instrument.name) + '</small></strong><em>' + eventTime(event.hour) + '</em></span><span class="earnings-forecast"><strong>' + forecast + '</strong><small>REVENUE ' + compactMoney(event.revenueEstimate) + '</small></span><span class="earnings-lean ' + leanClass(event.lean) + '"><strong>' + TT.widgets.escapeHTML(event.lean || "NO EDGE") + '</strong><small>' + history + '</small></span></button>';
        }).join("") + '</div><p class="widget-note">' + TT.widgets.escapeHTML(payload.provider) + (payload.demo ? " · illustrative demo estimates" : " · non-GAAP analyst estimates from sell-side and buy-side contributors") + '. The beat/miss lean uses only the last four available surprise outcomes; it is a weak historical heuristic, not an earnings prediction or recommendation.</p>';
        window.requestAnimationFrame(function () { TT.grid.refresh(document.getElementById("canvas")); });
      }
      panel.update = function () {
        var mode = TT.store.getSettings().dataMode;
        if (mode === activeMode) return;
        activeMode = mode; body.innerHTML = '<div class="brief-loading">LOADING UPCOMING EARNINGS…</div>';
        TT.earnings.load(mode).then(render);
      };
      panel.update(); return panel;
    }
  };
})(window.TT = window.TT || {});
