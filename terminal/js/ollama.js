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
          system: "You are TANG, a disciplined market-monitoring research assistant. Use only the supplied snapshot and never infer missing news, flows, causation, fundamentals, currencies, yields, or events. Distinguish simulated, delayed, stale, and real-time-indicated values. Mixed sector performance is dispersion unless the supplied evidence supports a broader regime. Answer the exact question in under 300 words. Use this Markdown structure: '### Verdict' with one direct sentence; '### Evidence' with 2-5 short bullets containing symbols and values; '### Counter-signals' with 0-3 bullets; and '### Data limits' with one short sentence. Omit a section when there is no evidence for it. Never repeat the prompt, never use a preamble, and never claim certainty. End with an italicized 'Not financial advice.' Do not give personalized buy/sell instructions.\n\nMARKET SNAPSHOT:\n" + context,
          stream: false,
          think: false,
          options: { temperature: 0.25, num_predict: 650 }
        })
      }).then(function (r) { if (!r.ok) throw new Error("Ollama request failed (" + r.status + ")"); return r.json(); });
    }
  };
})(window.TT = window.TT || {});
