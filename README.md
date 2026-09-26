# BBGM NBA Team Data

`team-data.json` has branding for every BAA/NBA team from 1946-47 to today, in the
format of [alexnoob's `team data.json`](https://github.com/alexnoob/BasketBall-GM-Rosters/blob/master/team%20data.json).
All of his logo links and colors are kept as they are.

Seasons use the BBGM convention: the year a season ends (1946-47 → `1947`).

## Fields

| Field | Meaning |
| --- | --- |
| `abbrev`, `region`, `name`, `colors`, `imgURL`, `imgURLSmall` | BBGM team fields (the team's most recent look) |
| `seasons` | Overrides keyed by the season a look started. Applied oldest first, so each entry only lists what changed |
| `firstSeason` / `lastSeason` | Seasons the team played under this abbrev (`lastSeason` is left out for active teams) |
| `inactiveSeasons` | Gaps inside that range, e.g. NOH in 2006-07 (played as `NOK`) |
| `prev` / `next` | The same physical team's previous/next identity (relocation or rename) |
| `franchise` | Current franchise abbrev per official NBA records (`null` for folded teams). For example, `CHH` belongs to `CHO` even though the team moved to New Orleans |

## Usage

```js
const { getTeamInfo, teamsInSeason } = require("./team-data.js");
getTeamInfo("ATL", 1999); // Hawks with their 1996-era logo and colors
teamsInSeason(1950);      // all 17 teams from 1949-50, with that season's branding
```

`node validate.js` checks the team count for every season against the real history,
along with the colors and the prev/next links.
