/* TrophyStore: earned-trophy progress saved in localStorage, with export/import.
   No network use anywhere: progress lives only in this browser. */
(function (global) {
  "use strict";
  var KEY = "leonida-trophy-guide-v1";
  var PREFS_KEY = "leonida-trophy-guide-prefs-v1";

  function readJson(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  var store = {
    loadEarned: function () {
      var data = readJson(KEY, {});
      var earned = {};
      Object.keys(data).forEach(function (id) {
        if (data[id] === true) earned[id] = true;
      });
      return earned;
    },
    saveEarned: function (earned) {
      return writeJson(KEY, earned);
    },
    loadPrefs: function () {
      return readJson(PREFS_KEY, { spoilerSafe: false, showGuides: true });
    },
    savePrefs: function (prefs) {
      return writeJson(PREFS_KEY, prefs);
    },
    exportText: function (earned) {
      return JSON.stringify(
        { app: "leonida-trophy-guide", version: 1, exportedAt: new Date().toISOString(), earned: earned },
        null,
        2
      );
    },
    parseImport: function (text) {
      var data = JSON.parse(text);
      var earned = data && data.earned ? data.earned : data;
      if (!earned || typeof earned !== "object") throw new Error("No earned data found");
      var clean = {};
      Object.keys(earned).forEach(function (id) {
        if (earned[id] === true && /^[0-9]+$/.test(id)) clean[id] = true;
      });
      return clean;
    }
  };

  global.TrophyStore = store;
})(window);
