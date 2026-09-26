// Writes real-team-info.json: team-data.json trimmed to the fields BBGM's
// Global Settings > Real Data > Team Info accepts. abbrev is left out so BBGM
// keeps its own abbreviations.
const fs = require("fs");
const teamData = require("./team-data.json");

const FIELDS = ["region", "name", "pop", "colors", "imgURL", "imgURLSmall", "jersey"];
const pick = (obj) =>
	Object.fromEntries(FIELDS.filter((key) => obj[key] !== undefined).map((key) => [key, obj[key]]));

const out = {};
for (const [abbrev, team] of Object.entries(teamData)) {
	out[abbrev] = pick(team);
	if (team.seasons) {
		out[abbrev].seasons = Object.fromEntries(
			Object.entries(team.seasons).map(([season, info]) => [season, pick(info)]),
		);
	}
}
fs.writeFileSync("real-team-info.json", JSON.stringify(out));
console.log(`real-team-info.json: ${Object.keys(out).length} teams, ${fs.statSync("real-team-info.json").size} bytes`);
