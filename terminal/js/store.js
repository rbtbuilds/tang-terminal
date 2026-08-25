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

  var DEFAULT_SETTINGS = {
    dataMode: "demo",                 // "demo" | "live"
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

  TT.store = {
    /** Returns the persisted layout, merged with defaults for new widgets. */
    getLayout: function () {
      var saved = readJSON(LAYOUT_KEY, null);
      if (!Array.isArray(saved) || saved.length === 0) {
        return DEFAULT_LAYOUT.slice();
      }
      // Keep saved entries, then append any default widget the save predates.
      var seen = {};
      var layout = [];
      saved.forEach(function (entry) {
        if (entry && typeof entry.id === "string" && !seen[entry.id]) {
          seen[entry.id] = true;
          layout.push({ id: entry.id, size: entry.size || "md" });
        }
      });
      DEFAULT_LAYOUT.forEach(function (entry) {
        if (!seen[entry.id]) layout.push({ id: entry.id, size: entry.size });
      });
      return layout;
    },

    saveLayout: function (layout) {
      writeJSON(LAYOUT_KEY, layout);
    },

    resetLayout: function () {
      writeJSON(LAYOUT_KEY, DEFAULT_LAYOUT);
      return DEFAULT_LAYOUT.slice();
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
    }
  };
})(window.TT = window.TT || {});
