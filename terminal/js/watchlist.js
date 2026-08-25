/* Persistent watchlist state shared by the research drawer and widget. */
(function (TT) {
  "use strict";
  var symbols = TT.store.getWatchlist();
  var listeners = [];

  function notify() {
    TT.store.saveWatchlist(symbols);
    listeners.forEach(function (listener) { listener(symbols.slice()); });
  }

  TT.watchlist = {
    get: function () { return symbols.slice(); },
    contains: function (symbol) { return symbols.indexOf(symbol) !== -1; },
    add: function (symbol) {
      if (!TT.universe.index[symbol] || this.contains(symbol)) return false;
      symbols.push(symbol); notify(); return true;
    },
    remove: function (symbol) {
      var index = symbols.indexOf(symbol); if (index === -1) return false;
      symbols.splice(index, 1); notify(); return true;
    },
    toggle: function (symbol) { return this.contains(symbol) ? (this.remove(symbol), false) : (this.add(symbol), true); },
    subscribe: function (listener) { listeners.push(listener); return function () { listeners = listeners.filter(function (item) { return item !== listener; }); }; }
  };
})(window.TT = window.TT || {});
