/* Collision-free dashboard grid with natural sizing and pointer drag-resize. */
(function (TT) {
  "use strict";

  var ROW_HEIGHT = 8;
  var GAP = 6;
  var MIN_HEIGHT = 118;
  var draggedId = null;
  var editing = false;
  var observers = [];

  function entries(canvas) {
    return Array.prototype.map.call(canvas.children, function (node) {
      return {
        id: node.dataset.widgetId,
        size: node.dataset.size || "md",
        heightPx: node.dataset.heightPx ? Math.round(Number(node.dataset.heightPx)) : null
      };
    });
  }

  function persist(canvas) { TT.store.saveLayout(entries(canvas)); }

  function naturalHeight(panel) {
    var header = panel.querySelector(".panel-header");
    var body = panel.querySelector(".panel-body");
    return Math.max(MIN_HEIGHT, (header ? header.offsetHeight : 0) + (body ? body.scrollHeight : 0) + 2);
  }

  function place(panel) {
    if (!panel || !panel.isConnected) return;
    var manual = Number(panel.dataset.heightPx) || 0;
    var height = manual ? Math.max(MIN_HEIGHT, manual) : naturalHeight(panel);
    var span = Math.max(1, Math.ceil((height + GAP) / (ROW_HEIGHT + GAP)));
    panel.style.gridRowEnd = "span " + span;
    panel.classList.toggle("manual-height", Boolean(manual));
    var body = panel.querySelector(".panel-body");
    if (body) body.style.overflowY = manual && height < naturalHeight(panel) ? "auto" : "visible";
    var heightButton = panel.querySelector(".height-btn");
    if (heightButton) heightButton.textContent = manual ? "↕ " + Math.round(height) : "↕ AUTO";
  }

  function schedule(panel) { window.requestAnimationFrame(function () { place(panel); }); }

  function clearObservers() {
    observers.forEach(function (observer) { observer.disconnect(); });
    observers = [];
  }

  function observe(panel) {
    var body = panel.querySelector(".panel-body");
    if (!body) return;
    var mutation = new MutationObserver(function () { schedule(panel); });
    mutation.observe(body, { childList: true, subtree: true, characterData: true });
    observers.push(mutation);
  }

  function setEditing(canvas, value) {
    editing = Boolean(value);
    canvas.classList.toggle("layout-editing", editing);
    Array.prototype.forEach.call(canvas.children, function (panel) { panel.draggable = editing; });
  }

  function startResize(event, panel) {
    if (!editing) return;
    event.preventDefault();
    event.stopPropagation();
    var startY = event.clientY;
    var startHeight = panel.getBoundingClientRect().height;
    var handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    panel.classList.add("resizing");

    function move(moveEvent) {
      var next = Math.max(MIN_HEIGHT, startHeight + moveEvent.clientY - startY);
      panel.dataset.heightPx = Math.round(next);
      place(panel);
    }
    function end(endEvent) {
      handle.releasePointerCapture(endEvent.pointerId);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      panel.classList.remove("resizing");
      persist(panel.parentNode);
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  TT.grid = {
    mount: function (canvas, layout, renderWidget) {
      clearObservers();
      canvas.innerHTML = "";
      layout.forEach(function (entry) {
        var panel = renderWidget(entry.id);
        if (!panel) return;
        panel.dataset.widgetId = entry.id;
        panel.dataset.size = entry.size || "md";
        panel.dataset.heightPx = entry.heightPx || "";
        panel.classList.add("span-" + (entry.size || "md"));
        panel.draggable = editing;
        panel.addEventListener("dragstart", function (event) {
          if (!editing) { event.preventDefault(); return; }
          draggedId = entry.id;
          panel.classList.add("dragging");
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", entry.id);
        });
        panel.addEventListener("dragend", function () {
          draggedId = null;
          panel.classList.remove("dragging");
          Array.prototype.forEach.call(canvas.children, function (item) { item.classList.remove("drop-before", "drop-after"); });
        });
        panel.addEventListener("dragover", function (event) {
          if (!editing || !draggedId || draggedId === entry.id) return;
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
          panel.classList.remove("drop-before", "drop-after");
          persist(canvas);
          TT.grid.refresh(canvas);
        });
        var handle = panel.querySelector(".panel-resize-handle");
        if (handle) handle.addEventListener("pointerdown", function (event) { startResize(event, panel); });
        canvas.appendChild(panel);
        observe(panel);
        schedule(panel);
      });
      setEditing(canvas, editing);
    },

    refresh: function (target) {
      if (!target) return;
      if (target.classList && target.classList.contains("panel")) place(target);
      else Array.prototype.forEach.call(target.children || [], place);
    },

    setEditing: setEditing,
    isEditing: function () { return editing; },

    cycleSize: function (panel) {
      var sizes = ["sm", "md", "lg"];
      var next = sizes[(sizes.indexOf(panel.dataset.size) + 1) % sizes.length];
      sizes.forEach(function (size) { panel.classList.remove("span-" + size); });
      panel.dataset.size = next;
      panel.classList.add("span-" + next);
      persist(panel.parentNode);
      TT.grid.refresh(panel.parentNode);
    },

    resetHeight: function (panel) {
      panel.dataset.heightPx = "";
      place(panel);
      persist(panel.parentNode);
    }
  };

  window.addEventListener("resize", function () {
    var canvas = document.getElementById("canvas");
    if (canvas) TT.grid.refresh(canvas);
  });
})(window.TT = window.TT || {});
