(function (TT) {
  "use strict";
  function heatClass(value) {
    var abs = Math.abs(value); var level = abs >= 2.5 ? 3 : abs >= 1 ? 2 : abs >= 0.1 ? 1 : 0;
    return level ? (value > 0 ? "up" : "down") + level : "";
  }
  TT.widgets.heatmap = {
    create: function () {
      var panel = TT.widgets.panel("heatmap", "SECTOR PULSE · AI / ENERGY / FINANCIALS");
      panel.update = function (quotes) {
        panel.querySelector(".panel-body").innerHTML = '<div class="heatmap">' + TT.universe.heatmap.map(function (group) {
          return group.members.map(function (item) {
            var q = quotes[item.sym]; var change = q ? q.change : 0;
            return '<div class="heat-tile ' + heatClass(change) + '" title="' + item.name + '"><span class="h-name">' + item.sym + '</span><span class="h-val">' + (q ? (change >= 0 ? "+" : "") + change.toFixed(2) + "%" : "—") + '</span><span class="h-sub">' + group.group + ' · ' + item.name + '</span></div>';
          }).join("");
        }).join("") + '</div>';
      };
      return panel;
    }
  };
})(window.TT = window.TT || {});
