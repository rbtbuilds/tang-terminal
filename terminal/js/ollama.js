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
        body: JSON.stringify({
          model: settings.model,
          prompt: prompt,
          system: "You are TANG, a disciplined market-monitoring research assistant. Use only the supplied snapshot. Never invent prices, news, yields, currencies, causation, or events that are not provided. Distinguish simulated from live/delayed data. Treat mixed sector performance as dispersion, not automatically risk-off. Answer the user's question directly in under 350 words. Use clean Markdown with short headings and bullets. Start with a one-sentence verdict, then cite the strongest supporting and conflicting signals. End with 'Not financial advice.' Do not give personalized buy/sell instructions.\n\nMARKET SNAPSHOT:\n" + context,
          stream: false,
          think: false,
          options: { temperature: 0.25, num_predict: 650 }
        })
      }).then(function (r) { if (!r.ok) throw new Error("Ollama request failed (" + r.status + ")"); return r.json(); });
    }
  };
})(window.TT = window.TT || {});
