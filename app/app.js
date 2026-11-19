"use strict";

var STORAGE_KEY = "gta6-trophy-guide-v1";
var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
var GRADE_LABEL = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };
var KIND_LABEL = { story: "Story", collectible: "Collectible", activity: "Activity" };

var ROADMAP = [
  {
    title: "1 · Story first",
    text: "Play Chapters 1–4 and the final mission. Chapter trophies pop as each chapter closes, and the finale's gold is the payoff. Do the missable moments in this stretch before the story moves on.",
    ids: [2, 3, 4, 5, 6, 7]
  },
  {
    title: "2 · Named story missions",
    text: "The big set-piece missions — heists, takedowns and operations — each with its own trophy. They unlock in story order; none can be missed by playing through.",
    ids: [8, 9, 10, 11, 12, 13]
  },
  {
    title: "3 · Strangers & side stories",
    text: "The stranger strands: Andy, Kenton, Billy, Randy and Tyrone each have a final mission, and eight full stranger strands earn the silver. Missions open up between chapters, so check the map after each one.",
    ids: [22, 23, 24, 25, 26, 27]
  },
  {
    title: "4 · Collectibles & exploration",
    text: "Cards, WAiNK spots, meditation spots, vehicles, garages and the whole map of Leonida. Do these while travelling between missions instead of leaving them all for the end.",
    ids: [28, 30, 31, 35, 42, 54, 55]
  },
  {
    title: "5 · Activities & challenges",
    text: "The long grinds: 250 stunts, 20 race wins, gold at the shooting range, 50 challenges and the rest. Chip away at them between story beats — the counters in this guide track each one.",
    ids: [15, 16, 17, 18, 19, 20, 21, 29, 32, 36, 38, 40, 41, 43]
  },
  {
    title: "6 · Missable moments, money & the platinum",
    text: "The one-time moments (flagged Missable), the money trophies, and 100% completion. Finish these last and the platinum pops with the final tick.",
    ids: [33, 34, 37, 39, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 14, 1]
  }
];

var trophies = [];
var state = loadState();
var openCards = {};
var statusTimer = null;

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: {}, counts: {}, spoiler: false };
    var s = JSON.parse(raw);
    return {
      earned: s.earned || {},
      counts: s.counts || {},
      spoiler: !!s.spoiler
    };
  } catch (e) {
    return { earned: {}, counts: {}, spoiler: false };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* storage unavailable: progress lives only for this visit */ }
}

function $(id) { return document.getElementById(id); }

function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}

function setStatus(msg) {
  var s = $("statusLine");
  s.textContent = msg;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(function () { s.textContent = ""; }, 4000);
}

function isEarned(t) { return !!state.earned[t.id]; }

function countOf(t) {
  if (!t.count) return 0;
  return Math.max(0, Math.min(t.count, state.counts[t.id] || 0));
}

function trophyById(id) {
  for (var i = 0; i < trophies.length; i++) {
    if (trophies[i].id === id) return trophies[i];
  }
  return null;
}

/* ---------------- progress ---------------- */

function renderProgress() {
  var earned = trophies.filter(isEarned).length;
  var total = trophies.length;
  var pct = total ? Math.round((earned / total) * 100) : 0;
  $("progressText").textContent = earned + " / " + total + " earned";
  $("progressPct").textContent = pct + "%";
  $("progressFill").style.width = pct + "%";

  var chips = $("gradeChips");
  chips.innerHTML = "";
  ["platinum", "gold", "silver", "bronze"].forEach(function (g) {
    var all = trophies.filter(function (t) { return t.grade === g; });
    var got = all.filter(isEarned).length;
    var chip = el("span", "chip");
    chip.appendChild(el("span", "dot dot-" + g));
    chip.appendChild(el("b", null, GRADE_LABEL[g] + " " + got + "/" + all.length));
    chips.appendChild(chip);
  });
}

/* ---------------- trophy grid ---------------- */

