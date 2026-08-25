(function (TT) {
  "use strict";
  TT.widgets = TT.widgets || {};
  TT.widgets.panel = function (id, title) {
    var panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("aria-label", title);
    panel.innerHTML = '<header class="panel-header"><span class="grip" aria-hidden="true">⠿</span>' +
      '<span class="title">' + title + '</span><span class="spacer"></span>' +
      '<button class="hdr-btn size-btn" title="Cycle panel width" aria-label="Resize ' + title + '">↔ SIZE</button></header>' +
      '<div class="panel-body"></div>';
    panel.querySelector(".size-btn").addEventListener("click", function () { TT.grid.cycleSize(panel); });
    panel.querySelector(".grip").setAttribute("title", "Drag to rearrange");
    return panel;
  };
  TT.widgets.valueClass = function (value) { return value > 0.005 ? "up" : value < -0.005 ? "down" : "flat"; };
  TT.widgets.format = function (number, digits) {
    return Number(number).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };
})(window.TT = window.TT || {});
