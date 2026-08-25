(function (TT) {
  "use strict";
  function parts(now, timeZone) {
    var values = {};
    new Intl.DateTimeFormat("en-GB", { timeZone: timeZone, hour12: false, weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(now).forEach(function (part) { values[part.type] = part.value; });
    return values;
  }
  TT.widgets.clocks = {
    create: function () {
      var panel = TT.widgets.panel("clocks", "WORLD SESSION CLOCKS");
      var body = panel.querySelector(".panel-body");
      body.innerHTML = '<div class="clock-grid"></div>';
      function render() {
        var now = new Date();
        body.firstChild.innerHTML = TT.universe.clocks.map(function (clock) {
          var p = parts(now, clock.tz); var hour = Number(p.hour) % 24;
          var weekday = p.weekday !== "Sat" && p.weekday !== "Sun";
          var open = weekday && hour >= clock.open && hour < clock.close;
          return '<div class="clock-cell"><div class="c-city">' + clock.city + '</div>' +
            '<div class="c-time">' + p.hour + ':' + p.minute + '<span class="clock-seconds">:' + p.second + '</span></div>' +
            '<div class="c-meta"><span>' + p.weekday.toUpperCase() + '</span> · <span class="' + (open ? "open" : "closed") + '">' + (open ? "● OPEN" : "○ CLOSED") + '</span></div></div>';
        }).join("");
      }
      render(); panel._timer = window.setInterval(render, 1000); return panel;
    }
  };
})(window.TT = window.TT || {});
