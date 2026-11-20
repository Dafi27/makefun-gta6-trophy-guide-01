/* Leonida Trophy Guide: loads trophies.json, renders the checklist, roadmap
   progress, filters, search, spoiler mode, and the trophy detail panel.
   Fully offline: the only fetch is the app's own data file. */
(function () {
  "use strict";

  var TROPHIES_URL = "data/trophies.json";
  var STAGE_NAMES = {
    1: "Stage 1 — Story",
    2: "Stage 2 — Strangers",
    3: "Stage 3 — Activities",
    4: "Stage 4 — Collectibles",
    5: "Stage 5 — Combat & chaos",
    6: "Stage 6 — Cleanup"
  };

  var state = {
    trophies: [],
    earned: {},
    prefs: { spoilerSafe: false, showGuides: true },
    filter: "all",
    query: "",
    openId: null
  };

  var els = {};
  ["trophyList", "listCount", "emptyState", "progressFill", "progressText",
   "searchBox", "spoilerToggle", "guidesToggle", "exportBtn", "importBtn",
   "importFile", "resetBtn", "filters", "detailPanel", "detailClose",
   "detailGrade", "detailTitle", "detailDesc", "detailMeta", "detailGuide",
   "detailSources", "detailEarned"
  ].forEach(function (id) { els[id] = document.getElementById(id); });

  function gradeLabel(t) {
    return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
  }

  function isSpoilerHidden(t) {
    return state.prefs.spoilerSafe && t.kind === "story" && !state.earned[t.id];
  }

  function trophyMatches(t) {
    var q = state.query.trim().toLowerCase();
    if (q) {
      var hay = (t.name + " " + t.description + " " + t.guide + " " + t.kind).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    switch (state.filter) {
      case "all": return true;
      case "story": return t.kind === "story";
      case "missable": return t.missable === true;
      case "collectibles": return t.kind === "collectibles";
      case "activities": return t.kind === "activities";
      case "earned": return !!state.earned[t.id];
      case "todo": return !state.earned[t.id];
      default: return true;
    }
  }

  function renderProgress() {
    var total = state.trophies.length;
    var done = state.trophies.filter(function (t) { return state.earned[t.id]; }).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    els.progressFill.style.width = pct + "%";
    els.progressText.textContent = done + " of " + total + " earned · " + pct + "%";
  }

  function renderList() {
    var shown = state.trophies.filter(trophyMatches);
    els.listCount.textContent = "Showing " + shown.length + " of " + state.trophies.length + " trophies";
    els.emptyState.hidden = shown.length > 0;
    els.trophyList.innerHTML = "";
    shown.forEach(function (t) {
      var li = document.createElement("li");
      li.className = "trophy-card" + (state.earned[t.id] ? " earned" : "");
      li.dataset.id = t.id;

      var check = document.createElement("input");
      check.type = "checkbox";
      check.className = "trophy-check";
      check.checked = !!state.earned[t.id];
      check.setAttribute("aria-label", "Mark " + t.name + " as earned");
      check.addEventListener("change", function () { setEarned(t.id, check.checked); });
      li.appendChild(check);

      var body = document.createElement("div");
      var name = document.createElement("h3");
      name.className = "trophy-name";
      name.textContent = isSpoilerHidden(t) ? "Hidden story trophy" : t.name;
      body.appendChild(name);

      var desc = document.createElement("p");
      desc.className = "trophy-desc";
      desc.textContent = isSpoilerHidden(t)
        ? "Earn this trophy to reveal its name and description."
        : t.description;
      body.appendChild(desc);

      var meta = document.createElement("p");
      var badge = document.createElement("span");
      badge.className = "grade-badge grade-" + t.grade;
      badge.textContent = gradeLabel(t);
      meta.appendChild(badge);
      meta.appendChild(document.createTextNode(" "));
      var kind = document.createElement("span");
      kind.className = "kind-tag";
      kind.textContent = STAGE_NAMES[t.stage] + " · " + t.kind;
      meta.appendChild(kind);
      if (t.missable) {
        meta.appendChild(document.createTextNode(" "));
        var flag = document.createElement("span");
        flag.className = "missable-flag";
        flag.textContent = "Missable";
        meta.appendChild(flag);
      }
      body.appendChild(meta);

      if (state.prefs.showGuides && !isSpoilerHidden(t)) {
        var guide = document.createElement("p");
        guide.className = "trophy-guide";
        guide.textContent = t.guide;
        body.appendChild(guide);
        var src = document.createElement("p");
        src.className = "trophy-sources";
        src.textContent = "Sources: " + t.sources.join("; ");
        body.appendChild(src);
      }
      li.appendChild(body);

      var actions = document.createElement("div");
      actions.className = "trophy-actions";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "guide-btn";
      btn.textContent = "Guide";
      btn.addEventListener("click", function () { openDetail(t.id); });
      actions.appendChild(btn);
      li.appendChild(actions);

      els.trophyList.appendChild(li);
    });
  }

  function openDetail(id) {
    var t = state.trophies.find(function (x) { return x.id === id; });
    if (!t) return;
    state.openId = id;
    var hidden = isSpoilerHidden(t);
    els.detailGrade.textContent = gradeLabel(t) + " trophy";
    els.detailTitle.textContent = hidden ? "Hidden story trophy" : t.name;
    els.detailDesc.textContent = hidden
      ? "Earn this trophy to reveal its name and description."
      : t.description;
    els.detailMeta.innerHTML = "";
    var bits = [
      STAGE_NAMES[t.stage], t.kind,
      t.missable ? "Missable — tied to one story mission or beat" : "Not missable"
    ];
    bits.forEach(function (b) {
      var s = document.createElement("span");
      s.textContent = b;
      els.detailMeta.appendChild(s);
    });
    els.detailGuide.textContent = hidden ? "Hidden until earned." : t.guide;
    els.detailSources.innerHTML = "";
    (hidden ? [] : t.sources).forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      els.detailSources.appendChild(li);
    });
    els.detailEarned.checked = !!state.earned[t.id];
    els.detailPanel.hidden = false;
    els.detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeDetail() {
    state.openId = null;
    els.detailPanel.hidden = true;
  }

  function setEarned(id, value) {
    if (value) state.earned[id] = true;
    else delete state.earned[id];
    window.TrophyStore.saveEarned(state.earned);
    renderProgress();
    renderList();
    if (state.openId === id) {
      els.detailEarned.checked = value;
    }
  }

  function exportProgress() {
    var text = window.TrophyStore.exportText(state.earned);
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "leonida-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        state.earned = window.TrophyStore.parseImport(String(reader.result));
        window.TrophyStore.saveEarned(state.earned);
        renderProgress();
        renderList();
      } catch (err) {
        alert("That file could not be imported as trophy progress.");
      }
    };
    reader.readAsText(file);
  }

  function bindEvents() {
    els.filters.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-filter]");
      if (!btn) return;
      state.filter = btn.dataset.filter;
      els.filters.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderList();
    });
    els.searchBox.addEventListener("input", function () {
      state.query = els.searchBox.value;
      renderList();
    });
    els.spoilerToggle.addEventListener("change", function () {
      state.prefs.spoilerSafe = els.spoilerToggle.checked;
      window.TrophyStore.savePrefs(state.prefs);
      renderList();
      if (state.openId) openDetail(state.openId);
    });
    els.guidesToggle.addEventListener("change", function () {
      state.prefs.showGuides = els.guidesToggle.checked;
      window.TrophyStore.savePrefs(state.prefs);
      renderList();
    });
    els.exportBtn.addEventListener("click", exportProgress);
    els.importBtn.addEventListener("click", function () { els.importFile.click(); });
    els.importFile.addEventListener("change", function () {
      if (els.importFile.files.length) importProgress(els.importFile.files[0]);
      els.importFile.value = "";
    });
    els.resetBtn.addEventListener("click", function () {
      if (!confirm("Clear all earned trophies? This cannot be undone.")) return;
      state.earned = {};
      window.TrophyStore.saveEarned(state.earned);
      renderProgress();
      renderList();
    });
    els.detailClose.addEventListener("click", closeDetail);
    els.detailEarned.addEventListener("change", function () {
      if (state.openId) setEarned(state.openId, els.detailEarned.checked);
    });
  }

  function init() {
    state.earned = window.TrophyStore.loadEarned();
    state.prefs = window.TrophyStore.loadPrefs();
    els.spoilerToggle.checked = !!state.prefs.spoilerSafe;
    els.guidesToggle.checked = state.prefs.showGuides !== false;
    bindEvents();
    fetch(TROPHIES_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        state.trophies = data.trophies.slice().sort(function (a, b) { return a.id - b.id; });
        renderProgress();
        renderList();
      })
      .catch(function () {
        els.listCount.textContent = "Could not load trophies.json. Serve the app over HTTP with app/ at the root.";
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
