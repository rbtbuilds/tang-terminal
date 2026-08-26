/* On-demand instrument research: candles, performance, events, fundamentals and news. */
(function (TT) {
  "use strict";

  var overlay = document.getElementById("detail-overlay");
  var content = document.getElementById("detail-content");
  var title = document.getElementById("detail-title");
  var currentSymbol = ""; var currentRange = "3mo"; var lastPayload = null;
  var refreshTimer = null; var requestNumber = 0;
  var settings = TT.store.getSettings(); var currentProvider = settings.chartProvider || "yahoo";
  var currentChartStyle = settings.chartStyle === "line" ? "line" : "candles";
  var ranges = [
    { value: "1d", label: "1D" }, { value: "5d", label: "5D" },
    { value: "1mo", label: "1M" }, { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" }, { value: "1y", label: "1Y" },
    { value: "5y", label: "5Y" }
  ];

  function escapeHTML(value) {
    var node = document.createElement("span"); node.textContent = String(value == null ? "" : value); return node.innerHTML;
  }
  function mean(values) { return values.length ? values.reduce(function (sum, value) { return sum + value; }, 0) / values.length : null; }
  function sma(closes, period) { return closes.length < period ? null : mean(closes.slice(-period)); }
  function rsi(closes, period) {
    if (closes.length <= period) return null;
    var gains = 0; var losses = 0;
    closes.slice(-(period + 1)).forEach(function (value, index, values) {
      if (!index) return; var delta = value - values[index - 1]; if (delta >= 0) gains += delta; else losses -= delta;
    });
    return losses ? 100 - (100 / (1 + (gains / period) / (losses / period))) : 100;
  }
  function atr(points, period) {
    if (points.length < 2) return null; var recent = points.slice(-(period + 1)); var values = [];
    recent.forEach(function (point, index) {
      if (!index || point.h == null || point.l == null) return; var previous = recent[index - 1].c;
      values.push(Math.max(point.h - point.l, Math.abs(point.h - previous), Math.abs(point.l - previous)));
    });
    return mean(values);
  }
  function calculate(payload) {
    var closes = payload.points.map(function (point) { return Number(point.c); });
    var recent = closes.slice(-20); var last = Number(payload.price || closes[closes.length - 1]);
    var sma20 = sma(closes, 20); var sma50 = sma(closes, 50); var momentum = rsi(closes, 14); var volatility = atr(payload.points, 14);
    var support = Math.min.apply(Math, recent); var resistance = Math.max.apply(Math, recent); var score = 0; var evidence = [];
    if (sma20 != null) { score += last >= sma20 ? 1 : -1; evidence.push("price " + (last >= sma20 ? "above" : "below") + " SMA20"); }
    if (sma20 != null && sma50 != null) { score += sma20 >= sma50 ? 1 : -1; evidence.push("SMA20 " + (sma20 >= sma50 ? "above" : "below") + " SMA50"); }
    if (momentum != null) { if (momentum > 55 && momentum < 70) score += 1; if (momentum < 45 && momentum > 30) score -= 1; evidence.push("RSI " + momentum.toFixed(1)); }
    var riskUnit = Math.max(volatility || 0, last * 0.008); var bullTrigger = resistance + riskUnit * 0.1; var bearTrigger = support - riskUnit * 0.1;
    return {
      last: last, sma20: sma20, sma50: sma50, rsi: momentum, atr: volatility,
      support: support, resistance: resistance, periodLow: Math.min.apply(Math, closes), periodHigh: Math.max.apply(Math, closes),
      bias: score >= 2 ? "BULLISH BIAS" : score <= -2 ? "BEARISH BIAS" : "NEUTRAL / MIXED", evidence: evidence,
      bull: { trigger: bullTrigger, stop: Math.min(last - riskUnit, support), target: bullTrigger + 2 * riskUnit },
      bear: { trigger: bearTrigger, stop: Math.max(last + riskUnit, resistance), target: bearTrigger - 2 * riskUnit }
    };
  }

  function price(value, digits) { return value == null || !Number.isFinite(Number(value)) ? "—" : TT.widgets.format(Number(value), digits); }
  function signed(value, suffix) { return value == null || !Number.isFinite(Number(value)) ? "—" : (Number(value) >= 0 ? "+" : "") + Number(value).toFixed(2) + (suffix || ""); }
  function formatTime(timestamp) { return timestamp ? new Date(timestamp * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Unknown"; }
  function compactMoney(value) {
    if (value == null || !Number.isFinite(Number(value))) return "—"; var number = Number(value) * 1000000;
    if (number >= 1e12) return "$" + (number / 1e12).toFixed(2) + "T";
    if (number >= 1e9) return "$" + (number / 1e9).toFixed(2) + "B";
    return "$" + (number / 1e6).toFixed(0) + "M";
  }
  function metric(label, value, className) { return '<div class="metric"><span>' + escapeHTML(label) + '</span><strong class="' + (className || "flat") + '">' + escapeHTML(value) + '</strong></div>'; }
  function scenario(label, values, digits, className) {
    return '<div class="scenario"><strong class="' + className + '">' + label + '</strong><div><span>Trigger ' + price(values.trigger, digits) + '</span><span>Invalidation ' + price(values.stop, digits) + '</span><span>Illustrative objective ' + price(values.target, digits) + '</span></div></div>';
  }

  function performanceCard(research) {
    var performance = research.performance || {}; var returns = performance.returns || {};
    var cells = ["1D", "1W", "1M", "3M", "YTD", "1Y"].map(function (label) {
      var value = returns[label]; return metric(label, signed(value, "%"), value == null ? "flat" : TT.widgets.valueClass(value));
    }).join("");
    return '<section class="research-card"><h3>PAST PERFORMANCE</h3><div class="metric-grid performance-grid">' + cells +
      metric("1Y MAX DRAWDOWN", signed(performance.maxDrawdown1Y, "%"), "down") + metric("1Y ANN. VOL", performance.annualizedVolatility1Y == null ? "—" : Number(performance.annualizedVolatility1Y).toFixed(2) + "%", "flat") +
      '</div><p class="source-note">Close-to-close returns from Yahoo daily bars through ' + escapeHTML(formatTime(performance.through)) + '. Past performance does not predict future results.</p></section>';
  }

  function earningsCard(research) {
    var event = research.nextEarnings; var history = research.earningsHistory || [];
    var eventHTML = event ? '<div class="event-callout"><strong>' + escapeHTML(event.date) + '</strong><span>' + escapeHTML((event.hour || "TIME TBC").toUpperCase()) + ' · Q' + escapeHTML(event.quarter || "—") + ' ' + escapeHTML(event.year || "") + '</span><span>EPS EST ' + price(event.epsEstimate, 2) + ' · REV EST ' + compactMoney(event.revenueEstimate == null ? null : Number(event.revenueEstimate) / 1000000) + '</span></div>' : '<div class="detail-empty compact">No upcoming earnings event returned.</div>';
    var rows = history.length ? history.map(function (row) {
      var surprise = row.surprisePercent; return '<div class="earnings-history-row"><span>' + escapeHTML(row.period || ("Q" + row.quarter + " " + row.year)) + '</span><span>ACT ' + price(row.actual, 2) + '</span><span>EST ' + price(row.estimate, 2) + '</span><strong class="' + (surprise == null ? "flat" : TT.widgets.valueClass(surprise)) + '">' + signed(surprise, "%") + '</strong></div>';
    }).join("") : '<div class="detail-empty compact">No reported surprise history returned.</div>';
    return '<section class="research-card"><h3>NEXT EARNINGS &amp; LAST FOUR REPORTS</h3>' + eventHTML + '<div class="earnings-history">' + rows + '</div><p class="source-note">Finnhub analyst consensus estimates; dates and timing can change.</p></section>';
  }

  function recommendationCard(research) {
    var row = research.recommendation;
    if (!row) return '<section class="research-card"><h3>ANALYST CONSENSUS</h3><div class="detail-empty compact">' + escapeHTML(research.notice || "No free analyst trend returned.") + '</div></section>';
    var positive = Number(row.strongBuy || 0) + Number(row.buy || 0); var negative = Number(row.sell || 0) + Number(row.strongSell || 0); var hold = Number(row.hold || 0);
    var label = positive > negative + hold ? "POSITIVE PLURALITY" : negative > positive + hold ? "NEGATIVE PLURALITY" : "MIXED / HOLD-HEAVY";
    return '<section class="research-card"><h3>ANALYST CONSENSUS · ' + escapeHTML(row.period || "LATEST") + '</h3><div class="consensus-strip">' +
      '<span class="up">STRONG BUY <b>' + Number(row.strongBuy || 0) + '</b></span><span class="up">BUY <b>' + Number(row.buy || 0) + '</b></span><span>HOLD <b>' + hold + '</b></span><span class="down">SELL <b>' + Number(row.sell || 0) + '</b></span><span class="down">STRONG SELL <b>' + Number(row.strongSell || 0) + '</b></span></div>' +
      '<div class="signal ' + (label.indexOf("POSITIVE") === 0 ? "up" : label.indexOf("NEGATIVE") === 0 ? "down" : "amber") + '">' + label + '</div><p class="source-note">Finnhub recommendation-trend counts. This free endpoint does not identify banks or provide price targets.</p></section>';
  }

  function fundamentalsCard(research) {
    var item = research.fundamentals || {};
    return '<section class="research-card"><h3>FUNDAMENTALS · TTM UNLESS MARKED</h3><div class="metric-grid">' +
      metric("MARKET CAP", compactMoney(item.marketCapMillions)) + metric("P/E", price(item.peTTM, 2)) + metric("FORWARD P/E", price(item.forwardPE, 2)) + metric("PRICE / SALES", price(item.priceSalesTTM, 2)) +
      metric("REVENUE GROWTH", signed(item.revenueGrowthTTM, "%"), item.revenueGrowthTTM == null ? "flat" : TT.widgets.valueClass(item.revenueGrowthTTM)) + metric("EPS GROWTH", signed(item.epsGrowthTTM, "%"), item.epsGrowthTTM == null ? "flat" : TT.widgets.valueClass(item.epsGrowthTTM)) +
      metric("GROSS MARGIN", item.grossMarginTTM == null ? "—" : Number(item.grossMarginTTM).toFixed(2) + "%") + metric("NET MARGIN", item.netMarginTTM == null ? "—" : Number(item.netMarginTTM).toFixed(2) + "%") +
      metric("BETA", price(item.beta, 2)) + metric("DIVIDEND YIELD", item.dividendYield == null ? "—" : Number(item.dividendYield).toFixed(2) + "%") + metric("52W LOW", price(item.week52Low, 2)) + metric("52W HIGH", price(item.week52High, 2)) +
      '</div><p class="source-note">Standardized Finnhub basic metrics. Compare definitions with company filings before relying on a ratio.</p></section>';
  }

  function peersCard(research) {
    var peers = research.peers || [];
    return '<section class="research-card peers-card"><h3>COMPARABLE COMPANIES</h3><div class="peer-list">' + (peers.length ? peers.map(function (symbol) { return '<button class="peer-btn" data-peer="' + escapeHTML(symbol) + '">' + escapeHTML(symbol) + '</button>'; }).join("") : '<span class="faint">No free peer set returned.</span>') + '</div></section>';
  }

  function render(payload, research) {
    lastPayload = payload; var instrument = TT.universe.index[currentSymbol] || { sym: currentSymbol, name: currentSymbol, digits: 2 };
    var technical = calculate(payload); var digits = instrument.digits || 2; var change = payload.previousClose ? ((technical.last - payload.previousClose) / payload.previousClose) * 100 : null;
    var delayLabel = payload.delayMinutes == null ? "DELAY UNKNOWN" : Number(payload.delayMinutes) > 0 ? payload.delayMinutes + " MIN DELAY" : "REAL-TIME INDICATED";
    var rangeButtons = ranges.map(function (item) { return '<button class="range-btn ' + (item.value === currentRange ? "active" : "") + '" data-range="' + item.value + '">' + item.label + '</button>'; }).join("");
    var feedButtons = '<div class="chart-controls"><div class="feed-switch" aria-label="Chart data provider"><span>FEED</span><button class="range-btn provider-btn ' + (currentProvider === "yahoo" ? "active" : "") + '" data-provider="yahoo">YAHOO · GLOBAL</button><button class="range-btn provider-btn ' + (currentProvider === "twelve" ? "active" : "") + '" data-provider="twelve">TWELVE DATA · FREE LIVE</button></div>' +
      '<div class="view-switch" aria-label="Chart style"><span>CHART</span><button class="range-btn chart-style-btn ' + (currentChartStyle === "line" ? "active" : "") + '" data-chart-style="line">LINE</button><button class="range-btn chart-style-btn ' + (currentChartStyle === "candles" ? "active" : "") + '" data-chart-style="candles">CANDLES</button></div></div>';
    var news = payload.news && payload.news.length ? payload.news.map(function (item) { return '<a class="news-item" href="' + escapeHTML(item.link) + '" target="_blank" rel="noopener noreferrer"><span class="news-title">' + escapeHTML(item.title) + '</span><span class="news-meta">' + escapeHTML(item.publisher) + ' · ' + escapeHTML(formatTime(item.published)) + ' ↗</span></a>'; }).join("") : '<div class="detail-empty">No recent headlines returned for this instrument.</div>';
    var signalClass = technical.bias.indexOf("BULL") === 0 ? "up" : technical.bias.indexOf("BEAR") === 0 ? "down" : "amber";
    title.textContent = instrument.sym + " · " + instrument.name;
    content.innerHTML =
      '<div class="detail-summary"><div><span class="detail-price">' + price(technical.last, digits) + '</span> <span class="' + (change == null ? "faint" : TT.widgets.valueClass(change)) + '">' + (change == null ? "" : signed(change, "%")) + '</span><button id="watchlist-toggle" class="watchlist-toggle ' + (TT.watchlist.contains(currentSymbol) ? "active" : "") + '">' + (TT.watchlist.contains(currentSymbol) ? "★ WATCHING" : "+ WATCHLIST") + '</button></div>' +
      '<div class="detail-provenance">' + escapeHTML(payload.provider || "LOCAL") + ' · ' + escapeHTML(payload.exchange || "") + ' · ' + escapeHTML(payload.currency || "") + '<br>OBSERVED ' + escapeHTML(formatTime(payload.marketTime)) + ' · RETRIEVED ' + escapeHTML(formatTime(payload.retrievedAt)) + '<br><span>' + escapeHTML(delayLabel) + ' · VERIFY BEFORE TRADING</span></div></div>' +
      feedButtons + '<div class="range-bar" aria-label="Chart range">' + rangeButtons + '</div>' + (payload.coverageNote ? '<p class="feed-notice">' + escapeHTML(payload.coverageNote) + ' Auto-refresh: ' + escapeHTML(payload.refreshSeconds || 60) + 's while open.</p>' : '') +
      '<section class="chart-card"><canvas id="price-chart" aria-label="' + escapeHTML(instrument.name) + ' ' + escapeHTML(currentChartStyle) + ' chart"></canvas><div class="chart-legend"><span class="chart-style-legend">' + (currentChartStyle === "line" ? "— CLOSE LINE" : "▮ OHLC CANDLES") + '</span><span class="amber">— SMA20</span><span>' + payload.points.length + ' BARS · ' + escapeHTML(String(payload.interval || "").toUpperCase()) + '</span></div></section>' +
      '<div class="research-grid research-grid-wide">' + performanceCard(research) + earningsCard(research) + recommendationCard(research) + fundamentalsCard(research) + '</div>' +
      '<div class="research-grid"><section class="research-card"><h3>TECHNICALS · SELECTED RANGE</h3><div class="metric-grid">' +
      metric("SMA 20", price(technical.sma20, digits), technical.sma20 && technical.last >= technical.sma20 ? "up" : "down") + metric("SMA 50", price(technical.sma50, digits), technical.sma50 && technical.last >= technical.sma50 ? "up" : "down") + metric("RSI 14", technical.rsi == null ? "—" : technical.rsi.toFixed(1), technical.rsi > 70 ? "down" : technical.rsi < 30 ? "up" : "flat") + metric("ATR 14", price(technical.atr, digits)) + metric("SUPPORT", price(technical.support, digits)) + metric("RESISTANCE", price(technical.resistance, digits)) + metric("PERIOD LOW", price(technical.periodLow, digits)) + metric("PERIOD HIGH", price(technical.periodHigh, digits)) +
      '</div><div class="signal ' + signalClass + '">' + technical.bias + '</div><p class="signal-note">' + escapeHTML(technical.evidence.join(" · ")) + '</p></section>' +
      '<section class="research-card"><h3>EDUCATIONAL TRADE SCENARIOS</h3>' + scenario("BULL BREAKOUT", technical.bull, digits, "up") + scenario("BEAR BREAKDOWN", technical.bear, digits, "down") + '<p class="risk-note">Mechanical examples from price structure and ATR—not personalized recommendations. Confirm liquidity, catalysts, position size and an executable quote independently.</p></section></div>' +
      peersCard(research) + '<section class="research-card news-card"><h3>RECENT NEWS</h3><div class="news-list">' + news + '</div><p class="source-note">Headlines via Yahoo Finance search; links open at the publisher. Inclusion is not endorsement.</p></section>';
    bindControls(); window.requestAnimationFrame(function () { drawChart(payload.points); }); scheduleRefresh(payload);
  }

  function bindControls() {
    content.querySelectorAll(".range-btn[data-range]").forEach(function (button) { button.addEventListener("click", function () { currentRange = button.dataset.range; load(); }); });
    content.querySelectorAll(".provider-btn").forEach(function (button) { button.addEventListener("click", function () { setProvider(button.dataset.provider); }); });
    content.querySelectorAll(".chart-style-btn").forEach(function (button) { button.addEventListener("click", function () { setChartStyle(button.dataset.chartStyle); }); });
    content.querySelector("#watchlist-toggle").addEventListener("click", function (event) { var watching = TT.watchlist.toggle(currentSymbol); event.target.classList.toggle("active", watching); event.target.textContent = watching ? "★ WATCHING" : "+ WATCHLIST"; });
    content.querySelectorAll(".peer-btn").forEach(function (button) { button.addEventListener("click", function () { var symbol = button.dataset.peer; TT.symbols.register({ symbol: symbol, name: symbol, live: symbol, type: "Equity" }); open(symbol); }); });
  }

  function drawChart(points) {
    var canvas = document.getElementById("price-chart"); if (!canvas || !points.length) return;
    var ratio = window.devicePixelRatio || 1; var rect = canvas.getBoundingClientRect(); canvas.width = Math.max(320, rect.width) * ratio; canvas.height = Math.max(220, rect.height) * ratio;
    var context = canvas.getContext("2d"); context.scale(ratio, ratio); var width = canvas.width / ratio; var height = canvas.height / ratio; var pad = { top: 14, right: 58, bottom: 26, left: 10 };
    var highs = points.map(function (point) { return Number(point.h == null ? point.c : point.h); }); var lows = points.map(function (point) { return Number(point.l == null ? point.c : point.l); }); var closes = points.map(function (point) { return Number(point.c); });
    var rolling = closes.map(function (_, index) { return index < 19 ? null : mean(closes.slice(index - 19, index + 1)); });
    var scaleValues = currentChartStyle === "line" ? closes.concat(rolling.filter(function (value) { return value != null; })) : highs.concat(lows);
    var min = Math.min.apply(Math, scaleValues); var max = Math.max.apply(Math, scaleValues); var spread = max - min || max * 0.01 || 1; min -= spread * 0.08; max += spread * 0.08;
    function x(index) { return pad.left + (index + 0.5) * (width - pad.left - pad.right) / points.length; } function y(value) { return pad.top + (max - value) * (height - pad.top - pad.bottom) / (max - min); }
    context.strokeStyle = "#1d3a26"; context.fillStyle = "#5f9b72"; context.font = "10px monospace"; context.textAlign = "right";
    for (var grid = 0; grid < 5; grid += 1) { var gy = pad.top + grid * (height - pad.top - pad.bottom) / 4; context.beginPath(); context.moveTo(pad.left, gy); context.lineTo(width - pad.right, gy); context.stroke(); context.fillText((max - grid * (max - min) / 4).toFixed(2), width - 4, gy + 3); }
    if (currentChartStyle === "candles") {
      var candleWidth = Math.max(1, Math.min(8, (width - pad.left - pad.right) / points.length * 0.68));
      points.forEach(function (point, index) { var open = Number(point.o == null ? point.c : point.o); var close = Number(point.c); var high = Number(point.h == null ? close : point.h); var low = Number(point.l == null ? close : point.l); var color = close >= open ? "#34f57a" : "#ff4d57"; context.strokeStyle = color; context.fillStyle = color; context.lineWidth = 1; context.beginPath(); context.moveTo(x(index), y(high)); context.lineTo(x(index), y(low)); context.stroke(); var top = Math.min(y(open), y(close)); var body = Math.max(1, Math.abs(y(open) - y(close))); context.fillRect(x(index) - candleWidth / 2, top, candleWidth, body); });
    } else {
      context.beginPath(); closes.forEach(function (value, index) { if (!index) context.moveTo(x(index), y(value)); else context.lineTo(x(index), y(value)); }); context.strokeStyle = "#34f57a"; context.lineWidth = 1.8; context.stroke();
    }
    context.beginPath(); var started = false; rolling.forEach(function (value, index) { if (value == null) return; if (!started) { context.moveTo(x(index), y(value)); started = true; } else context.lineTo(x(index), y(value)); }); context.strokeStyle = "#ffb000"; context.lineWidth = 1; context.stroke();
    context.fillStyle = "#5f9b72"; context.textAlign = "left"; context.fillText(new Date(points[0].t * 1000).toLocaleDateString(), pad.left, height - 6); context.textAlign = "right"; context.fillText(new Date(points[points.length - 1].t * 1000).toLocaleDateString(), width - pad.right, height - 6);
  }

  function simulatedPayload(symbol, chartRange) {
    var instrument = TT.universe.index[symbol] || { base: 100 }; var count = chartRange === "1d" ? 78 : chartRange === "5d" ? 120 : chartRange === "5y" ? 260 : 100; var seed = Number(instrument.base) || 100; var points = []; var now = Date.now() / 1000;
    for (var index = 0; index < count; index += 1) { var open = seed; var wave = Math.sin(index * 0.31 + symbol.length) * 0.004; seed *= 1 + wave + ((index % 7) - 3) * 0.00025; points.push({ t: now - (count - index) * 86400, o: open, h: Math.max(open, seed) * 1.004, l: Math.min(open, seed) * 0.996, c: seed, v: null }); }
    return { symbol: symbol, range: chartRange, interval: "1d", currency: "USD", exchange: "OFFLINE DEMO", marketTime: Math.floor(now), retrievedAt: Math.floor(now), delayMinutes: null, price: seed, previousClose: points[points.length - 2].c, points: points, news: [], provider: "SIMULATED — NOT MARKET DATA" };
  }
  function simulatedResearch() { return { performance: { returns: {}, through: Math.floor(Date.now() / 1000) }, fundamentals: {}, peers: [], earningsHistory: [], nextEarnings: null, recommendation: null, notice: "Live research requires the local server." }; }

  function setProvider(provider) {
    currentProvider = provider;
    settings = TT.store.updateSettings({ chartProvider: provider });
    load();
  }
  function setChartStyle(style) {
    currentChartStyle = style === "line" ? "line" : "candles";
    settings = TT.store.updateSettings({ chartStyle: currentChartStyle });
    content.querySelectorAll(".chart-style-btn").forEach(function (button) { button.classList.toggle("active", button.dataset.chartStyle === currentChartStyle); });
    var legend = content.querySelector(".chart-style-legend"); if (legend) legend.textContent = currentChartStyle === "line" ? "— CLOSE LINE" : "▮ OHLC CANDLES";
    var canvas = document.getElementById("price-chart"); if (canvas) canvas.setAttribute("aria-label", currentSymbol + " " + currentChartStyle + " chart");
    if (lastPayload) drawChart(lastPayload.points);
  }
  function scheduleRefresh(payload) { window.clearTimeout(refreshTimer); if (currentProvider === "twelve" && payload.refreshSeconds && !overlay.hidden) refreshTimer = window.setTimeout(function () { load(true); }, Number(payload.refreshSeconds) * 1000); }
  function showError(error) {
    var setup = currentProvider === "twelve" ? '<p class="feed-notice">Create a free Twelve Data Basic key, then save it as TANG_TWELVEDATA_API_KEY in terminal/.tang-twelvedata.env and restart TANG.</p><button class="range-btn use-yahoo">USE YAHOO GLOBAL</button>' : '<button class="range-btn retry-btn">RETRY</button>';
    content.innerHTML = '<div class="detail-error"><strong>RESEARCH FEED UNAVAILABLE</strong><br>' + escapeHTML(error.message || error) + setup + '</div>';
    var fallback = content.querySelector(".use-yahoo"); if (fallback) fallback.addEventListener("click", function () { setProvider("yahoo"); });
    var retry = content.querySelector(".retry-btn"); if (retry) retry.addEventListener("click", function () { load(); });
  }
  function fetchJSON(url) { return window.fetch(url, { cache: "no-store" }).then(function (response) { return response.json().then(function (body) { if (!response.ok) throw new Error(body.detail || body.error || ("Feed returned " + response.status)); return body; }); }); }
  function load(background) {
    var instrument = TT.universe.index[currentSymbol] || { live: currentSymbol }; var serial = ++requestNumber; window.clearTimeout(refreshTimer);
    if (!background) content.innerHTML = '<div class="detail-loading"><span class="loader"></span> LOADING ' + escapeHTML(currentSymbol) + ' · ' + currentRange.toUpperCase() + '</div>';
    if (window.location.protocol === "file:") { render(simulatedPayload(currentSymbol, currentRange), simulatedResearch()); return; }
    var chartURL = "/api/instrument?symbol=" + encodeURIComponent(instrument.live || currentSymbol) + "&range=" + encodeURIComponent(currentRange) + "&provider=" + encodeURIComponent(currentProvider);
    var researchURL = "/api/research?symbol=" + encodeURIComponent(instrument.live || currentSymbol);
    Promise.all([fetchJSON(chartURL), fetchJSON(researchURL).catch(function (error) { return { performance: {}, fundamentals: {}, peers: [], earningsHistory: [], recommendation: null, notice: error.message }; })])
      .then(function (results) { if (serial === requestNumber) render(results[0], results[1]); }).catch(function (error) { if (serial === requestNumber) showError(error); });
  }

  function close() { requestNumber += 1; window.clearTimeout(refreshTimer); overlay.hidden = true; document.body.classList.remove("detail-open"); lastPayload = null; }
  function open(symbol) { if (!TT.universe.index[symbol]) return; currentSymbol = symbol; currentRange = "3mo"; overlay.hidden = false; document.body.classList.add("detail-open"); load(); document.getElementById("detail-close").focus(); }
  document.getElementById("detail-close").addEventListener("click", close);
  overlay.addEventListener("click", function (event) { if (event.target === overlay) close(); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !overlay.hidden) close(); });
  window.addEventListener("resize", function () { if (!overlay.hidden && lastPayload) drawChart(lastPayload.points); });
  TT.details = { open: open, close: close };
})(window.TT = window.TT || {});
