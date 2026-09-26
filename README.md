# BBGM NBA Team Data

## Play it in BBGM

In BBGM, go to New League → Customize → **Enter league file URL** and use:

```
https://raw.githubusercontent.com/mmorris5/basketball-gm/main/leagues/nba-1947.json
```

The league starts in 1946-47 with the 11 BAA teams (players are randomly
generated). Every later expansion team joins through an expansion draft, and
relocations, renames, logo/color changes and folded teams happen in the season
they did in real life. Divisions, season length and playoff format also change
over time. To make a league that starts in a different season, run
`node build-league.js <season>` (e.g. `node build-league.js 1980` writes
`leagues/nba-1980.json`), then check it with `node validate-league.js leagues/nba-1980.json`.

`team-data.json` itself is a lookup table, not a league file, so BBGM can't load it directly.

## Team data

`team-data.json` has branding for every BAA/NBA team from 1946-47 to today, in the
format of [alexnoob's `team data.json`](https://github.com/alexnoob/BasketBall-GM-Rosters/blob/master/team%20data.json).
All of his logo links and colors are kept as they are.

Seasons use the BBGM convention: the year a season ends (1946-47 → `1947`).

### Fields

| Field | Meaning |
| --- | --- |
| `abbrev`, `region`, `name`, `colors`, `imgURL`, `imgURLSmall` | BBGM team fields (the team's most recent look) |
| `seasons` | Overrides keyed by the season a look started. Applied oldest first, so each entry only lists what changed |
| `firstSeason` / `lastSeason` | Seasons the team played under this abbrev (`lastSeason` is left out for active teams) |
| `inactiveSeasons` | Gaps inside that range, e.g. NOH in 2006-07 (played as `NOK`) |
| `prev` / `next` | The same physical team's previous/next identity (relocation or rename) |
| `franchise` | Current franchise abbrev per official NBA records (`null` for folded teams). For example, `CHH` belongs to `CHO` even though the team moved to New Orleans |

### Usage

```js
const { getTeamInfo, teamsInSeason } = require("./team-data.js");
getTeamInfo("ATL", 1999); // Hawks with their 1996-era logo and colors
teamsInSeason(1950);      // all 17 teams from 1949-50, with that season's branding
```

`node validate.js` checks the team count for every season against the real history,
along with the colors and the prev/next links.
