const { teamData, teamsInSeason, isActive } = require("./team-data.js");

// Number of BAA/NBA teams per season (Basketball-Reference).
const EXPECTED = {
	1947: 11, 1948: 8, 1949: 12, 1950: 17, 1951: 11, 1952: 10, 1953: 10,
	1954: 9, 1955: 9, 1956: 8, 1957: 8, 1958: 8, 1959: 8, 1960: 8, 1961: 8,
	1962: 9, 1963: 9, 1964: 9, 1965: 9, 1966: 9, 1967: 10, 1968: 12,
	1969: 14, 1970: 14, 1971: 17, 1972: 17, 1973: 17, 1974: 17, 1975: 18,
	1976: 18, 1977: 22, 1978: 22, 1979: 22, 1980: 22, 1981: 23, 1988: 23,
	1989: 25, 1990: 27, 1995: 27, 1996: 29, 2004: 29, 2005: 30, 2026: 30,
};

const errors = [];
const lastYear = Math.max(...Object.keys(EXPECTED).map(Number));
for (let season = 1947; season <= lastYear; season++) {
	const count = teamsInSeason(season).length;
	const known = Object.keys(EXPECTED).map(Number).filter(y => y <= season).pop();
	if (EXPECTED[season] !== undefined && count !== EXPECTED[season]) {
		errors.push(`${season}: ${count} teams, expected ${EXPECTED[season]}`);
	} else if (EXPECTED[season] === undefined && count !== EXPECTED[known]) {
		errors.push(`${season}: ${count} teams, expected ${EXPECTED[known]}`);
	}
}

const hex = /^#[0-9a-f]{6}$/i;
for (const [abbrev, team] of Object.entries(teamData)) {
	if (team.abbrev !== abbrev) errors.push(`${abbrev}: abbrev mismatch`);
	const allColors = [team.colors, ...Object.values(team.seasons ?? {}).map(s => s.colors)];
	for (const colors of allColors.filter(Boolean)) {
		if (colors.length !== 3 || !colors.every(c => hex.test(c))) {
			errors.push(`${abbrev}: bad colors ${colors}`);
		}
	}
	for (const [field, other] of [["next", "prev"], ["prev", "next"]]) {
		const link = team[field];
		if (link && !teamData[link]) errors.push(`${abbrev}: ${field} ${link} missing`);
	}
	// A relocation/rename should hand off in consecutive seasons.
	if (team.next && team.lastSeason) {
		const next = teamData[team.next];
		if (!isActive(next, team.lastSeason + 1)) {
			errors.push(`${abbrev} -> ${team.next}: not active in ${team.lastSeason + 1}`);
		}
	}
	if (team.franchise && !teamData[team.franchise]) {
		errors.push(`${abbrev}: franchise ${team.franchise} missing`);
	}
}

if (errors.length > 0) {
	console.error(errors.join("\n"));
	process.exit(1);
}
console.log(`OK: ${Object.keys(teamData).length} teams, seasons 1947-${lastYear}`);
