(function (TT) {
  "use strict";
  TT.widgets.metals = {
    create: function () {
      var panel = TT.widgets.panel("metals", "PRECIOUS METALS");
      panel.querySelector(".panel-body").innerHTML = '<table class="quote-table"><thead><tr><th>METAL</th><th class="num">USD</th><th class="num">DAY</th></tr></thead><tbody></tbody></table>';
      panel.update = function (quotes) {
        panel.querySelector("tbody").innerHTML = TT.universe.metals.map(function (item) {
          var q = quotes[item.sym];
          return '<tr><td><strong class="amber">' + item.sym + '</strong> <span class="faint">' + item.name + '/' + item.unit + '</span></td><td class="num">' + (q ? '$' + TT.widgets.format(q.price, item.digits) : '—') + '</td><td class="num ' + (q ? TT.widgets.valueClass(q.change) : "faint") + '">' + (q ? (q.change >= 0 ? "+" : "") + q.change.toFixed(2) + '%' : '—') + '</td></tr>';
        }).join("");
      };
      return panel;
    }
  };
})(window.TT = window.TT || {});