function visibleTrophies() {
  var q = $("searchInput").value.trim().toLowerCase();
  var kind = $("kindFilter").value;
  var grade = $("gradeFilter").value;
  var show = $("showFilter").value;
  var sort = $("sortSelect").value;

  var list = trophies.filter(function (t) {
    if (kind === "missable") {
      if (!t.missable) return false;
    } else if (kind === "online") {
      return false;
    } else if (kind !== "all" && t.kind !== kind) {
      return false;
    }
    if (grade !== "all" && t.grade !== grade) return false;
    if (show === "earned" && !isEarned(t)) return false;
    if (show === "unearned" && isEarned(t)) return false;
    if (q) {
      var hay = (t.name + " " + t.description + " " + t.guide + " " + t.kind).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });

  if (sort === "grade") {
    list.sort(function (a, b) {
      return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id;
    });
  } else if (sort === "name") {
    list.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  } else {
    list.sort(function (a, b) { return a.id - b.id; });
  }
  return list;
}

function renderGrid() {
  var grid = $("trophyGrid");
  grid.innerHTML = "";
  var list = visibleTrophies();
  $("emptyNote").hidden = list.length !== 0;
  $("onlineNote").hidden = $("kindFilter").value !== "online";

  list.forEach(function (t) {
    var hiddenSpoiler = state.spoiler && t.kind === "story" && !isEarned(t);
    var card = el("article", "card" + (isEarned(t) ? " earned" : "") + (hiddenSpoiler ? " spoiler-hidden" : "") + (openCards[t.id] ? " open" : ""));
    card.setAttribute("data-id", String(t.id));
    card.tabIndex = 0;

    var top = el("div", "card-top");
    var badge = el("div", "grade-badge grade-" + t.grade, { platinum: "P", gold: "G", silver: "S", bronze: "B" }[t.grade]);
    badge.title = GRADE_LABEL[t.grade];
    top.appendChild(badge);

    var title = el("div", "card-title");
    title.appendChild(el("h3", null, hiddenSpoiler ? "Hidden Trophy" : t.name));
    title.appendChild(el("p", "official", t.description));
    top.appendChild(title);

    var check = document.createElement("input");
    check.type = "checkbox";
    check.className = "earned-check";
    check.checked = isEarned(t);
    check.setAttribute("aria-label", "Mark " + t.name + " as earned");
    check.addEventListener("click", function (ev) {
      ev.stopPropagation();
      setEarned(t, check.checked);
    });
    top.appendChild(check);
    card.appendChild(top);

    var badges = el("div", "badges");
    badges.appendChild(el("span", "badge", GRADE_LABEL[t.grade]));
    badges.appendChild(el("span", "badge badge-kind-" + t.kind, KIND_LABEL[t.kind] || t.kind));
    if (t.missable) badges.appendChild(el("span", "badge badge-missable", "Missable"));
    if (t.count) badges.appendChild(el("span", "badge", "Target: " + t.count));
    card.appendChild(badges);

    var guide = el("div", "guide");
    guide.appendChild(el("p", null, t.guide));
    if (t.count) {
      var counter = el("div", "counter");
      var minus = el("button", null, "−");
      minus.setAttribute("aria-label", "Decrease progress");
      minus.addEventListener("click", function (ev) {
        ev.stopPropagation();
        setCount(t, countOf(t) - 1);
      });
      var val = el("span", null, countOf(t) + " / " + t.count);
      var plus = el("button", null, "+");
      plus.setAttribute("aria-label", "Increase progress");
      plus.addEventListener("click", function (ev) {
        ev.stopPropagation();
        setCount(t, countOf(t) + 1);
      });
      counter.appendChild(minus);
      counter.appendChild(val);
      counter.appendChild(plus);
      guide.appendChild(counter);
    }
    var src = el("p", "source");
    src.innerHTML = "";
    var strong = el("strong", null, "Source: ");
    src.appendChild(strong);
    src.appendChild(document.createTextNode(t.source || ""));
    guide.appendChild(src);
    card.appendChild(guide);

    card.addEventListener("click", function () {
      card.classList.toggle("open");
      openCards[t.id] = card.classList.contains("open");
    });
    card.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        card.classList.toggle("open");
        openCards[t.id] = card.classList.contains("open");
      }
    });
    grid.appendChild(card);
  });
}

function setEarned(t, val) {
  state.earned[t.id] = val;
  if (!val) { /* keep counter, only the tick clears */ }
  saveState();
  renderAll();
}

