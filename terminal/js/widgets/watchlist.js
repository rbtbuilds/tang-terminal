(function (TT) {
  "use strict";
  TT.widgets.watchlist = {
    create: function () {
      var panel = TT.widgets.panel("watchlist", "WATCHLIST");
      var body = panel.querySelector(".panel-body"); var latestQuotes = {};
      function render() {
        var symbols = TT.watchlist.get();
        if (!symbols.length) {
          body.innerHTML = '<div class="watch-empty"><strong>NO INSTRUMENTS PINNED</strong><br>Open any quote and select + WATCHLIST.</div>';
          return;
        }
        body.innerHTML = '<table class="quote-table watch-table"><thead><tr><th>SYMBOL</th><th class="num">LAST</th><th class="num">DAY</th><th></th></tr></thead><tbody>' + symbols.map(function (symbol) {
          var item = TT.universe.index[symbol]; var quote = latestQuotes[symbol];
          return '<tr class="quote-action" data-symbol="' + TT.widgets.escapeHTML(symbol) + '" tabindex="0" role="button"><td><strong>' + TT.widgets.escapeHTML(symbol) + '</strong> <span class="faint">' + TT.widgets.escapeHTML(item.name) + '</span></td><td class="num">' + (quote ? TT.widgets.format(quote.price, item.digits || 2) : '—') + '</td><td class="num ' + (quote ? TT.widgets.valueClass(quote.change) : 'faint') + '">' + (quote ? (quote.change >= 0 ? '+' : '') + quote.change.toFixed(2) + '%' : '—') + '</td><td><button class="watch-remove" data-watch-remove="' + TT.widgets.escapeHTML(symbol) + '" aria-label="Remove ' + TT.widgets.escapeHTML(symbol) + ' from watchlist">×</button></td></tr>';
        }).join("") + '</tbody></table>';
      }
      body.addEventListener("click", function (event) {
        var button = event.target.closest("[data-watch-remove]");
        if (!button) return;
        event.preventDefault(); event.stopPropagation(); TT.watchlist.remove(button.dataset.watchRemove);
      });
      body.addEventListener("keydown", function (event) {
        var button = event.target.closest && event.target.closest("[data-watch-remove]");
        if (button && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.stopPropagation(); TT.watchlist.remove(button.dataset.watchRemove); }
      });
      panel.update = function (quotes) { latestQuotes = quotes; render(); };
      panel._unsubscribe = TT.watchlist.subscribe(render);
      render(); return panel;
    }
  };
})(window.TT = window.TT || {});
