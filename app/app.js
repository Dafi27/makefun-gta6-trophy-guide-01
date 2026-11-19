/* app.js — Leonida Trophy Guide: checklist, filters, roadmap, missables.
   Loads app/data/trophies.json, renders the tracker, and saves progress
   through TrophyStore (localStorage, plus export and import). */
(function () {
  "use strict";

  var DATA_URL = "data/trophies.json";
  var GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  var KIND_ORDER = ["story", "collectibles", "activities", "online"];
  var KIND_LABELS = { story: "Story", missable: "Missable", collectibles: "Collectibles", activities: "Activities", online: "Online" };

  /* Six stages, in play order. Every trophy sits in exactly one stage. */
  var STAGES = [
    { n: 1, title: "Story first", blurb: "Play Chapters 1 to 4 and the finale, and take every contact's missions as they appear. All 17 story trophies live here, including the 6 missable mission trophies — read the Missables page before you start." },
    { n: 2, title: "Strangers and side contacts", blurb: "With the story done, sweep Leonida for stranger strands and side content: 8 stranger strands, Bret's hunt, the arcade, bowling, and a taste of all 9 activity types." },
    { n: 3, title: "Activities and skill", blurb: "The skill grinds: 250 stunts, 42 gold Shooting Range medals, 14 drone races, 20 race wins, 50 challenges, and the odd ones — a melee drive-by, a second-try success, a fishing win over Cal." },
    { n: 4, title: "Collectibles sweep", blurb: "One careful pass over the map: 52 areas, 18 meditation spots, 100 WAiNK locations, 3 card sets, 100 vehicles, 8 garages and 10 Scooter Bros registrations. One sweep covers them all." },
    { n: 5, title: "Crime and chaos", blurb: "The loud half of Leonida: partner heists, vaults and armored trucks, gang operations, tanks, jewelry stores, and the strange encounter. Attempt the two partner trophies while the story keeps you paired." },
    { n: 6, title: "Money and the platinum", blurb: "Launder $250,000 in marked bills, spend $100,000 in the shops, and let 100% completion land. The platinum pops with the last of them." }
  ];

  var trophies = [];
  var state = window.TrophyStore.loadState();
  var selectedId = null;
  var saveNoteTimer = null;

  function $(id) { return document.getElementById(id); }
  var listEl = $("trophyList");
  var detailEl = $("detailPane");
  var listMetaEl = $("listMeta");
  var saveNoteEl = $("saveNote");

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function trophyById(id) {
    for (var i = 0; i < trophies.length; i++) {
      if (trophies[i].id === id) return trophies[i];
    }
    return null;
  }

  function isEarned(trophy) {
    return !!state.earned[trophy.id];
  }

  function isSpoilerHidden(trophy) {
    return state.spoiler && trophy.kind === "story" && !isEarned(trophy);
  }

  function earnedCount() {
    var n = 0;
    trophies.forEach(function (t) { if (isEarned(t)) n++; });
    return n;
  }

  function countOf(trophy) {
    var n = window.TrophyStore.clampCount(state.counts[trophy.id] || 0, trophy.target);
    return n;
  }

  function persist() {
    window.TrophyStore.saveState(state);
    if (saveNoteEl) {
      saveNoteEl.textContent = "Saved.";
      if (saveNoteTimer) clearTimeout(saveNoteTimer);
      saveNoteTimer = setTimeout(function () {
        saveNoteEl.textContent = "Progress saves automatically in this browser.";
      }, 1500);
    }
  }

  function sortTrophies(list) {
    var arr = list.slice();
    if (state.sort === "name") {
      arr.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else if (state.sort === "grade") {
      arr.sort(function (a, b) {
        return GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.name.localeCompare(b.name);
      });
    } else if (state.sort === "kind") {
      arr.sort(function (a, b) {
        return KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.id - b.id;
      });
    } else {
      arr.sort(function (a, b) { return a.stage - b.stage || a.id - b.id; });
    }
    return arr;
  }

  function visibleTrophies() {
    var q = state.query.trim().toLowerCase();
    var list = trophies.filter(function (t) {
      if (state.kind !== "all") {
        if (state.kind === "missable") {
          if (!t.missable) return false;
        } else if (t.kind !== state.kind) {
          return false;
        }
      }
      if (state.grade !== "all" && t.grade !== state.grade) return false;
      if (state.earnedOnly && !isEarned(t)) return false;
      if (q) {
        var hay = isSpoilerHidden(t) ? "" : (t.name + " " + t.description).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    return sortTrophies(list);
  }

  function renderProgress() {
    var earned = earnedCount();
    var total = trophies.length || 55;
    var pct = total ? Math.round((earned / total) * 100) : 0;
    $("earnedCount").textContent = String(earned);
    var fill = $("progressFill");
    fill.style.width = pct + "%";
    var bar = $("progressBar");
    bar.setAttribute("aria-valuenow", String(earned));
    bar.setAttribute("aria-valuemax", String(total));
    $("progressNote").textContent = pct + "% to the platinum";
    var grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    trophies.forEach(function (t) { if (isEarned(t)) grades[t.grade]++; });
    $("gradeLine").textContent =
      "Platinum " + grades.platinum + "/1 · Gold " + grades.gold + "/2 · Silver " + grades.silver + "/6 · Bronze " + grades.bronze + "/46";
    $("countAll").textContent = "(" + total + ")";
    $("countStory").textContent = "(" + trophies.filter(function (t) { return t.kind === "story"; }).length + ")";
    $("countMissable").textContent = "(" + trophies.filter(function (t) { return t.missable; }).length + ")";
    $("countCollectibles").textContent = "(" + trophies.filter(function (t) { return t.kind === "collectibles"; }).length + ")";
    $("countActivities").textContent = "(" + trophies.filter(function (t) { return t.kind === "activities"; }).length + ")";
    $("countOnline").textContent = "(" + trophies.filter(function (t) { return t.kind === "online"; }).length + ")";
  }

  function rowHtml(t) {
    var hidden = isSpoilerHidden(t);
    var earned = isEarned(t);
    var classes = ["trophy-row"];
    if (earned) classes.push("earned");
    if (selectedId === t.id) classes.push("selected");
    var name = hidden ? "Hidden story trophy" : t.name;
    var desc = hidden ? "Earn this trophy to reveal its name and description." : t.description;
    var tags = "";
    if (hidden) {
      tags = '<span class="tag">Hidden</span>';
    } else {
      tags = '<span class="tag grade-' + t.grade + '">' + gradeLabel(t.grade) + '</span>' +
        '<span class="tag">' + KIND_LABELS[t.kind] + '</span>' +
        (t.missable ? '<span class="tag missable">Missable</span>' : "");
    }
    var medal = hidden
      ? '<span class="medal" style="background:#c9c2b4" title="Hidden"></span>'
      : '<span class="medal ' + t.grade + '"></span>';
    var counter = "";
    if (!hidden && typeof t.target === "number") {
      counter = '<span class="row-counter"><b>' + countOf(t) + '</b> / ' + t.target + '</span>';
    } else if (!hidden && earned) {
      counter = '<span class="row-counter">Earned</span>';
    }
    return '<li><div class="' + classes.join(" ") + '" data-id="' + t.id + '" role="button" tabindex="0" aria-label="' + escapeHtml(name) + '">' +
      '<input type="checkbox" class="row-check" data-id="' + t.id + '"' + (earned ? " checked" : "") + ' aria-label="Mark ' + escapeHtml(name) + ' earned">' +
      '<span class="trophy-main"><span class="trophy-name">' + medal + " " + escapeHtml(name) + '</span>' +
      '<span class="trophy-desc">' + escapeHtml(desc) + '</span>' +
      '<span class="trophy-tags">' + tags + '</span></span>' +
      counter +
      '</div></li>';
  }

  function renderList() {
    var visible = visibleTrophies();
    if (visible.length === 0) {
      var note = "No trophies match these filters.";
      if (state.kind === "online") note = "No online trophies in the official list — every one of the 55 is earned in single-player.";
      listEl.innerHTML = '<li class="empty-state">' + note + '</li>';
    } else {
      listEl.innerHTML = visible.map(rowHtml).join("");
    }
    var earned = earnedCount();
    listMetaEl.textContent = "Showing " + visible.length + " of " + trophies.length + " trophies · " + earned + " earned" +
      (state.spoiler ? " · spoiler mode on: un-earned story trophies are hidden" : "");
  }

  function renderDetail() {
    var t = selectedId === null ? null : trophyById(selectedId);
    if (!t) {
      detailEl.innerHTML = '<p class="detail-empty">Select a trophy to read its guide, sources and progress counter.</p>';
      return;
    }
    if (isSpoilerHidden(t)) {
      detailEl.innerHTML =
        '<h2>Hidden story trophy</h2>' +
        '<p class="official">Spoiler mode is on. This story trophy stays hidden until you earn it.</p>' +
        '<p>Turn spoiler mode off, or mark it earned below, to reveal its name, description and guide.</p>' +
        '<div class="detail-actions"><button type="button" class="btn" data-action="toggle-earned" data-id="' + t.id + '">Mark earned</button></div>';
      return;
    }
    var earned = isEarned(t);
    var stage = STAGES[t.stage - 1];
    /* Next up: the next un-earned trophy in roadmap order after this one,
       wrapping to the first un-earned trophy when this is the last. */
    var ordered = trophies.slice().sort(function (a, b) { return a.stage - b.stage || a.id - b.id; });
    var at = ordered.findIndex(function (x) { return x.id === t.id; });
    var next = null;
    var k;
    for (k = at + 1; k < ordered.length; k++) {
      if (!isEarned(ordered[k])) { next = ordered[k]; break; }
    }
    if (!next) {
      for (k = 0; k < ordered.length; k++) {
        if (!isEarned(ordered[k]) && ordered[k].id !== t.id) { next = ordered[k]; break; }
      }
    }
    var nextHtml = next
      ? '<p class="next-up"><strong>Next up:</strong> ' + escapeHtml(isSpoilerHidden(next) ? "Hidden story trophy" : next.name) + " (Stage " + next.stage + ")</p>"
      : '<p class="next-up"><strong>Next up:</strong> that is all 55 — the platinum is yours.</p>';
    var html = '<h2><span class="medal ' + t.grade + '"></span> ' + escapeHtml(t.name) + '</h2>' +
      '<p class="official">“' + escapeHtml(t.description) + '” — the official description.</p>' +
      '<dl class="meta-grid">' +
      '<dt>Grade</dt><dd>' + gradeLabel(t.grade) + '</dd>' +
      '<dt>Kind</dt><dd>' + KIND_LABELS[t.kind] + (t.missable ? " · Missable" : "") + '</dd>' +
      '<dt>Roadmap</dt><dd>Stage ' + t.stage + " — " + escapeHtml(stage.title) + '</dd>' +
      '<dt>Progress</dt><dd>' + (earned ? "Earned" : "Not earned yet") + '</dd>' +
      '</dl>' + nextHtml +
      '<p class="guide-text">' + escapeHtml(t.guide) + '</p>';
    if (t.missable) {
      html += '<p class="missable-callout"><strong>Missable:</strong> ' + escapeHtml(t.missableReason) + '</p>';
    }
    if (typeof t.target === "number") {
      html += '<div class="counter-box"><span class="counter-label">Your progress toward ' + t.target + '</span>' +
        '<button type="button" data-action="count-down" data-id="' + t.id + '" aria-label="Decrease count">−</button>' +
        '<input type="number" min="0" max="' + t.target + '" value="' + countOf(t) + '" data-count-input="' + t.id + '" aria-label="Count toward ' + t.target + '">' +
        '<span class="counter-of">/ ' + t.target + '</span>' +
        '<button type="button" data-action="count-up" data-id="' + t.id + '" aria-label="Increase count">+</button>' +
        (countOf(t) >= t.target ? '<span class="counter-label">Target reached — mark it earned when it pops on PSN.</span>' : "") +
        '</div>';
    }
    html += '<p class="sources"><strong>Sources:</strong> ' + escapeHtml(t.sources) + '</p>' +
      '<div class="detail-actions"><button type="button" class="btn" data-action="toggle-earned" data-id="' + t.id + '">' +
      (earned ? "Mark not earned" : "Mark earned") + '</button></div>';
    detailEl.innerHTML = html;
  }

  function renderRoadmap() {
    var host = $("roadmapStages");
    host.innerHTML = STAGES.map(function (stage) {
      var members = trophies.filter(function (t) { return t.stage === stage.n; });
      var done = members.filter(function (t) { return isEarned(t); }).length;
      var chips = members.map(function (t) {
        var label = isSpoilerHidden(t) ? "Hidden story trophy" : t.name;
        return '<button type="button" data-stage-trophy="' + t.id + '" class="' + (isEarned(t) ? "earned" : "") + '">' + escapeHtml(label) + '</button>';
      }).join("");
      return '<article class="stage-card"><h3><span class="stage-num">' + stage.n + '</span>' + escapeHtml(stage.title) + '</h3>' +
        '<p>' + escapeHtml(stage.blurb) + '</p>' +
        '<p class="stage-meta">' + members.length + ' trophies in this stage</p>' +
        '<div class="stage-trophies">' + chips + '</div>' +
        '<p class="stage-progress">' + done + ' / ' + members.length + ' earned</p></article>';
    }).join("");
  }

  function renderMissables() {
    var host = $("missableList");
    var list = trophies.filter(function (t) { return t.missable; });
    host.innerHTML = list.map(function (t) {
      var hidden = isSpoilerHidden(t);
      var name = hidden ? "Hidden story trophy" : t.name;
      var why = hidden
        ? "A story-mission trophy — earn it to reveal the warning."
        : t.missableReason;
      var guide = hidden
        ? "Spoiler mode is hiding this one. Turn it off to read the full guide."
        : t.guide;
      return '<article class="missable-card"><h3>' + escapeHtml(name) + '</h3>' +
        '<p class="why">' + escapeHtml(why) + '</p>' +
        '<p>' + escapeHtml(guide) + '</p>' +
        '<p><button type="button" class="btn btn-quiet" data-stage-trophy="' + t.id + '">Open in checklist</button></p></article>';
    }).join("");
  }

  function renderAll() {
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
    renderMissables();
  }

  function setEarned(id, value) {
    if (value) state.earned[id] = true;
    else delete state.earned[id];
    persist();
    renderAll();
  }

  function setCount(id, value) {
    var t = trophyById(id);
    if (!t || typeof t.target !== "number") return;
    var n = window.TrophyStore.clampCount(value, t.target);
    if (n === 0) delete state.counts[id];
    else state.counts[id] = n;
    persist();
    renderAll();
  }

  function selectTrophy(id, focusRow) {
    selectedId = id;
    renderList();
    renderDetail();
    if (focusRow) {
      var row = listEl.querySelector('.trophy-row[data-id="' + id + '"]');
      if (row) row.scrollIntoView({ block: "nearest" });
    }
  }

  function switchView(name) {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-view") === name);
    });
    document.querySelectorAll(".view").forEach(function (view) {
      view.classList.toggle("active", view.id === "view-" + name);
    });
  }

  function bindEvents() {
    $("searchInput").addEventListener("input", function (e) {
      state.query = e.target.value;
      persist();
      renderList();
    });
    $("searchInput").value = state.query || "";

    document.querySelectorAll("#kindChips .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.kind = chip.getAttribute("data-kind");
        document.querySelectorAll("#kindChips .chip").forEach(function (c) {
          c.classList.toggle("active", c === chip);
        });
        persist();
        renderList();
      });
      chip.classList.toggle("active", chip.getAttribute("data-kind") === state.kind);
    });

    $("gradeFilter").value = state.grade;
    $("gradeFilter").addEventListener("change", function (e) {
      state.grade = e.target.value;
      persist();
      renderList();
    });

    $("sortSelect").value = state.sort;
    $("sortSelect").addEventListener("change", function (e) {
      state.sort = e.target.value;
      persist();
      renderList();
    });

    $("spoilerToggle").checked = state.spoiler;
    $("spoilerToggle").addEventListener("change", function (e) {
      state.spoiler = e.target.checked;
      persist();
      renderAll();
    });

    $("earnedOnlyToggle").checked = state.earnedOnly;
    $("earnedOnlyToggle").addEventListener("change", function (e) {
      state.earnedOnly = e.target.checked;
      persist();
      renderList();
    });

    listEl.addEventListener("click", function (e) {
      var row = e.target.closest(".trophy-row");
      if (!row) return;
      var id = Number(row.getAttribute("data-id"));
      if (e.target.classList.contains("row-check")) return;
      selectTrophy(id, false);
    });
    listEl.addEventListener("change", function (e) {
      if (!e.target.classList.contains("row-check")) return;
      var id = Number(e.target.getAttribute("data-id"));
      setEarned(id, e.target.checked);
    });
    listEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var row = e.target.closest(".trophy-row");
      if (!row) return;
      e.preventDefault();
      selectTrophy(Number(row.getAttribute("data-id")), false);
    });

    detailEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-id"));
      var action = btn.getAttribute("data-action");
      if (action === "toggle-earned") setEarned(id, !state.earned[id]);
      if (action === "count-up") setCount(id, countOf(trophyById(id)) + 1);
      if (action === "count-down") setCount(id, countOf(trophyById(id)) - 1);
    });
    detailEl.addEventListener("change", function (e) {
      var input = e.target.closest("[data-count-input]");
      if (!input) return;
      setCount(Number(input.getAttribute("data-count-input")), input.value);
    });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-stage-trophy]");
      if (!btn) return;
      var id = Number(btn.getAttribute("data-stage-trophy"));
      state.kind = "all";
      document.querySelectorAll("#kindChips .chip").forEach(function (c) {
        c.classList.toggle("active", c.getAttribute("data-kind") === "all");
      });
      switchView("checklist");
      selectTrophy(id, true);
    });

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchView(tab.getAttribute("data-view"));
      });
    });

    $("exportBtn").addEventListener("click", function () {
      window.TrophyStore.download("gta6-trophy-progress.json", window.TrophyStore.exportState(state));
    });
    $("importBtn").addEventListener("click", function () {
      $("importFile").click();
    });
    $("importFile").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var next = window.TrophyStore.parseImport(String(reader.result));
          state = next;
          persist();
          renderAll();
          saveNoteEl.textContent = "Progress imported.";
        } catch (err) {
          saveNoteEl.textContent = "That file could not be imported — it is not a progress export.";
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Reset all progress? Your earned trophies and counters will be cleared.")) return;
      state = window.TrophyStore.blankState();
      selectedId = null;
      persist();
      renderAll();
    });

    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "select" || tag === "textarea";
      if (e.key === "/" && !typing) {
        e.preventDefault();
        $("searchInput").focus();
        return;
      }
      if (typing) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        var visible = visibleTrophies();
        if (visible.length === 0) return;
        e.preventDefault();
        var idx = visible.findIndex(function (t) { return t.id === selectedId; });
        if (e.key === "ArrowDown") idx = idx < 0 ? 0 : Math.min(visible.length - 1, idx + 1);
        else idx = idx < 0 ? visible.length - 1 : Math.max(0, idx - 1);
        selectTrophy(visible[idx].id, true);
      } else if (e.key === " " && selectedId !== null) {
        e.preventDefault();
        setEarned(selectedId, !state.earned[selectedId]);
      }
    });
  }

  function boot() {
    bindEvents();
    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load " + DATA_URL + " (" + res.status + ")");
        return res.json();
      })
      .then(function (data) {
        var arr = Array.isArray(data) ? data : data.trophies;
        if (!Array.isArray(arr) || arr.length !== 55) throw new Error("Trophy list did not hold 55 trophies.");
        trophies = arr;
        renderAll();
      })
      .catch(function (err) {
        listEl.innerHTML = '<li class="empty-state">The trophy list could not be loaded: ' + escapeHtml(err.message) + '</li>';
        listMetaEl.textContent = "";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
