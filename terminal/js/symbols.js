/* User-added instruments discovered through the provider symbol search. */
(function (TT) {
  "use strict";
  var custom = TT.store.getCustomSymbols();

  function normalize(item) {
    var symbol = String(item.symbol || item.sym || "").toUpperCase();
    if (!/^[A-Z0-9.^=\/-]{1,24}$/.test(symbol)) symbol = "";
    return {
      sym: symbol,
      name: item.name || symbol,
      live: item.live || symbol,
      exchange: item.exchange || "",
      type: item.type || "Security",
      digits: Number.isFinite(item.digits) ? item.digits : 2,
      custom: true
    };
  }

  function indexAll() {
    custom = custom.map(normalize).filter(function (item, index, list) {
      return item.sym && list.findIndex(function (candidate) { return candidate.sym === item.sym; }) === index;
    });
    custom.forEach(function (item) { TT.universe.index[item.sym] = item; });
  }

  indexAll();
  TT.symbols = {
    all: function () { return custom.slice(); },
    register: function (item) {
      var normalized = normalize(item); if (!normalized.sym) return null;
      var existing = TT.universe.index[normalized.sym];
      if (existing && !existing.custom) return existing;
      custom = custom.filter(function (candidate) { return candidate.sym !== normalized.sym; });
      custom.push(normalized); TT.universe.index[normalized.sym] = normalized; TT.store.saveCustomSymbols(custom); return normalized;
    }
  };
})(window.TT = window.TT || {});
