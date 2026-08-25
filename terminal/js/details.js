/* On-demand instrument research: chart, technicals, scenarios, and news. */
(function (TT) {
  "use strict";

  var overlay = document.getElementById("detail-overlay");
  var content = document.getElementById("detail-content");
  var title = document.getElementById("detail-title");
  var currentSymbol = "";
  var currentRange = "3mo";
  var lastPayload = null;
  var ranges = [
    { value: "1d", label: "1D" }, { value: "5d", label: "5D" },
    { value: "1mo", label: "1M" }, { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" }, { value: "1y", label: "1Y" },
    { value: "5y", label: "5Y" }
  ];

  function escapeHTML(value) {
    var node = document.createElement("span");
    node.textContent = String(value == null ? "" : value);
    return node.innerHTML;
  }

  function mean(values) {
    if (!values.length) return null;
    return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
  }

  function sma(closes, period) {
    if (closes.length < period) return null;
    return mean(closes.slice(-period));
  }

  function rsi(closes, period) {
    if (closes.length <= period) return null;
    var gains = 0; var losses = 0;
    closes.slice(-(period + 1)).forEach(function (value, index, values) {
      if (!index) return;
      var delta = value - values[index - 1];
      if (delta >= 0) gains += delta; else losses -= delta;
    });
    if (!losses) return 100;
    return 100 - (100 / (1 + (gains / period) / (losses / period)));
  }

  function atr(points, period) {
    if (points.length < 2) return null;
    var recent = points.slice(-(period + 1)); var rangesList = [];
    recent.forEach(function (point, index) {
      if (!index || point.h == null || point.l == null) return;
      var previous = recent[index - 1].c;
      rangesList.push(Math.max(point.h - point.l, Math.abs(point.h - previous), Math.abs(point.l - previous)));
    });
    return mean(rangesList);
  }

  function calculate(payload) {
    var closes = payload.points.map(function (point) { return Number(point.c); });
    var recent = closes.slice(-20); var last = Number(payload.price || closes[closes.length - 1]);
    var sma20 = sma(closes, 20); var sma50 = sma(closes, 50); var momentum = rsi(closes, 14); var volatility = atr(payload.points, 14);
    var support = Math.min.apply(Math, recent); var resistance = Math.max.apply(Math, recent);
    var periodLow = Math.min.apply(Math, closes); var periodHigh = Math.max.apply(Math, closes);
    var score = 0; var evidence = [];
    if (sma20 != null) { score += last >= sma20 ? 1 : -1; evidence.push("price " + (last >= sma20 ? "above" : "below") + " SMA20"); }
    if (sma20 != null && sma50 != null) { score += sma20 >= sma50 ? 1 : -1; evidence.push("SMA20 " + (sma20 >= sma50 ? "above" : "below") + " SMA50"); }
    if (momentum != null) {
      if (momentum > 55 && momentum < 70) score += 1;
      if (momentum < 45 && momentum > 30) score -= 1;
      evidence.push("RSI " + momentum.toFixed(1));
    }
    var bias = score >= 2 ? "BULLISH BIAS" : score <= -2 ? "BEARISH BIAS" : "NEUTRAL / MIXED";
    var riskUnit = Math.max(volatility || 0, last * 0.008);
    var bullTrigger = resistance + riskUnit * 0.1;
    var bullStop = Math.min(last - riskUnit, support);
    var bearTrigger = support - riskUnit * 0.1;
    var bearStop = Math.max(last + riskUnit, resistance);
    return {
      last: last, sma20: sma20, sma50: sma50, rsi: momentum, atr: volatility,
      support: support, resistance: resistance, periodLow: periodLow, periodHigh: periodHigh,
      bias: bias, evidence: evidence,
      bull: { trigger: bullTrigger, stop: bullStop, target: bullTrigger + 2 * Math.max(bullTrigger - bullStop, riskUnit) },
      bear: { trigger: bearTrigger, stop: bearStop, target: bearTrigger - 2 * Math.max(bearStop - bearTrigger, riskUnit) }
    };
  }

  function price(value, digits) {
    return value == null || !Number.isFinite(value) ? "—" : TT.widgets.format(value, digits);
  }

  function formatTime(timestamp) {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function render(payload) {
    lastPayload = payload;
    var instrument = TT.universe.index[currentSymbol] || { sym: currentSymbol, name: currentSymbol, digits: 2 };
    var technical = calculate(payload); var digits = instrument.digits || 2;
    var change = payload.previousClose ? ((technical.last - payload.previousClose) / payload.previousClose) * 100 : null;
    var signalClass = technical.bias.indexOf("BULL") === 0 ? "up" : technical.bias.indexOf("BEAR") === 0 ? "down" : "amber";
    var rangeButtons = ranges.map(function (item) {
      return '<button class="range-btn ' + (item.value === currentRange ? "active" : "") + '" data-range="' + item.value + '">' + item.label + '</button>';
    }).join("");
    var news = payload.news && payload.news.length ? payload.news.map(function (item) {
      return '<a class="news-item" href="' + escapeHTML(item.link) + '" target="_blank" rel="noopener noreferrer"><span class="news-title">' + escapeHTML(item.title) + '</span><span class="news-meta">' + escapeHTML(item.publisher) + ' · ' + escapeHTML(formatTime(item.published)) + ' ↗</span></a>';
    }).join("") : '<div class="detail-empty">No recent headlines returned for this instrument.</div>';
    title.textContent = instrument.sym + " · " + instrument.name;
    content.innerHTML =
      '<div class="detail-summary"><div><span class="detail-price">' + price(technical.last, digits) + '</span> <span class="' + (change == null ? "faint" : TT.widgets.valueClass(change)) + '">' + (change == null ? "" : (change >= 0 ? "+" : "") + change.toFixed(2) + "%") + '</span><button id="watchlist-toggle" class="watchlist-toggle ' + (TT.watchlist.contains(currentSymbol) ? "active" : "") + '">' + (TT.watchlist.contains(currentSymbol) ? "★ WATCHING" : "+ WATCHLIST") + '</button></div>' +
      '<div class="detail-provenance">' + escapeHTML(payload.provider || "LOCAL") + ' · ' + escapeHTML(payload.exchange || "") + ' · AS OF ' + escapeHTML(formatTime(payload.marketTime)) + '<br><span>Quotes may be delayed by the exchange. Verify before trading.</span></div></div>' +
      '<div class="range-bar" aria-label="Chart range">' + rangeButtons + '</div>' +
      '<section class="chart-card"><canvas id="price-chart" aria-label="' + escapeHTML(instrument.name) + ' price chart"></canvas><div class="chart-legend"><span>— PRICE</span><span class="amber">— SMA20</span><span>' + payload.points.length + ' BARS · ' + escapeHTML(payload.interval.toUpperCase()) + '</span></div></section>' +
      '<div class="research-grid"><section class="research-card"><h3>TECHNICALS</h3><div class="metric-grid">' +
      metric("SMA 20", price(technical.sma20, digits), technical.sma20 && technical.last >= technical.sma20 ? "up" : "down") +
      metric("SMA 50", price(technical.sma50, digits), technical.sma50 && technical.last >= technical.sma50 ? "up" : "down") +
      metric("RSI 14", technical.rsi == null ? "—" : technical.rsi.toFixed(1), technical.rsi > 70 ? "down" : technical.rsi < 30 ? "up" : "flat") +
      metric("ATR 14", price(technical.atr, digits), "flat") +
      metric("SUPPORT", price(technical.support, digits), "flat") + metric("RESISTANCE", price(technical.resistance, digits), "flat") +
      metric("PERIOD LOW", price(technical.periodLow, digits), "flat") + metric("PERIOD HIGH", price(technical.periodHigh, digits), "flat") +
      '</div><div class="signal ' + signalClass + '">' + technical.bias + '</div><p class="signal-note">' + escapeHTML(technical.evidence.join(" · ")) + '</p></section>' +
      '<section class="research-card"><h3>EDUCATIONAL TRADE SCENARIOS</h3>' + scenario("BULL BREAKOUT", technical.bull, digits, "up") + scenario("BEAR BREAKDOWN", technical.bear, digits, "down") +
      '<p class="risk-note">Rule-based examples from price structure and ATR—not personalized recommendations. Confirm liquidity, news, position size, and live quotes independently.</p></section></div>' +
      '<section class="research-card news-card"><h3>RECENT NEWS</h3><div class="news-list">' + news + '</div><p class="source-note">Headlines via Yahoo Finance search; links open at the publisher. Inclusion is not endorsement.</p></section>';
    content.querySelectorAll(".range-btn").forEach(function (button) {
      button.addEventListener("click", function () { currentRange = button.dataset.range; load(); });
    });
    content.querySelector("#watchlist-toggle").addEventListener("click", function (event) {
      var watching = TT.watchlist.toggle(currentSymbol); event.target.classList.toggle("active", watching); event.target.textContent = watching ? "★ WATCHING" : "+ WATCHLIST";
    });
    window.requestAnimationFrame(function () { drawChart(payload.points); });
  }

  function metric(label, value, className) {
    return '<div class="metric"><span>' + label + '</span><strong class="' + className + '">' + value + '</strong></div>';
  }

  function scenario(label, values, digits, className) {
    return '<div class="scenario"><strong class="' + className + '">' + label + '</strong><div><span>Trigger ' + price(values.trigger, digits) + '</span><span>Invalidation ' + price(values.stop, digits) + '</span><span>Illustrative objective ' + price(values.target, digits) + '</span></div></div>';
  }

  function drawChart(points) {
    var canvas = document.getElementById("price-chart"); if (!canvas || !points.length) return;
    var ratio = window.devicePixelRatio || 1; var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, rect.width) * ratio; canvas.height = Math.max(220, rect.height) * ratio;
    var context = canvas.getContext("2d"); context.scale(ratio, ratio);
    var width = canvas.width / ratio; var height = canvas.height / ratio; var pad = { top: 14, right: 58, bottom: 26, left: 10 };
    var closes = points.map(function (point) { return Number(point.c); });
    var rolling = closes.map(function (_, index) { return index < 19 ? null : mean(closes.slice(index - 19, index + 1)); });
    var values = closes.concat(rolling.filter(function (value) { return value != null; }));
    var min = Math.min.apply(Math, values); var max = Math.max.apply(Math, values); var spread = max - min || max * 0.01 || 1; min -= spread * 0.08; max += spread * 0.08;
    function x(index) { return pad.left + index * (width - pad.left - pad.right) / Math.max(1, points.length - 1); }
    function y(value) { return pad.top + (max - value) * (height - pad.top - pad.bottom) / (max - min); }
    context.strokeStyle = "#1d3a26"; context.fillStyle = "#5f9b72"; context.font = "10px monospace"; context.textAlign = "right";
    for (var grid = 0; grid < 5; grid += 1) { var gy = pad.top + grid * (height - pad.top - pad.bottom) / 4; context.beginPath(); context.moveTo(pad.left, gy); context.lineTo(width - pad.right, gy); context.stroke(); context.fillText((max - grid * (max - min) / 4).toFixed(2), width - 4, gy + 3); }
    function line(series, color, lineWidth) { context.beginPath(); var started = false; series.forEach(function (value, index) { if (value == null) return; if (!started) { context.moveTo(x(index), y(value)); started = true; } else context.lineTo(x(index), y(value)); }); context.strokeStyle = color; context.lineWidth = lineWidth; context.stroke(); }
    line(rolling, "#ffb000", 1); line(closes, "#34f57a", 1.7);
    context.fillStyle = "#5f9b72"; context.textAlign = "left"; context.fillText(new Date(points[0].t * 1000).toLocaleDateString(), pad.left, height - 6); context.textAlign = "right"; context.fillText(new Date(points[points.length - 1].t * 1000).toLocaleDateString(), width - pad.right, height - 6);
  }

  function simulatedPayload(symbol, chartRange) {
    var instrument = TT.universe.index[symbol]; var count = chartRange === "1d" ? 78 : chartRange === "5d" ? 120 : chartRange === "5y" ? 260 : 100;
    var seed = Number(instrument.base) || 100; var points = []; var now = Date.now() / 1000;
    for (var index = 0; index < count; index += 1) { var wave = Math.sin(index * 0.31 + symbol.length) * 0.004; seed *= 1 + wave + ((index % 7) - 3) * 0.00025; points.push({ t: now - (count - index) * 86400, o: seed * 0.997, h: seed * 1.006, l: seed * 0.994, c: seed, v: null }); }
    return { symbol: symbol, range: chartRange, interval: "1d", currency: "USD", exchange: "OFFLINE DEMO", marketTime: Math.floor(now), price: seed, previousClose: points[points.length - 2].c, points: points, news: [], provider: "SIMULATED — NOT MARKET DATA" };
  }

  function load() {
    content.innerHTML = '<div class="detail-loading"><span class="loader"></span> LOADING ' + escapeHTML(currentSymbol) + ' · ' + currentRange.toUpperCase() + '</div>';
    if (window.location.protocol === "file:") { render(simulatedPayload(currentSymbol, currentRange)); return; }
    window.fetch("/api/instrument?symbol=" + encodeURIComponent((TT.universe.index[currentSymbol] || {}).live || currentSymbol) + "&range=" + encodeURIComponent(currentRange), { cache: "no-store" })
      .then(function (response) { if (!response.ok) throw new Error("Research feed returned " + response.status); return response.json(); })
      .then(render)
      .catch(function (error) { content.innerHTML = '<div class="detail-error"><strong>RESEARCH FEED UNAVAILABLE</strong><br>' + escapeHTML(error.message) + '<br><button class="range-btn retry-btn">RETRY</button></div>'; content.querySelector(".retry-btn").addEventListener("click", load); });
  }

  function close() { overlay.hidden = true; document.body.classList.remove("detail-open"); lastPayload = null; }
  function open(symbol) { if (!TT.universe.index[symbol]) return; currentSymbol = symbol; currentRange = "3mo"; overlay.hidden = false; document.body.classList.add("detail-open"); load(); document.getElementById("detail-close").focus(); }
  document.getElementById("detail-close").addEventListener("click", close);
  overlay.addEventListener("click", function (event) { if (event.target === overlay) close(); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !overlay.hidden) close(); });
  window.addEventListener("resize", function () { if (!overlay.hidden && lastPayload) drawChart(lastPayload.points); });
  TT.details = { open: open, close: close };
})(window.TT = window.TT || {});
