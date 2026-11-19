# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Dafi27/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Dafi27/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Build an offline web app that guides and tracks all 55 GTA 6 trophies: the official list with saved progress, filters and a spoiler setting, a roadmap to the platinum, and a guide to each that cites its sources.

The Leonida Trophy Guide is a static web app (no build step, no network at run time). It lists every one of the 55 PlayStation 5 trophies of Grand Theft Auto VI with its official name, description and grade, plus a guide in its own words that cites its sources; a checklist saved in the browser with export and import; filters by kind and grade; a spoiler setting that hides story trophies until they are earned; per-trophy progress counters for the counted trophies; and a six-stage roadmap to the platinum with the 10 missable trophies flagged.

## Run it

```sh
python3 -m http.server --directory app 8080
```

Then open http://localhost:8080 in a desktop browser. It works with the network off — every file it loads lives under `app/`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tm9bafze&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
