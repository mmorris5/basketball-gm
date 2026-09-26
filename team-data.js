// Helpers for team-data.json. Seasons use the BBGM convention: the year a
// season ends (1946-47 -> 1947).
const teamData = require("./team-data.json");

const isActive = (team, season) =>
	season >= team.firstSeason &&
	(team.lastSeason === undefined || season <= team.lastSeason) &&
	!(team.inactiveSeasons ?? []).some(([a, b]) => season >= a && season <= b);

// Branding for a team in a given season: top-level fields overlaid with every
// `seasons` entry at or before that season, oldest first, so a partial entry
// (e.g. only a new imgURLSmall) keeps the rest of the previous look.
const getTeamInfo = (abbrev, season) => {
	const team = teamData[abbrev];
	if (!team) {
		throw new Error(`Unknown abbrev ${abbrev}`);
	}
	const { seasons = {}, ...info } = team;
	return Object.keys(seasons)
		.map(Number)
		.filter(year => year <= season)
		.sort((a, b) => a - b)
		.reduce((acc, year) => ({ ...acc, ...seasons[year] }), info);
};

const teamsInSeason = season =>
	Object.values(teamData)
		.filter(team => isActive(team, season))
		.map(team => getTeamInfo(team.abbrev, season));

module.exports = { teamData, getTeamInfo, teamsInSeason, isActive };
