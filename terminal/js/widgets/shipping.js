/* World shipping monitor: local Natural Earth basemap + server-side AIS bridge. */
(function (TT) {
  "use strict";

  var DEMO_POSITIONS = [
    { mmsi: "DEMO001", name: "TI EUROPE", lat: 25.7, lon: 56.3, speed: 12.4, course: 112, type: "85", seen: 0 },
    { mmsi: "DEMO002", name: "HAFNIA ATLANTIC", lat: 1.3, lon: 103.8, speed: 11.8, course: 57, type: "82", seen: 0 },
    { mmsi: "DEMO003", name: "FRONT ALTA", lat: 29.1, lon: -89.4, speed: 10.9, course: 128, type: "80", seen: 0 },
    { mmsi: "DEMO004", name: "MARAN GAS", lat: 31.1, lon: 32.3, speed: 16.2, course: 331, type: "84", seen: 0 },
    { mmsi: "DEMO005", name: "SEA LYNX", lat: 50.2, lon: -1.7, speed: 13.1, course: 74, type: "81", seen: 0 },
    { mmsi: "DEMO006", name: "CAPE VOYAGER", lat: -34.8, lon: 18.1, speed: 12.7, course: 305, type: "89", seen: 0 }
  ];
  var ROUTES = [
    [[56, 26], [73, 18], [103, 2]], [[32, 30], [43, 12], [73, 18]],
    [[-95, 28], [-80, 25], [-5, 51]], [[18, -35], [-5, 5], [-80, 25]]
  ];
  var geometryPromise = null;

  function loadGeometry() {
    if (window.location.protocol === "file:") return Promise.resolve(null);
    if (!geometryPromise) geometryPromise = window.fetch("data/world-110m.geojson").then(function (response) {
      if (!response.ok) throw new Error("Basemap unavailable");
      return response.json();
    }).catch(function () { return null; });
    return geometryPromise;
  }

  function typeLabel(value) {
    var code = parseInt(value, 10);
    if (code >= 80 && code <= 89) return code === 84 ? "LPG / HAZ" : "TANKER";
    if (code >= 70 && code <= 79) return "CARGO";
    return String(value || "AIS TARGET").replace("AIS TARGET", "UNCLASSIFIED");
  }

  function project(lon, lat, width, height) {
    return [(lon + 180) / 360 * width, (90 - lat) / 180 * height];
  }

  function drawGeometry(context, geometry, width, height) {
    if (!geometry || !geometry.features) return;
    context.beginPath();
    geometry.features.forEach(function (feature) {
      var polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [];
      polygons.forEach(function (polygon) {
        polygon.forEach(function (ring) {
          ring.forEach(function (point, index) {
            var xy = project(point[0], point[1], width, height);
            if (!index) context.moveTo(xy[0], xy[1]); else context.lineTo(xy[0], xy[1]);
          });
          context.closePath();
        });
      });
    });
    context.fillStyle = "#0d251c";
    context.strokeStyle = "#244d3a";
    context.lineWidth = 0.55;
    context.fill();
    context.stroke();
  }

  function drawMap(canvas, geometry, positions) {
    var ratio = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(420, rect.width);
    var height = Math.max(300, rect.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    var context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    context.fillStyle = "#041018";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(63,217,217,.09)";
    context.lineWidth = 1;
    [-120, -60, 0, 60, 120].forEach(function (lon) { var x = project(lon, 0, width, height)[0]; context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); });
    [-60, -30, 0, 30, 60].forEach(function (lat) { var y = project(0, lat, width, height)[1]; context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); });
    drawGeometry(context, geometry, width, height);
    context.strokeStyle = "rgba(255,176,0,.58)";
    context.lineWidth = 1.2;
    ROUTES.forEach(function (route) {
      context.beginPath();
      route.forEach(function (point, index) { var xy = project(point[0], point[1], width, height); if (!index) context.moveTo(xy[0], xy[1]); else context.lineTo(xy[0], xy[1]); });
      context.stroke();
    });
    positions.forEach(function (vessel) {
      var xy = project(Number(vessel.lon), Number(vessel.lat), width, height);
      var tanker = typeLabel(vessel.type).indexOf("TANKER") !== -1 || typeLabel(vessel.type).indexOf("LPG") !== -1;
      context.save();
      context.translate(xy[0], xy[1]);
      context.rotate((Number(vessel.course) || 0) * Math.PI / 180);
      context.beginPath();
      context.moveTo(0, -4.5); context.lineTo(3.2, 4); context.lineTo(-3.2, 4); context.closePath();
      context.fillStyle = tanker ? "#ffb000" : "#58b7ff";
      context.fill();
      context.restore();
    });
  }

  TT.widgets.shipping = {
    create: function () {
      var panel = TT.widgets.panel("shipping", "GLOBAL SHIPPING · AIS CORRIDORS");
      var body = panel.querySelector(".panel-body");
      var geometry = null;
      var positions = DEMO_POSITIONS.slice();
      var live = false;
      var timer = null;
      body.innerHTML = '<div class="shipping-layout"><section class="shipping-map-wrap"><canvas class="shipping-map" aria-label="World map showing recent AIS vessel positions"></canvas><div class="map-legend"><span class="legend-tanker">▲ CONFIRMED TANKER</span><span class="legend-target">▲ AIS TARGET</span><span>— INDICATIVE ROUTE</span></div></section><section class="vessel-monitor"><header><span>RECENT TARGETS</span><strong class="ais-state amber">DEMO</strong></header><div class="vessel-list"></div><p class="ais-note">Loading local basemap…</p></section></div>';
      var canvas = body.querySelector(".shipping-map");
      var list = body.querySelector(".vessel-list");
      var state = body.querySelector(".ais-state");
      var note = body.querySelector(".ais-note");

      function render() {
        drawMap(canvas, geometry, positions);
        list.innerHTML = positions.slice(0, 14).map(function (vessel) {
          var speed = Number.isFinite(Number(vessel.speed)) ? Number(vessel.speed).toFixed(1) + " kn" : "—";
          return '<div class="vessel-row"><span><strong>' + TT.widgets.escapeHTML(vessel.name) + '</strong><small>' + TT.widgets.escapeHTML(typeLabel(vessel.type)) + ' · ' + TT.widgets.escapeHTML(vessel.mmsi) + '</small></span><span>' + speed + '</span></div>';
        }).join("");
        if (TT.grid) TT.grid.refresh(panel);
      }

      function updateAIS() {
        if (window.location.protocol === "file:") return;
        window.fetch("/api/ais/positions", { cache: "no-store" }).then(function (response) {
          if (!response.ok) throw new Error("AIS bridge unavailable");
          return response.json();
        }).then(function (payload) {
          live = payload.state === "LIVE" && payload.positions && payload.positions.length > 0;
          positions = live ? payload.positions : DEMO_POSITIONS.slice();
          state.textContent = live ? "LIVE · " + payload.count : payload.configured ? (payload.state === "LIVE" ? "CONNECTED · WAITING" : payload.state) : "KEY REQUIRED";
          state.className = "ais-state " + (live ? "up" : "amber");
          note.textContent = live ? payload.coverage + ". Positions expire after 30 minutes." : payload.configured ? "Connecting to AISStream; showing clearly labelled demo positions until messages arrive." : "Set TANG_AISSTREAM_API_KEY in .tang-terminal.env; showing demo positions.";
          render();
        }).catch(function () {
          live = false; positions = DEMO_POSITIONS.slice(); state.textContent = "DEMO"; state.className = "ais-state amber";
          note.textContent = "AIS bridge unavailable; showing offline demo positions."; render();
        });
      }

      loadGeometry().then(function (data) { geometry = data; note.textContent = window.location.protocol === "file:" ? "Open through the local launcher for the packaged world basemap and live AIS." : note.textContent; render(); });
      render(); updateAIS();
      if (window.location.protocol !== "file:") timer = window.setInterval(updateAIS, 10000);
      panel._timer = timer;
      panel._draw = render;
      panel._observer = new ResizeObserver(function () { drawMap(canvas, geometry, positions); });
      panel._observer.observe(body.querySelector(".shipping-map-wrap"));
      return panel;
    }
  };
})(window.TT = window.TT || {});
