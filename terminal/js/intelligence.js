(function (TT) {
  "use strict";
  var request;
  TT.intelligence = {
    load: function () {
      if (request) return request;
      if (window.location.protocol === "file:") {
        request = Promise.resolve({ offline: true, news: [], insiders: [], congress: [], sources: {}, errors: {} });
      } else {
        request = window.fetch("/api/intelligence", { cache: "no-store" }).then(function (response) {
          if (!response.ok) throw new Error("Briefing feed unavailable");
          return response.json();
        }).catch(function (error) {
          return { news: [], insiders: [], congress: [], sources: {}, errors: { briefing: error.message } };
        });
      }
      return request.then(function (data) { TT.intelligence.latest = data; return data; });
    },
    snapshotText: function () {
      var data = TT.intelligence.latest;
      if (!data) return "Briefing context: not loaded.";
      var headlines = (data.news || []).slice(0, 5).map(function (row) { return "- " + row.title + " (" + row.publisher + ")"; });
      var insiders = (data.insiders || []).slice(0, 5).map(function (row) { return "- " + row.symbol + " " + row.side + " " + row.shares + " shares by " + row.owner + " on " + row.date; });
      var congressSource = (data.sources || {}).congress || {};
      return "RECENT ATTRIBUTED HEADLINES:\n" + (headlines.join("\n") || "- unavailable") + "\nRECENT SEC FORM 4 OPEN-MARKET P/S:\n" + (insiders.join("\n") || "- none loaded") + "\nCongress adapter: " + (congressSource.stale ? "STALE" : "current-indicated") + (congressSource.lastUpdated ? ", last updated " + congressSource.lastUpdated : "") + ". Congressional disclosures may lag transactions up to 45 days.";
    }
  };
})(window.TT = window.TT || {});
