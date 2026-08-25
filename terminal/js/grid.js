/* Lightweight keyboard-accessible drag/drop grid with persisted size/order. */
(function (TT) {
  "use strict";
  var draggedId = null;

  function persist(canvas) {
    TT.store.saveLayout(Array.prototype.map.call(canvas.children, function (node) {
      return { id: node.dataset.widgetId, size: node.dataset.size || "md", height: node.dataset.height || "auto" };
    }));
  }

  TT.grid = {
    mount: function (canvas, layout, renderWidget) {
      canvas.innerHTML = "";
      layout.forEach(function (entry) {
        var panel = renderWidget(entry.id);
        if (!panel) return;
        panel.dataset.widgetId = entry.id;
        panel.dataset.size = entry.size;
        panel.dataset.height = entry.height || "auto";
        panel.classList.add("span-" + entry.size);
        panel.classList.add("height-" + (entry.height || "auto"));
        if (panel.querySelector(".height-btn")) panel.querySelector(".height-btn").textContent = "↕ " + (entry.height || "auto").toUpperCase();
        panel.draggable = true;
        panel.addEventListener("dragstart", function (event) {
          draggedId = entry.id; panel.classList.add("dragging");
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", entry.id);
        });
        panel.addEventListener("dragend", function () {
          draggedId = null; panel.classList.remove("dragging");
          canvas.classList.remove("drop-target");
          Array.prototype.forEach.call(canvas.children, function (x) { x.classList.remove("drop-before", "drop-after"); });
        });
        panel.addEventListener("dragover", function (event) {
          if (!draggedId || draggedId === entry.id) return;
          event.preventDefault();
          var before = event.clientY < panel.getBoundingClientRect().top + panel.offsetHeight / 2;
          panel.classList.toggle("drop-before", before);
          panel.classList.toggle("drop-after", !before);
        });
        panel.addEventListener("dragleave", function () { panel.classList.remove("drop-before", "drop-after"); });
        panel.addEventListener("drop", function (event) {
          event.preventDefault();
          var source = canvas.querySelector('[data-widget-id="' + draggedId + '"]');
          if (!source || source === panel) return;
          var before = event.clientY < panel.getBoundingClientRect().top + panel.offsetHeight / 2;
          canvas.insertBefore(source, before ? panel : panel.nextSibling);
          persist(canvas);
        });
        canvas.appendChild(panel);
      });
      canvas.ondragover = function (event) { event.preventDefault(); canvas.classList.add("drop-target"); };
      canvas.ondrop = function () { canvas.classList.remove("drop-target"); };
    },
    cycleSize: function (panel) {
      var sizes = ["sm", "md", "lg"];
      var next = sizes[(sizes.indexOf(panel.dataset.size) + 1) % sizes.length];
      sizes.forEach(function (size) { panel.classList.remove("span-" + size); });
      panel.dataset.size = next; panel.classList.add("span-" + next);
      persist(panel.parentNode);
    },
    cycleHeight: function (panel) {
      var heights = ["auto", "tall", "max"];
      var current = panel.dataset.height || "auto";
      var next = heights[(heights.indexOf(current) + 1) % heights.length];
      heights.forEach(function (height) { panel.classList.remove("height-" + height); });
      panel.dataset.height = next; panel.classList.add("height-" + next);
      var button = panel.querySelector(".height-btn"); if (button) button.textContent = "↕ " + next.toUpperCase();
      persist(panel.parentNode);
    }
  };
})(window.TT = window.TT || {});
