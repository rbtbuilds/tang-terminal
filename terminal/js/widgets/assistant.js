(function (TT) {
  "use strict";
  TT.widgets.assistant = {
    create: function () {
      var panel = TT.widgets.panel("assistant", "LOCAL AI MARKET ASSISTANT · OLLAMA");
      panel.querySelector(".panel-body").innerHTML = '<div class="assistant"><div class="assistant-config"><label>HOST <input class="ai-host" aria-label="Ollama host"></label><label>MODEL <select class="ai-model" aria-label="Ollama model"><option value="">AUTO-DETECT</option></select></label><button class="ai-connect">CONNECT</button></div><div class="assistant-log" aria-live="polite"><div class="msg sys"><span class="who">SYSTEM</span><br>Connect to a local Ollama model, then ask for a concise read of the dashboard. Your data stays on this machine.</div></div><form class="assistant-input-row"><input type="text" aria-label="Ask the market assistant" placeholder="Ask: What is leading risk sentiment?" autocomplete="off"><button type="submit">RUN ↵</button></form></div>';
      var settings = TT.store.getSettings(); var host = panel.querySelector(".ai-host"); var model = panel.querySelector(".ai-model"); var log = panel.querySelector(".assistant-log");
      host.value = settings.ollama.host;
      function add(who, text, kind) { var div = document.createElement("div"); div.className = "msg " + kind; var label = document.createElement("span"); label.className = "who"; label.textContent = who; var message = document.createElement("div"); message.className = "msg-content"; message.textContent = text; div.appendChild(label); div.appendChild(message); log.appendChild(div); log.scrollTop = log.scrollHeight; return message; }
      function addInline(target, text) {
        text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).forEach(function (part) {
          if (part.slice(0, 2) === "**" && part.slice(-2) === "**") { var strong = document.createElement("strong"); strong.textContent = part.slice(2, -2); target.appendChild(strong); }
          else if (part.charAt(0) === "*" && part.slice(-1) === "*") { var emphasis = document.createElement("em"); emphasis.textContent = part.slice(1, -1); target.appendChild(emphasis); }
          else target.appendChild(document.createTextNode(part));
        });
      }
      function renderMarkdown(target, markdown) {
        target.innerHTML = ""; var list = null; var listType = "";
        String(markdown || "").split(/\r?\n/).forEach(function (line) {
          var heading = line.match(/^#{1,3}\s+(.+)/); var bullet = line.match(/^\s*[-*]\s+(.+)/); var numbered = line.match(/^\s*\d+[.)]\s+(.+)/);
          if (/^\s*---+\s*$/.test(line)) { list = null; target.appendChild(document.createElement("hr")); return; }
          if (heading) { list = null; var h = document.createElement("h3"); addInline(h, heading[1]); target.appendChild(h); return; }
          if (bullet || numbered) { var type = numbered ? "ol" : "ul"; if (!list || listType !== type) { list = document.createElement(type); listType = type; target.appendChild(list); } var li = document.createElement("li"); addInline(li, (bullet || numbered)[1]); list.appendChild(li); return; }
          list = null; listType = ""; if (!line.trim()) return; var p = document.createElement("p"); addInline(p, line); target.appendChild(p);
        });
      }
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
        if (!prompt || panel._busy) return; input.value = ""; panel._busy = true; add("YOU", prompt, "user"); var thinking = add("TANG", "Thinking locally…", "bot");
        save();
        if (!settings.ollama.model) { thinking.textContent = "Select or install an Ollama model first."; panel._busy = false; return; }
        TT.ollama.generate(settings.ollama, prompt, TT.app.marketSnapshot()).then(function (data) { renderMarkdown(thinking, data.response || "No response."); }).catch(function (err) { thinking.textContent = err.message + ". Check Ollama and model settings."; }).then(function () { panel._busy = false; });
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
