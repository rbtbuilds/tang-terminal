/* Reusable quote-table widgets for energy, commodities, tankers, and macro. */
(function (TT) {
  "use strict";

  function quoteRow(item, quote) {
    return '<tr class="quote-action" data-symbol="' + item.sym + '" tabindex="0" role="button"><td><strong>' + item.sym + '</strong></td><td class="faint">' + item.name + '</td><td class="num">' + (quote ? TT.widgets.format(quote.price, item.digits || 2) : '—') + '</td><td class="num ' + (quote ? TT.widgets.valueClass(quote.change) : 'faint') + '">' + (quote ? (quote.change >= 0 ? '+' : '') + quote.change.toFixed(2) + '%' : '—') + '</td></tr>';
  }

  function tableWidget(id, title, items, note) {
    return {
      create: function () {
        var panel = TT.widgets.panel(id, title); var body = panel.querySelector(".panel-body");
        panel.update = function (quotes) {
          body.innerHTML = '<table class="quote-table"><thead><tr><th>SYMBOL</th><th>INSTRUMENT</th><th class="num">LAST</th><th class="num">DAY</th></tr></thead><tbody>' + items.map(function (item) { return quoteRow(item, quotes[item.sym]); }).join("") + '</tbody></table>' + (note ? '<p class="widget-note">' + note + '</p>' : '');
        };
        panel.update({}); return panel;
      }
    };
  }

  TT.widgets.energy = {
    create: function () {
      var panel = TT.widgets.panel("energy", "ENERGY COMPLEX & OIL SPREADS"); var body = panel.querySelector(".panel-body");
      panel.update = function (quotes) {
        var cl = quotes.CL; var brent = quotes.BZ; var gasoline = quotes.RB; var heating = quotes.HO;
        function spread(label, value, unit) { return '<div class="energy-spread"><span>' + label + '</span><strong>' + (Number.isFinite(value) ? (value >= 0 ? '+' : '') + value.toFixed(2) : '—') + '</strong><small>' + unit + '</small></div>'; }
        body.innerHTML = '<table class="quote-table"><thead><tr><th>SYMBOL</th><th>INSTRUMENT</th><th class="num">LAST</th><th class="num">DAY</th></tr></thead><tbody>' + TT.universe.energy.map(function (item) { return quoteRow(item, quotes[item.sym]); }).join("") + '</tbody></table><div class="energy-spreads">' +
          spread("BRENT − WTI", brent && cl ? brent.price - cl.price : null, "USD / BBL") +
          spread("RBOB CRACK PROXY", gasoline && cl ? gasoline.price * 42 - cl.price : null, "USD / BBL") +
          spread("HEATING OIL CRACK", heating && cl ? heating.price * 42 - cl.price : null, "USD / BBL") +
          '</div><p class="widget-note">Front-month futures proxies. Crack values are simple 1:1 product-minus-crude approximations, not tradable refinery margins.</p>';
      };
      panel.update({}); return panel;
    }
  };
  TT.widgets.tankers = tableWidget("tankers", "TANKER EQUITIES", TT.universe.tankers, "Listed crude and product tanker operators · equity prices, not freight rates");
  TT.widgets.macro = tableWidget("macro", "CROSS-ASSET SIGNALS", TT.universe.macro, "Volatility / USD / US 10Y yield proxy / FX / crypto");

  TT.widgets.commodities = {
    create: function () {
      var panel = TT.widgets.panel("commodities", "GLOBAL COMMODITY MATRIX"); var body = panel.querySelector(".panel-body");
      panel.update = function (quotes) {
        body.innerHTML = '<table class="quote-table commodity-table"><thead><tr><th>SYMBOL</th><th>CONTRACT</th><th class="num">LAST</th><th class="num">DAY</th></tr></thead><tbody>' + TT.universe.commodities.map(function (group) {
          return '<tr class="commodity-group"><td colspan="4">' + group.group + '</td></tr>' + group.members.map(function (symbol) { var item = TT.universe.index[symbol]; return quoteRow(item, quotes[symbol]); }).join("");
        }).join("") + '</tbody></table><p class="widget-note">Front-month futures proxies; units and delays vary by exchange.</p>';
      };
      panel.update({}); return panel;
    }
  };
})(window.TT = window.TT || {});
