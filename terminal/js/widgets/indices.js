(function (TT) {
  "use strict";
  TT.widgets.indices = {
    create: function () {
      var panel = TT.widgets.panel("indices", "GLOBAL INDICES");
      panel.querySelector(".panel-body").innerHTML = '<table class="quote-table"><thead><tr><th>REG</th><th>INDEX</th><th class="num">LAST</th><th class="num">CHG%</th></tr></thead><tbody></tbody></table>';
      panel.update = function (quotes) {
        panel.querySelector("tbody").innerHTML = TT.universe.indices.map(function (item) {
          var q = quotes[item.sym]; if (!q) return '<tr><td class="faint">' + item.region + '</td><td>' + item.name + '</td><td class="num faint">—</td><td class="num faint">—</td></tr>';
          return '<tr><td class="faint">' + item.region + '</td><td>' + item.name + '</td><td class="num">' + TT.widgets.format(q.price, item.digits) + '</td><td class="num ' + TT.widgets.valueClass(q.change) + '">' + (q.change >= 0 ? "+" : "") + q.change.toFixed(2) + '%</td></tr>';
        }).join("");
      };
      return panel;
    }
  };
})(window.TT = window.TT || {});
