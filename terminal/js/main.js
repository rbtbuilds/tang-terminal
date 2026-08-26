(function (TT) {
  "use strict";

  var panels = {}; var quotes = {}; var adapter = null; var settings = TT.store.getSettings();
  var canvas = document.getElementById("canvas");
  var feedPill = document.getElementById("feed-status-pill");
  var modePill = document.getElementById("data-mode-pill");
  var aiPill = document.getElementById("ollama-pill");
  var symbolOverlay = document.getElementById("symbol-overlay");
  var widgetOverlay = document.getElementById("widget-overlay");
  var layoutEditing = false;
  var pageCopy = {
    overview: ["GLOBAL OVERVIEW", "Morning board & disclosure monitor", "QUOTES · NEWS · MOVERS · PUBLIC FILINGS"],
    markets: ["CROSS-ASSET MARKETS", "Indices, sectors and leaders", "SELECT A SYMBOL TO OPEN RESEARCH"],
    energy: ["ENERGY DESK", "Energy and commodity complex", "CURVES · SPREADS · EQUITIES · MACRO"],
    shipping: ["SHIPPING INTELLIGENCE", "Vessel flows and tanker markets", "AIS CORRIDORS · PORTS · ENERGY ROUTES"],
    research: ["RESEARCH WORKSPACE", "Evidence-led market analysis", "WATCHLIST · EVENTS · LOCAL AI"]
  };
  var widgetCatalog = [
    { id: "clocks", title: "World Session Clocks", description: "Eight global trading sessions", size: "lg" },
    { id: "indices", title: "Global Indices", description: "Major US, European and Asian benchmarks", size: "md" },
    { id: "heatmap", title: "Sector Pulse", description: "AI, energy and financial heatmap", size: "md" },
    { id: "stocks", title: "Mega-cap Stocks", description: "Largest global US-listed equities", size: "md" },
    { id: "watchlist", title: "Watchlist", description: "Your persistent custom instrument list", size: "md" },
    { id: "metals", title: "Precious Metals", description: "Gold, silver, copper, platinum and palladium", size: "sm" },
    { id: "energy", title: "Energy Complex", description: "WTI, Brent, gas and refined products", size: "md" },
    { id: "commodities", title: "Commodity Matrix", description: "Energy, metals, agriculture and livestock", size: "md" },
    { id: "tankers", title: "Tanker Equities", description: "Crude and product tanker operators", size: "md" },
    { id: "macro", title: "Cross-asset Signals", description: "Volatility, USD, yields, FX and crypto", size: "md" },
    { id: "shipping", title: "Global Shipping Map", description: "Local world map with optional live AIS vessel positions", size: "lg" },
    { id: "news", title: "Market News", description: "Recent cross-asset publisher headlines", size: "md" },
    { id: "action", title: "Market Action", description: "Recent movers and mechanical educational setups", size: "md" },
    { id: "earnings", title: "Earnings Radar", description: "Upcoming reports, analyst estimates and surprise-history lean", size: "lg" },
    { id: "disclosures", title: "Disclosure Monitor", description: "SEC insider and Congressional transaction filings", size: "lg" }
  ];

  function setPill(node, state, text) { node.className = "status-pill " + state; node.textContent = text; }
  function renderWidget(id) { var widget = TT.widgets[id]; if (!widget) return null; panels[id] = widget.create(); return panels[id]; }

  function renderTicker() {
    document.getElementById("ticker-track").innerHTML = TT.universe.indices.concat(TT.universe.energy.slice(0, 3), TT.universe.metals.slice(0, 2)).map(function (item) {
      var quote = quotes[item.sym];
      return '<button class="ticker-item quote-action" data-symbol="' + item.sym + '"><span class="t-sym">' + item.sym + '</span> ' + (quote ? TT.widgets.format(quote.price, item.digits) + ' <span class="' + TT.widgets.valueClass(quote.change) + '">' + (quote.change >= 0 ? '▲' : '▼') + ' ' + Math.abs(quote.change).toFixed(2) + '%</span>' : '—') + '</button>';
    }).join("");
  }

  function renderWatchRail() {
    var symbols = TT.watchlist.get();
    var list = document.getElementById("watch-rail-list");
    if (!symbols.length) {
      list.innerHTML = '<button class="rail-empty" id="rail-empty-add">NO SYMBOLS<br><span>+ ADD TICKER</span></button>';
      return;
    }
    list.innerHTML = symbols.map(function (symbol) {
      var item = TT.universe.index[symbol] || { name: symbol, digits: 2 };
      var quote = quotes[symbol];
      return '<button class="rail-quote quote-action" data-symbol="' + TT.widgets.escapeHTML(symbol) + '"><span><strong>' + TT.widgets.escapeHTML(symbol) + '</strong><small>' + TT.widgets.escapeHTML(item.name) + '</small></span><span class="' + (quote ? TT.widgets.valueClass(quote.change) : "faint") + '">' + (quote ? (quote.change >= 0 ? "+" : "") + quote.change.toFixed(2) + "%" : "—") + '</span></button>';
    }).join("");
  }

  function renderQuotes() {
    Object.keys(panels).forEach(function (id) { if (panels[id] && panels[id].update) panels[id].update(quotes); });
    renderTicker(); renderWatchRail();
    window.requestAnimationFrame(function () { TT.grid.refresh(canvas); });
  }

  function onData(next) { Object.keys(next).forEach(function (key) { quotes[key] = next[key]; }); renderQuotes(); }
  function onStatus(state, text) { setPill(feedPill, state, "FEED: " + text); }

  function startAdapter() {
    if (adapter) adapter.stop(); quotes = {}; renderQuotes();
    adapter = TT.data.create(settings.dataMode, onData, onStatus);
    setPill(modePill, settings.dataMode === "live" ? "ok" : "warn", "MODE: " + settings.dataMode.toUpperCase());
    document.getElementById("btn-toggle-mode").textContent = "DATA: " + settings.dataMode.toUpperCase();
    adapter.start();
  }

  function disposePanels() {
    Object.keys(panels).forEach(function (id) {
      if (panels[id]._timer) window.clearInterval(panels[id]._timer);
      if (panels[id]._unsubscribe) panels[id]._unsubscribe();
      if (panels[id]._observer) panels[id]._observer.disconnect();
    });
  }

  function renderWorkspaceTabs() {
    var active = TT.store.getActiveWorkspace(); var tabs = document.getElementById("workspace-tabs"); tabs.innerHTML = "";
    TT.store.getWorkspaces().forEach(function (workspace) {
      var button = document.createElement("button"); button.className = "workspace-tab" + (workspace.id === active ? " active" : ""); button.textContent = workspace.label; button.addEventListener("click", function () { if (workspace.id !== TT.store.getActiveWorkspace()) { TT.store.setActiveWorkspace(workspace.id); window.location.hash = workspace.id; mountWorkspace(); } }); tabs.appendChild(button);
    });
  }

  function mountWorkspace() {
    disposePanels(); panels = {}; TT.grid.mount(canvas, TT.store.getLayout(), renderWidget); renderQuotes(); renderWorkspaceTabs();
    var active = TT.store.getActiveWorkspace(); var copy = pageCopy[active] || pageCopy.overview;
    document.getElementById("page-kicker").textContent = copy[0];
    document.getElementById("page-title").textContent = copy[1];
    document.getElementById("page-meta").textContent = copy[2];
    TT.grid.setEditing(canvas, layoutEditing);
  }

  function applyFontScale(next) {
    settings.fontScale = Math.max(0.85, Math.min(1.45, Math.round(next * 20) / 20));
    document.documentElement.style.setProperty("--font-scale", settings.fontScale);
    document.getElementById("font-scale").textContent = Math.round(settings.fontScale * 100) + "%";
    settings = TT.store.updateSettings({ fontScale: settings.fontScale });
    window.requestAnimationFrame(function () { TT.grid.refresh(canvas); });
  }

  function closeModal(overlay) { overlay.hidden = true; }
  function openSymbolSearch(prefill) {
    symbolOverlay.hidden = false; document.getElementById("symbol-results").innerHTML = "";
    if (prefill) document.getElementById("symbol-search-input").value = prefill;
    window.setTimeout(function () { document.getElementById("symbol-search-input").focus(); }, 0);
  }

  function renderSymbolResults(results) {
    var container = document.getElementById("symbol-results"); container.innerHTML = "";
    if (!results.length) { container.innerHTML = '<div class="detail-empty">No matching instruments found. Try the exchange suffix, such as BP.L for London.</div>'; return; }
    results.forEach(function (result) {
      var row = document.createElement("div"); row.className = "symbol-result";
      var info = document.createElement("div"); var symbol = document.createElement("strong"); var name = document.createElement("span"); var meta = document.createElement("small");
      symbol.textContent = result.symbol; name.textContent = result.name; meta.textContent = (result.exchange || "UNKNOWN EXCHANGE") + " · " + (result.type || "SECURITY");
      info.appendChild(symbol); info.appendChild(name); info.appendChild(meta);
      var button = document.createElement("button"); button.textContent = TT.watchlist.contains(result.symbol.toUpperCase()) ? "★ WATCHING" : "+ WATCHLIST";
      button.addEventListener("click", function () {
        var instrument = TT.symbols.register(result); TT.watchlist.add(instrument.sym);
        if (!TT.store.getLayout().some(function (entry) { return entry.id === "watchlist"; })) TT.store.addWidget("watchlist", "md");
        button.textContent = "★ WATCHING"; mountWorkspace(); startAdapter();
      });
      row.appendChild(info); row.appendChild(button); container.appendChild(row);
    });
  }

  function renderWidgetPicker() {
    var container = document.getElementById("widget-results"); var layout = TT.store.getLayout(); container.innerHTML = "";
    widgetCatalog.forEach(function (widget) {
      var present = layout.some(function (entry) { return entry.id === widget.id; }); var card = document.createElement("div"); card.className = "widget-option";
      var copy = document.createElement("div"); var heading = document.createElement("strong"); var description = document.createElement("span"); heading.textContent = widget.title; description.textContent = widget.description; copy.appendChild(heading); copy.appendChild(description);
      var button = document.createElement("button"); button.textContent = present ? "ADDED" : "+ ADD"; button.disabled = present;
      button.addEventListener("click", function () { TT.store.addWidget(widget.id, widget.size); mountWorkspace(); renderWidgetPicker(); });
      card.appendChild(copy); card.appendChild(button); container.appendChild(card);
    });
  }

  TT.app = {
    setAIStatus: function (state, text) { setPill(aiPill, state, "AI: " + text); },
    removeWidget: function (id) { TT.store.removeWidget(id); mountWorkspace(); },
    refreshData: startAdapter,
    marketSnapshot: function () {
      var timestamps = Object.keys(quotes).map(function (symbol) { return quotes[symbol].timestamp || 0; }); var latest = Math.max.apply(Math, timestamps.concat([0]));
      return "Mode: " + settings.dataMode.toUpperCase() + "\nProvider: " + (settings.dataMode === "live" ? "Yahoo Finance; exchange-dependent real-time or delayed indications" : "local simulation; not market data") + "\nLatest observation: " + (latest ? new Date(latest * 1000).toISOString() : new Date().toISOString()) + "\nCoverage limits: No fund flows, positions, options flow, broad analyst ratings, or live freight rates. Commodity values are front-month futures proxies.\n" + Object.keys(quotes).map(function (symbol) { var quote = quotes[symbol]; var instrument = TT.universe.index[symbol] || { name: symbol }; var delay = quote.delayMinutes == null ? "delay unknown" : quote.delayMinutes ? quote.delayMinutes + "m delayed" : "real-time indicated"; return symbol + " (" + instrument.name + ") " + quote.price.toFixed(quote.digits) + " " + (quote.change >= 0 ? "+" : "") + quote.change.toFixed(2) + "% | " + delay + " | observed " + (quote.timestamp ? new Date(quote.timestamp * 1000).toISOString() : "unknown"); }).join("\n") + "\n\n" + TT.intelligence.snapshotText() + "\n\n" + TT.earnings.snapshotText();
    }
  };

  function mountAssistantDock() {
    var dock = document.getElementById("ai-dock"); var content = document.getElementById("ai-dock-content"); var toggle = document.getElementById("ai-dock-toggle");
    var open = settings.aiDockOpen !== false; var assistant = TT.widgets.assistant.create();
    assistant.classList.add("dock-assistant-panel"); content.appendChild(assistant);
    function apply() { dock.classList.toggle("collapsed", !open); toggle.textContent = open ? "COLLAPSE ↓" : "OPEN TANG AI ↑"; toggle.setAttribute("aria-expanded", String(open)); }
    toggle.addEventListener("click", function () { open = !open; settings.aiDockOpen = open; settings = TT.store.updateSettings({ aiDockOpen: open }); apply(); });
    apply();
  }

  var initialWorkspace = window.location.hash.slice(1);
  if (pageCopy[initialWorkspace]) TT.store.setActiveWorkspace(initialWorkspace);
  applyFontScale(Number(settings.fontScale) || 1); mountWorkspace(); mountAssistantDock(); startAdapter();
  document.getElementById("btn-toggle-mode").addEventListener("click", function () { settings.dataMode = settings.dataMode === "demo" ? "live" : "demo"; settings = TT.store.updateSettings({ dataMode: settings.dataMode }); TT.earnings.clear(); startAdapter(); });
  document.getElementById("btn-reset-layout").addEventListener("click", function () { if (window.confirm("Restore this workspace's default panels?")) { TT.store.resetLayout(); mountWorkspace(); } });
  document.getElementById("btn-fullscreen").addEventListener("click", function () { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); else document.exitFullscreen().catch(function () {}); });
  document.getElementById("btn-font-down").addEventListener("click", function () { applyFontScale(settings.fontScale - 0.1); });
  document.getElementById("btn-font-up").addEventListener("click", function () { applyFontScale(settings.fontScale + 0.1); });
  document.getElementById("btn-add-symbol").addEventListener("click", function () { openSymbolSearch(); });
  document.getElementById("rail-add-symbol").addEventListener("click", function () { openSymbolSearch(); });
  document.getElementById("watch-rail-list").addEventListener("click", function (event) { if (event.target.closest("#rail-empty-add")) openSymbolSearch(); });
  document.getElementById("btn-edit-layout").addEventListener("click", function (event) {
    layoutEditing = !layoutEditing; TT.grid.setEditing(canvas, layoutEditing);
    event.currentTarget.setAttribute("aria-pressed", String(layoutEditing));
    event.currentTarget.textContent = layoutEditing ? "DONE" : "EDIT LAYOUT";
  });
  document.getElementById("btn-add-widget").addEventListener("click", function () { renderWidgetPicker(); widgetOverlay.hidden = false; });
  document.getElementById("symbol-search-form").addEventListener("submit", function (event) {
    event.preventDefault(); var query = document.getElementById("symbol-search-input").value.trim(); var results = document.getElementById("symbol-results"); if (!query) return;
    if (window.location.protocol === "file:") { results.innerHTML = '<div class="detail-error">Global search requires the local launcher.</div>'; return; }
    results.innerHTML = '<div class="detail-loading"><span class="loader"></span> SEARCHING GLOBAL MARKETS</div>';
    window.fetch("/api/search?q=" + encodeURIComponent(query), { cache: "no-store" }).then(function (response) { if (!response.ok) throw new Error("Search unavailable"); return response.json(); }).then(function (payload) { renderSymbolResults(payload.results || []); }).catch(function (error) { results.innerHTML = '<div class="detail-error">' + error.message + '</div>'; });
  });
  document.getElementById("command-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var input = document.getElementById("command-input"); var query = input.value.trim(); var upper = query.toUpperCase();
    var workspaceAliases = { OVERVIEW: "overview", MARKETS: "markets", ENERGY: "energy", COMMODITIES: "energy", SHIPPING: "shipping", MAP: "shipping", RESEARCH: "research", AI: "research" };
    if (workspaceAliases[upper]) { TT.store.setActiveWorkspace(workspaceAliases[upper]); window.location.hash = workspaceAliases[upper]; mountWorkspace(); input.value = ""; return; }
    var symbol = upper.split(/\s+/)[0];
    if (TT.universe.index[symbol]) { TT.details.open(symbol); input.value = ""; return; }
    openSymbolSearch(query); input.value = "";
  });
  document.querySelectorAll(".modal-close").forEach(function (button) { button.addEventListener("click", function () { closeModal(button.closest(".modal-overlay")); }); });
  [symbolOverlay, widgetOverlay].forEach(function (overlay) { overlay.addEventListener("click", function (event) { if (event.target === overlay) closeModal(overlay); }); });
  document.addEventListener("click", function (event) { var target = event.target.closest("[data-symbol]"); if (target) TT.details.open(target.dataset.symbol); });
  document.addEventListener("keydown", function (event) { var target = event.target.closest && event.target.closest("[data-symbol]"); if (target && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); TT.details.open(target.dataset.symbol); } if (event.key === "Escape") { closeModal(symbolOverlay); closeModal(widgetOverlay); } });
  function clock() { document.getElementById("utc-clock").textContent = new Date().toISOString().slice(11, 19) + " UTC"; }
  clock(); window.setInterval(clock, 1000);
})(window.TT = window.TT || {});
