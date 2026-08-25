(function (TT) {
  "use strict";
  TT.widgets.assistant = {
    create: function () {
      var panel = TT.widgets.panel("assistant", "LOCAL AI MARKET ASSISTANT · OLLAMA");
      panel.querySelector(".panel-body").innerHTML = '<div class="assistant"><div class="assistant-config"><label>HOST <input class="ai-host" aria-label="Ollama host"></label><label>MODEL <select class="ai-model" aria-label="Ollama model"><option value="">AUTO-DETECT</option></select></label><button class="ai-connect">CONNECT</button></div><div class="assistant-log" aria-live="polite"><div class="msg sys"><span class="who">SYSTEM</span><br>Connect to a local Ollama model, then ask for a concise read of the dashboard. Your data stays on this machine.</div></div><form class="assistant-input-row"><input type="text" aria-label="Ask the market assistant" placeholder="Ask: What is leading risk sentiment?" autocomplete="off"><button type="submit">RUN ↵</button></form></div>';
      var settings = TT.store.getSettings(); var host = panel.querySelector(".ai-host"); var model = panel.querySelector(".ai-model"); var log = panel.querySelector(".assistant-log");
      host.value = settings.ollama.host;
      function add(who, text, kind) { var div = document.createElement("div"); div.className = "msg " + kind; var label = document.createElement("span"); label.className = "who"; label.textContent = who; div.appendChild(label); div.appendChild(document.createElement("br")); div.appendChild(document.createTextNode(text)); log.appendChild(div); log.scrollTop = log.scrollHeight; }
      function save() { settings.ollama.host = host.value.trim() || "http://localhost:11434"; settings.ollama.model = model.value; TT.store.saveSettings(settings); }
      function connect(quiet) {
        settings.ollama.host = host.value.trim() || "http://localhost:11434";
        return TT.ollama.listModels(settings.ollama).then(function (models) {
          var selected = settings.ollama.model || models[0] || "";
          model.innerHTML = models.length ? models.map(function (name) { return '<option value="' + name.replace(/"/g, "&quot;") + '">' + name + '</option>'; }).join("") : '<option value="">NO MODELS</option>';
          model.value = selected; save(); TT.app.setAIStatus(models.length ? "ok" : "warn", models.length ? selected : "NO MODELS");
          if (!quiet) add("SYSTEM", models.length ? "Connected to " + selected + "." : "Ollama is running, but no models are installed.", "sys");
        }).catch(function () { TT.app.setAIStatus("bad", "OFFLINE"); if (!quiet) add("SYSTEM", "Could not reach Ollama. Start it, install a model, then connect again.", "sys"); });
      }
      panel.querySelector(".ai-connect").addEventListener("click", function () { connect(false); });
      model.addEventListener("change", save); host.addEventListener("change", save);
      panel.querySelector("form").addEventListener("submit", function (event) {
        event.preventDefault(); var input = panel.querySelector('.assistant-input-row input'); var prompt = input.value.trim();
        if (!prompt || panel._busy) return; input.value = ""; panel._busy = true; add("YOU", prompt, "user"); add("TANG", "Thinking locally…", "bot"); var thinking = log.lastChild;
        save();
        if (!settings.ollama.model) { thinking.lastChild.textContent = " Select or install an Ollama model first."; panel._busy = false; return; }
        TT.ollama.generate(settings.ollama, prompt, TT.app.marketSnapshot()).then(function (data) { thinking.lastChild.textContent = data.response || "No response."; }).catch(function (err) { thinking.lastChild.textContent = err.message + ". Check Ollama and model settings."; }).then(function () { panel._busy = false; });
      });
      if (window.location.protocol !== "file:") {
        window.setTimeout(function () { connect(true); }, 500);
      } else {
        TT.app && TT.app.setAIStatus("warn", "CONNECT MANUALLY");
      }
      return panel;
    }
  };
})(window.TT = window.TT || {});
