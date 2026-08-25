(function (TT) {
  "use strict";
  var panels = {}; var quotes = {}; var adapter = null; var settings = TT.store.getSettings();
  var canvas = document.getElementById("canvas"); var feedPill = document.getElementById("feed-status-pill"); var modePill = document.getElementById("data-mode-pill"); var aiPill = document.getElementById("ollama-pill");
  function setPill(node, state, text) { node.className = "status-pill " + state; node.textContent = text; }
  function renderWidget(id) { var widget = TT.widgets[id]; if (!widget) return null; panels[id] = widget.create(); return panels[id]; }
  function renderTicker() {
    document.getElementById("ticker-track").innerHTML = TT.universe.indices.concat(TT.universe.metals).map(function (item) {
      var q = quotes[item.sym]; return '<span class="ticker-item"><span class="t-sym">' + item.sym + '</span> ' + (q ? TT.widgets.format(q.price, item.digits) + ' <span class="' + TT.widgets.valueClass(q.change) + '">' + (q.change >= 0 ? '▲' : '▼') + ' ' + Math.abs(q.change).toFixed(2) + '%</span>' : '—') + '</span>';
    }).join("");
  }
  function renderQuotes() { ["indices", "heatmap", "stocks", "metals"].forEach(function (id) { if (panels[id] && panels[id].update) panels[id].update(quotes); }); renderTicker(); }
  function onData(next) { Object.keys(next).forEach(function (key) { quotes[key] = next[key]; }); renderQuotes(); }
  function onStatus(state, text) { setPill(feedPill, state, "FEED: " + text); }
  function startAdapter() { if (adapter) adapter.stop(); quotes = {}; renderQuotes(); adapter = TT.data.create(settings.dataMode, onData, onStatus); setPill(modePill, settings.dataMode === "live" ? "ok" : "warn", "MODE: " + settings.dataMode.toUpperCase()); document.getElementById("btn-toggle-mode").textContent = "DATA: " + settings.dataMode.toUpperCase(); adapter.start(); }
  TT.app = {
    setAIStatus: function (state, text) { setPill(aiPill, state, "AI: " + text); },
    marketSnapshot: function () { return "Mode: " + settings.dataMode.toUpperCase() + "\n" + Object.keys(quotes).map(function (sym) { var q = quotes[sym]; return sym + " " + q.price.toFixed(q.digits) + " " + (q.change >= 0 ? "+" : "") + q.change.toFixed(2) + "%"; }).join("\n"); }
  };
  TT.grid.mount(canvas, TT.store.getLayout(), renderWidget);
  startAdapter();
  document.getElementById("btn-toggle-mode").addEventListener("click", function () { settings.dataMode = settings.dataMode === "demo" ? "live" : "demo"; TT.store.saveSettings(settings); startAdapter(); });
  document.getElementById("btn-reset-layout").addEventListener("click", function () { if (window.confirm("Restore the default panel layout?")) { Object.keys(panels).forEach(function (id) { if (panels[id]._timer) window.clearInterval(panels[id]._timer); }); panels = {}; TT.grid.mount(canvas, TT.store.resetLayout(), renderWidget); onData(quotes); } });
  document.getElementById("btn-fullscreen").addEventListener("click", function () { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(function () {}); } else { document.exitFullscreen().catch(function () {}); } });
  function clock() { document.getElementById("utc-clock").textContent = new Date().toISOString().slice(11, 19) + " UTC"; }
  clock(); window.setInterval(clock, 1000);
})(window.TT = window.TT || {});
