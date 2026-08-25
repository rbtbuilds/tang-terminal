(function (TT) {
  "use strict";
  function dateLabel(value) {
    var date = value ? new Date(typeof value === "number" ? value * 1000 : value) : null;
    return date && !isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase() : "—";
  }
  function money(value) {
    var number = Number(value || 0);
    if (!number) return "—";
    return number >= 1000000 ? "$" + (number / 1000000).toFixed(1) + "M" : number >= 1000 ? "$" + (number / 1000).toFixed(0) + "K" : "$" + number.toFixed(0);
  }
  function field(row, names, fallback) {
    for (var i = 0; i < names.length; i += 1) if (row[names[i]] != null && row[names[i]] !== "") return row[names[i]];
    return fallback || "—";
  }
  TT.widgets.news = {
    create: function () {
      var panel = TT.widgets.panel("news", "MARKET NEWS · RECENT"); var body = panel.querySelector(".panel-body");
      body.innerHTML = '<div class="brief-loading">LOADING PUBLISHER HEADLINES…</div>';
      TT.intelligence.load().then(function (data) {
        if (!data.news.length) { body.innerHTML = '<div class="brief-empty">' + (data.offline ? "NEWS REQUIRES THE LOCAL LAUNCHER" : "NO HEADLINES AVAILABLE") + '</div>'; return; }
        body.innerHTML = '<div class="news-list">' + data.news.map(function (item) {
          return '<a class="news-row" href="' + TT.widgets.escapeHTML(item.link) + '" target="_blank" rel="noopener"><span class="news-time">' + dateLabel(item.published) + '<small>' + TT.widgets.escapeHTML(item.context || "MARKET") + '</small></span><span><strong>' + TT.widgets.escapeHTML(item.title) + '</strong><small>' + TT.widgets.escapeHTML(item.publisher) + '</small></span></a>';
        }).join("") + '</div><p class="widget-note">Aggregated by Yahoo Finance search · links open the original publisher.</p>';
        window.requestAnimationFrame(function () { TT.grid.refresh(document.getElementById("canvas")); });
      });
      return panel;
    }
  };
  TT.widgets.action = {
    create: function () {
      var panel = TT.widgets.panel("action", "MARKET ACTION · MOVERS & SETUPS"); var body = panel.querySelector(".panel-body");
      panel.update = function (quotes) {
        var movers = Object.keys(quotes).map(function (symbol) { return { symbol: symbol, quote: quotes[symbol], item: TT.universe.index[symbol] || { name: symbol } }; })
          .filter(function (row) { return Number.isFinite(row.quote.change); }).sort(function (a, b) { return Math.abs(b.quote.change) - Math.abs(a.quote.change); }).slice(0, 6);
        if (!movers.length) { body.innerHTML = '<div class="brief-empty">WAITING FOR QUOTES…</div>'; return; }
        var leader = movers[0]; var direction = leader.quote.change >= 0 ? "momentum continuation" : "mean-reversion watch";
        body.innerHTML = '<div class="action-grid"><section><h3>RECENT MOVEMENTS</h3>' + movers.map(function (row) {
          return '<button class="mover-row quote-action" data-symbol="' + TT.widgets.escapeHTML(row.symbol) + '"><span><strong>' + TT.widgets.escapeHTML(row.symbol) + '</strong><small>' + TT.widgets.escapeHTML(row.item.name) + '</small></span><b class="' + TT.widgets.valueClass(row.quote.change) + '">' + (row.quote.change >= 0 ? "+" : "") + row.quote.change.toFixed(2) + '%</b></button>';
        }).join("") + '</section><section><h3>MECHANICAL SETUPS · EDUCATIONAL</h3><div class="setup-card"><span class="setup-type">' + direction.toUpperCase() + '</span><strong>' + TT.widgets.escapeHTML(leader.symbol) + ' · ' + (leader.quote.change >= 0 ? "strength" : "weakness") + ' leads the board</strong><p>Confirm with the instrument chart, volume and selected-range technicals. Invalidate if price reverses through the prior close.</p></div><p class="widget-note">Screening heuristic only—not a recommendation, target or executable trade.</p></section></div>';
      };
      panel.update({}); return panel;
    }
  };
  TT.widgets.disclosures = {
    create: function () {
      var panel = TT.widgets.panel("disclosures", "DISCLOSURE MONITOR · INSIDERS / CONGRESS / LARGE FILINGS"); var body = panel.querySelector(".panel-body");
      body.innerHTML = '<div class="brief-loading">READING PUBLIC DISCLOSURES…</div>';
      TT.intelligence.load().then(function (data) {
        var insiderRows = (data.insiders || []).map(function (row) {
          return '<a class="disclosure-row" href="' + TT.widgets.escapeHTML(row.link) + '" target="_blank" rel="noopener"><span><strong>' + TT.widgets.escapeHTML(row.symbol || "—") + '</strong><small>' + TT.widgets.escapeHTML(row.owner) + '</small></span><span>' + row.side + '<small>' + Number(row.shares || 0).toLocaleString() + ' SHARES</small></span><b>' + money(row.notional) + '<small>' + dateLabel(row.date) + '</small></b></a>';
        }).join("") || '<div class="brief-empty">' + ((data.errors || {}).insiders ? 'SEC FEED TEMPORARILY UNAVAILABLE' : 'NO OPEN-MARKET FORM 4 ITEMS') + '</div>';
        var congressRows = (data.congress || []).map(function (row) {
          var link = field(row, ["source_url", "sourceUrl", "url", "filing_url", "link"], "#");
          return '<a class="disclosure-row" href="' + TT.widgets.escapeHTML(link) + '" target="_blank" rel="noopener"><span><strong>' + TT.widgets.escapeHTML(field(row, ["ticker", "symbol"], "—")) + '</strong><small>' + TT.widgets.escapeHTML(field(row, ["representative", "politician", "name", "member"], "CONGRESS")) + '</small></span><span>' + TT.widgets.escapeHTML(field(row, ["transaction_type", "trade_type", "type", "action"], "FILED")) + '<small>' + TT.widgets.escapeHTML(field(row, ["amount", "amount_range"], "AMOUNT N/A")) + '</small></span><b>' + dateLabel(field(row, ["transaction_date", "tx_date", "date"], "")) + '<small>TRANSACTION</small></b></a>';
        }).join("") || '<div class="brief-empty">' + ((data.errors || {}).congress ? 'CONGRESSIONAL FEED TEMPORARILY UNAVAILABLE' : 'NO CONGRESSIONAL ITEMS') + '</div>';
        var congressSource = (data.sources || {}).congress || {};
        body.innerHTML = '<div class="disclosure-grid"><section><h3>COMPANY INSIDERS · SEC FORM 4 P/S</h3>' + insiderRows + '</section><section><h3>CONGRESS PTR' + (congressSource.stale ? ' · <em>ADAPTER STALE · ' + dateLabel(congressSource.lastUpdated) + '</em>' : '') + '</h3>' + congressRows + '</section></div><p class="widget-note">Public disclosures are delayed, incomplete as a market-flow view, and not trading signals. Congressional reports may legally lag transactions by up to 45 days. SEC list covers reported open-market P/S codes only.</p>';
        window.requestAnimationFrame(function () { TT.grid.refresh(document.getElementById("canvas")); });
      });
      return panel;
    }
  };
})(window.TT = window.TT || {});
