// Replays a generated league file's scheduled events season by season and
// checks that every team is in a real division and each playoff bracket fits.
// Usage: node validate-league.js [leagues/nba-1947.json]

const league = require(`./${process.argv[2] ?? "leagues/nba-1947.json"}`);

const PRESEASON = 0;
const DRAFT_LOTTERY = 4;
const ga = league.gameAttributes;
const at = (history, season) =>
	history.filter((x) => x.start === null || x.start <= season).pop().value;

const teams = league.teams.map((t) => ({ ...t }));
const events = [...league.scheduledEvents].sort(
	(a, b) =>
		a.season - b.season ||
		a.phase - b.phase ||
		(a.type === "expansionDraft") - (b.type === "expansionDraft"),
);
const lastSeason = Math.max(...events.map((e) => e.season), league.startingSeason);

const errors = [];
for (let season = league.startingSeason; season <= lastSeason; season++) {
	for (const e of events.filter((e) => e.season === season && e.phase === PRESEASON)) {
		if (e.type === "teamInfo") Object.assign(teams[e.info.tid], e.info);
	}

	const active = teams.filter((t) => !t.disabled);
	const divs = at(ga.divs, season);
	const confs = at(ga.confs, season);
	const series = at(ga.numGamesPlayoffSeries, season);
	const numPlayoffTeams = 2 ** series.length - at(ga.numPlayoffByes, season);

	for (const t of active) {
		if (!divs.some((d) => d.did === t.did && d.cid === t.cid)) {
			errors.push(`${season}: ${t.abbrev} in missing division ${t.did}`);
		}
	}
	const abbrevs = active.map((t) => t.abbrev);
	if (new Set(abbrevs).size !== abbrevs.length) {
		errors.push(`${season}: duplicate abbrevs`);
	}
	const perDiv = divs.map((d) => active.filter((t) => t.did === d.did).length);
	const perConf = confs.map((c) => active.filter((t) => t.cid === c.cid).length);
	if (perDiv.includes(0)) {
		errors.push(`${season}: empty division (${perDiv.join("/")})`);
	}
	if (active.length < numPlayoffTeams) {
		errors.push(`${season}: ${numPlayoffTeams} playoff teams but ${active.length} teams`);
	}
	if (confs.length === 2 && perConf.some((n) => n < numPlayoffTeams / 2)) {
		errors.push(`${season}: conference too small for playoffs (${perConf.join("/")})`);
	}
	if (season % 10 === 0) {
		console.log(`${season}: ${active.length} teams, divisions ${perDiv.join("/")}, ${numPlayoffTeams} playoff teams`);
	}

	for (const e of events.filter((e) => e.season === season && e.phase === DRAFT_LOTTERY)) {
		if (e.type === "contraction") teams[e.info.tid].disabled = true;
		if (e.type === "expansionDraft") {
			for (const t of e.info.teams) {
				Object.assign(teams[t.tid], t);
				delete teams[t.tid].disabled;
			}
		}
	}
}

if (errors.length > 0) {
	console.error(errors.join("\n"));
	process.exit(1);
}
console.log("OK");