function setCount(t, n) {
  n = Math.max(0, Math.min(t.count, n));
  state.counts[t.id] = n;
  if (n >= t.count) state.earned[t.id] = true;
  if (n < t.count && state.earned[t.id] && countOf(t) < t.count) {
    /* dropping below target un-ticks the trophy */
    state.earned[t.id] = false;
  }
  saveState();
  renderAll();
}

/* ---------------- roadmap ---------------- */

function renderRoadmap() {
  var list = $("roadmapList");
  list.innerHTML = "";
  ROADMAP.forEach(function (stage) {
    var li = el("li", "stage");
    var head = el("div", "stage-head");
    head.appendChild(el("h3", null, stage.title));
    var done = stage.ids.filter(function (id) {
      var t = trophyById(id);
      return t && isEarned(t);
    }).length;
    head.appendChild(el("span", "stage-count", done + " / " + stage.ids.length + " earned"));
    li.appendChild(head);
    li.appendChild(el("p", null, stage.text));
    var chips = el("div", "stage-trophies");
    stage.ids.forEach(function (id) {
      var t = trophyById(id);
      if (!t) return;
      var cls = "mini" + (isEarned(t) ? " done" : "") + (t.missable ? " miss" : "");
      chips.appendChild(el("span", cls, t.name + (t.missable ? " ⚠" : "")));
    });
    li.appendChild(chips);
    list.appendChild(li);
  });
}

/* ---------------- export / import / reset ---------------- */

function exportProgress() {
  var data = {
    app: "gta6-trophy-guide",
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: state.earned,
    counts: state.counts,
    spoiler: state.spoiler
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "gta6-trophy-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  setStatus("Progress exported to gta6-trophy-progress.json.");
}

function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(reader.result);
      if (!data || typeof data !== "object") throw new Error("bad file");
      var earned = {};
      var counts = {};
      Object.keys(data.earned || {}).forEach(function (k) {
        if (trophyById(Number(k))) earned[k] = !!data.earned[k];
      });
      Object.keys(data.counts || {}).forEach(function (k) {
        var t = trophyById(Number(k));
        if (t && t.count) counts[k] = Math.max(0, Math.min(t.count, Number(data.counts[k]) || 0));
      });
      state.earned = earned;
      state.counts = counts;
      if (typeof data.spoiler === "boolean") state.spoiler = data.spoiler;
      saveState();
      syncControls();
      renderAll();
      setStatus("Progress imported.");
    } catch (e) {
      setStatus("That file could not be imported — it is not a progress export from this guide.");
    }
  };
  reader.readAsText(file);
}

/* ---------------- controls / tabs ---------------- */

function syncControls() {
  $("spoilerToggle").checked = state.spoiler;
}

function bindControls() {
  ["searchInput", "kindFilter", "gradeFilter", "showFilter", "sortSelect"].forEach(function (id) {
    $(id).addEventListener("input", renderGrid);
    $(id).addEventListener("change", renderGrid);
  });
  $("spoilerToggle").addEventListener("change", function () {
    state.spoiler = $("spoilerToggle").checked;
    saveState();
    renderGrid();
  });
  $("exportBtn").addEventListener("click", exportProgress);
  $("importFile").addEventListener("change", function () {
    if ($("importFile").files.length) importProgress($("importFile").files[0]);
    $("importFile").value = "";
  });
  $("resetBtn").addEventListener("click", function () {
    if (window.confirm("Reset all earned ticks and counters? This cannot be undone.")) {
      state.earned = {};
      state.counts = {};
      saveState();
      renderAll();
      setStatus("Progress reset.");
    }
  });
  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.remove("active");
      });
      $("tab-" + btn.getAttribute("data-tab")).classList.add("active");
    });
  });
}

function renderAll() {
  renderProgress();
  renderGrid();
  renderRoadmap();
}

/* ---------------- boot ---------------- */

fetch("data/trophies.json")
  .then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then(function (data) {
    trophies = Array.isArray(data) ? data : data.trophies;
    if (!Array.isArray(trophies) || trophies.length === 0) throw new Error("no trophies");
    syncControls();
    bindControls();
    renderAll();
  })
  .catch(function (err) {
    $("trophyGrid").innerHTML = "";
    var note = el("p", "note", "The trophy list could not be loaded (" + err.message + "). Open this guide from a static server with app/ at its root.");
    $("trophyGrid").appendChild(note);
  });
