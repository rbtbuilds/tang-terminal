/* ==========================================================================
   TANG TERMINAL — store.js
   Tiny localStorage-backed state store. Owns layout persistence and user
   settings. Everything is namespaced under one key prefix so the app never
   collides with other pages on the same origin (important for file://).
   ========================================================================== */
(function (TT) {
  "use strict";

  var PREFIX = "tang-terminal:";
  var LAYOUT_KEY = PREFIX + "layout.v1";
  var SETTINGS_KEY = PREFIX + "settings.v1";
  var WATCHLIST_KEY = PREFIX + "watchlist.v1";
  var CUSTOM_SYMBOLS_KEY = PREFIX + "symbols.v1";
  var WORKSPACES_KEY = PREFIX + "workspaces.v1";

  /** Default widget layout: order + size for every known widget id. */
  var DEFAULT_LAYOUT = [
    { id: "clocks",    size: "lg" },
    { id: "indices",   size: "md" },
    { id: "heatmap",   size: "md" },
    { id: "stocks",    size: "md" },
    { id: "watchlist", size: "sm" },
    { id: "metals",    size: "sm" },
    { id: "assistant", size: "lg" }
  ];

  var WORKSPACES = [
    { id: "markets", label: "MARKETS" },
    { id: "energy", label: "ENERGY & COMMODITIES" },
    { id: "research", label: "RESEARCH" }
  ];

  var DEFAULT_LAYOUTS = {
    markets: DEFAULT_LAYOUT,
    energy: [
      { id: "energy", size: "md" }, { id: "commodities", size: "md" },
      { id: "tankers", size: "md" }, { id: "macro", size: "md" },
      { id: "watchlist", size: "md" }, { id: "assistant", size: "lg" }
    ],
    research: [
      { id: "watchlist", size: "md" }, { id: "macro", size: "md" },
      { id: "indices", size: "md" }, { id: "assistant", size: "lg" }
    ]
  };

  var DEFAULT_SETTINGS = {
    dataMode: "demo",                 // "demo" | "live"
    fontScale: 1,
    ollama: {
      host: "http://localhost:11434",
      model: ""                       // empty = auto-pick first installed model
    }
  };

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      // Corrupt storage should never break the dashboard — fall back cleanly.
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      // Storage can be unavailable (private mode, quota). Non-fatal.
      return false;
    }
  }

  function copyLayout(layout) {
    return layout.map(function (entry) { return { id: entry.id, size: entry.size, height: entry.height || "auto" }; });
  }

  function workspaceState() {
    var saved = readJSON(WORKSPACES_KEY, null);
    if (saved && saved.layouts && saved.active) return saved;
    var legacy = readJSON(LAYOUT_KEY, null);
    return {
      active: "markets",
      layouts: {
        markets: Array.isArray(legacy) && legacy.length ? legacy : copyLayout(DEFAULT_LAYOUTS.markets),
        energy: copyLayout(DEFAULT_LAYOUTS.energy),
        research: copyLayout(DEFAULT_LAYOUTS.research)
      }
    };
  }

  TT.store = {
    /** Returns the current workspace layout, migrating the original layout once. */
    getLayout: function () {
      var state = workspaceState();
      return copyLayout(state.layouts[state.active] || DEFAULT_LAYOUTS.markets);
    },

    saveLayout: function (layout) {
      var state = workspaceState(); state.layouts[state.active] = copyLayout(layout); writeJSON(WORKSPACES_KEY, state);
    },

    resetLayout: function () {
      var state = workspaceState(); state.layouts[state.active] = copyLayout(DEFAULT_LAYOUTS[state.active] || DEFAULT_LAYOUTS.markets); writeJSON(WORKSPACES_KEY, state); return copyLayout(state.layouts[state.active]);
    },

    getWorkspaces: function () { return WORKSPACES.slice(); },

    getActiveWorkspace: function () { return workspaceState().active; },

    setActiveWorkspace: function (id) {
      if (!DEFAULT_LAYOUTS[id]) return false;
      var state = workspaceState(); state.active = id; writeJSON(WORKSPACES_KEY, state); return true;
    },

    addWidget: function (id, size) {
      var layout = this.getLayout();
      if (layout.some(function (entry) { return entry.id === id; })) return layout;
      layout.push({ id: id, size: size || "md" }); this.saveLayout(layout); return layout;
    },

    removeWidget: function (id) {
      var layout = this.getLayout().filter(function (entry) { return entry.id !== id; }); this.saveLayout(layout); return layout;
    },

    getSettings: function () {
      var saved = readJSON(SETTINGS_KEY, {});
      // Shallow-merge over defaults so new settings keys appear automatically.
      var merged = {};
      for (var k in DEFAULT_SETTINGS) merged[k] = DEFAULT_SETTINGS[k];
      for (var k2 in saved) merged[k2] = saved[k2];
      merged.ollama = Object.assign({}, DEFAULT_SETTINGS.ollama, saved.ollama || {});
      return merged;
    },

    saveSettings: function (settings) {
      writeJSON(SETTINGS_KEY, settings);
    },

    getWatchlist: function () {
      var saved = readJSON(WATCHLIST_KEY, []);
      return Array.isArray(saved) ? saved.filter(function (symbol, index, list) {
        return typeof symbol === "string" && list.indexOf(symbol) === index;
      }) : [];
    },

    saveWatchlist: function (symbols) {
      return writeJSON(WATCHLIST_KEY, symbols);
    },

    getCustomSymbols: function () {
      var saved = readJSON(CUSTOM_SYMBOLS_KEY, []); return Array.isArray(saved) ? saved : [];
    },

    saveCustomSymbols: function (symbols) {
      return writeJSON(CUSTOM_SYMBOLS_KEY, symbols);
    }
  };
})(window.TT = window.TT || {});
