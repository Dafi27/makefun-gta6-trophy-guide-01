/* store.js — saved progress for the Leonida Trophy Guide.
   One job: keep the earned set, the per-trophy counters and the
   settings in localStorage, and export / import them as JSON. */
(function () {
  "use strict";

  var STORAGE_KEY = "gta6-trophy-guide-v1";
  var VALID_KINDS = ["story", "missable", "collectibles", "activities", "online"];
  var VALID_GRADES = ["platinum", "gold", "silver", "bronze"];

  function blankState() {
    return { earned: {}, counts: {}, spoiler: false, earnedOnly: false, kind: "all", grade: "all", sort: "default", query: "" };
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function cleanState(raw) {
    var state = blankState();
    if (!isPlainObject(raw)) return state;
    if (isPlainObject(raw.earned)) {
      Object.keys(raw.earned).forEach(function (id) {
        if (/^\d+$/.test(id) && raw.earned[id] === true) state.earned[id] = true;
      });
    }
    if (isPlainObject(raw.counts)) {
      Object.keys(raw.counts).forEach(function (id) {
        var n = Number(raw.counts[id]);
        if (/^\d+$/.test(id) && Number.isFinite(n) && n >= 0) state.counts[id] = Math.floor(n);
      });
    }
    if (typeof raw.spoiler === "boolean") state.spoiler = raw.spoiler;
    if (typeof raw.earnedOnly === "boolean") state.earnedOnly = raw.earnedOnly;
    if (typeof raw.kind === "string" && (raw.kind === "all" || VALID_KINDS.indexOf(raw.kind) !== -1)) state.kind = raw.kind;
    if (typeof raw.grade === "string" && (raw.grade === "all" || VALID_GRADES.indexOf(raw.grade) !== -1)) state.grade = raw.grade;
    if (typeof raw.sort === "string" && ["default", "name", "grade", "kind"].indexOf(raw.sort) !== -1) state.sort = raw.sort;
    if (typeof raw.query === "string") state.query = raw.query.slice(0, 200);
    return state;
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return blankState();
      return cleanState(JSON.parse(raw));
    } catch (err) {
      return blankState();
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  function exportState(state) {
    var payload = { app: "gta6-trophy-guide", version: 1, exportedAt: new Date().toISOString(), state: state };
    return JSON.stringify(payload, null, 2);
  }

  function parseImport(text) {
    var parsed = JSON.parse(text);
    var inner = isPlainObject(parsed) && isPlainObject(parsed.state) ? parsed.state : parsed;
    return cleanState(inner);
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function clampCount(value, target) {
    var n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 0) n = 0;
    if (typeof target === "number" && n > target) n = target;
    return n;
  }

  window.TrophyStore = {
    STORAGE_KEY: STORAGE_KEY,
    blankState: blankState,
    loadState: loadState,
    saveState: saveState,
    exportState: exportState,
    parseImport: parseImport,
    download: download,
    clampCount: clampCount
  };
})();
