(function (TT) {
  "use strict";
  TT.widgets.stocks = {
    create: function () {
      var panel = TT.widgets.panel("stocks", "MEGA-CAP STOCKS");
      panel.querySelector(".panel-body").innerHTML = '<table class="quote-table"><thead><tr><th>SYMBOL / COMPANY</th><th class="num">MKT CAP</th><th class="num">LAST</th><th class="num">CHG%</th></tr></thead><tbody></tbody></table>';
      panel.update = function (quotes) {
        panel.querySelector("tbody").innerHTML = TT.universe.stocks.map(function (item) {
          var q = quotes[item.sym];
          return '<tr><td><strong>' + item.sym + '</strong> <span class="faint">' + item.name + '</span></td><td class="num dim">$' + (item.mcap / 1000).toFixed(2) + 'T</td><td class="num">' + (q ? '$' + TT.widgets.format(q.price, item.digits) : '—') + '</td><td class="num ' + (q ? TT.widgets.valueClass(q.change) : "faint") + '">' + (q ? (q.change >= 0 ? "+" : "") + q.change.toFixed(2) + '%' : '—') + '</td></tr>';
        }).join("");
      };
      return panel;
    }
  };
})(window.TT = window.TT || {});
