(function (TT) {
  "use strict";
  TT.widgets = TT.widgets || {};
  TT.widgets.panel = function (id, title) {
    var panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("aria-label", title);
    panel.innerHTML = '<header class="panel-header"><span class="grip" aria-hidden="true">⠿</span>' +
      '<span class="title">' + title + '</span><span class="spacer"></span>' +
      '<button class="hdr-btn size-btn" title="Cycle panel width" aria-label="Resize ' + title + '">↔ SIZE</button>' +
      '<button class="hdr-btn height-btn" title="Return to natural content height" aria-label="Automatically size ' + title + '">↕ AUTO</button>' +
      '<button class="hdr-btn remove-btn" title="Remove from this workspace" aria-label="Remove ' + title + '">×</button></header>' +
      '<div class="panel-body"></div><div class="panel-resize-handle" aria-hidden="true" title="Drag to resize height"><span>···</span></div>';
    panel.querySelector(".size-btn").addEventListener("click", function () { TT.grid.cycleSize(panel); });
    panel.querySelector(".height-btn").addEventListener("click", function () { TT.grid.resetHeight(panel); });
    panel.querySelector(".remove-btn").addEventListener("click", function () { if (TT.app && TT.app.removeWidget) TT.app.removeWidget(id); });
    panel.querySelector(".grip").setAttribute("title", "Drag to rearrange");
    return panel;
  };
  TT.widgets.valueClass = function (value) { return value > 0.005 ? "up" : value < -0.005 ? "down" : "flat"; };
  TT.widgets.format = function (number, digits) {
    return Number(number).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };
  TT.widgets.escapeHTML = function (value) {
    var node = document.createElement("span"); node.textContent = String(value == null ? "" : value); return node.innerHTML;
  };
})(window.TT = window.TT || {});
