(function (TT) {
  "use strict";
  function endpoint(settings, path) {
    if (window.location.protocol !== "file:" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
      return "/api/ollama" + path;
    }
    return settings.host.replace(/\/$/, "") + path;
  }
  TT.ollama = {
    listModels: function (settings) {
      return window.fetch(endpoint(settings, "/api/tags")).then(function (r) { if (!r.ok) throw new Error("Ollama unavailable"); return r.json(); })
        .then(function (data) { return (data.models || []).map(function (x) { return x.name; }); });
    },
    generate: function (settings, prompt, context) {
      return window.fetch(endpoint(settings, "/api/generate"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: settings.model, prompt: prompt, system: "You are TANG, a concise market-monitoring assistant. Use the supplied snapshot, distinguish simulated from live data, never invent prices, and state that commentary is not financial advice.\n\nMARKET SNAPSHOT:\n" + context, stream: false, think: false })
      }).then(function (r) { if (!r.ok) throw new Error("Ollama request failed (" + r.status + ")"); return r.json(); });
    }
  };
})(window.TT = window.TT || {});
