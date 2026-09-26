// Builds an uploadable BBGM league file from team-data.json. The league starts
// in the given season (default 1947) with the teams that existed then, and uses
// scheduled events for every later expansion, relocation/rename, logo/color
// change, and folded team. No players are included, so BBGM generates random
// ones.
//
// Usage: node build-league.js [startSeason] [endSeason]

const fs = require("fs");
const { teamData, getTeamInfo, isActive } = require("./team-data.js");

const START = Number(process.argv[2] ?? 1947);
const END = Number(process.argv[3] ?? 2026);

// BBGM phases
const PRESEASON = 0;
const DRAFT_LOTTERY = 4;

const CONFS_2 = [
	{ cid: 0, name: "Eastern Conference" },
	{ cid: 1, name: "Western Conference" },
];

// Division layouts over time. Teams are assigned by division name below.
const DIV_ERAS = [
	{
		start: 1947,
		confs: CONFS_2,
		divs: [
			{ did: 0, cid: 0, name: "Eastern Division" },
			{ did: 1, cid: 1, name: "Western Division" },
		],
	},
	{
		start: 1950,
		confs: [
			{ cid: 0, name: "Eastern Conference" },
			{ cid: 1, name: "Central Conference" },
			{ cid: 2, name: "Western Conference" },
		],
		divs: [
			{ did: 0, cid: 0, name: "Eastern Division" },
			{ did: 1, cid: 1, name: "Central Division" },
			{ did: 2, cid: 2, name: "Western Division" },
		],
	},
	{
		start: 1951,
		confs: CONFS_2,
		divs: [
			{ did: 0, cid: 0, name: "Eastern Division" },
			{ did: 1, cid: 1, name: "Western Division" },
		],
	},
	{
		start: 1971,
		confs: CONFS_2,
		divs: [
			{ did: 0, cid: 0, name: "Atlantic Division" },
			{ did: 1, cid: 0, name: "Central Division" },
			{ did: 2, cid: 1, name: "Midwest Division" },
			{ did: 3, cid: 1, name: "Pacific Division" },
		],
	},
	{
		start: 2005,
		confs: CONFS_2,
		divs: [
			{ did: 0, cid: 0, name: "Atlantic Division" },
			{ did: 1, cid: 0, name: "Central Division" },
			{ did: 2, cid: 0, name: "Southeast Division" },
			{ did: 3, cid: 1, name: "Southwest Division" },
			{ did: 4, cid: 1, name: "Northwest Division" },
			{ did: 5, cid: 1, name: "Pacific Division" },
		],
	},
];

// Division by abbrev, as [fromSeason, division name] steps. Follows the real
// alignment closely but not perfectly.
const E = "Eastern Division";
const W = "Western Division";
const C = "Central Division";
const ATL_ = "Atlantic Division";
const MW = "Midwest Division";
const PAC = "Pacific Division";
const SE = "Southeast Division";
const SW = "Southwest Division";
const NW = "Northwest Division";
const DIVISIONS = {
	AND: [[1950, W]],
	ATL: [[1969, W], [1971, C], [2005, SE]],
	BAL: [[1964, W], [1967, E], [1971, C]],
	BLB: [[1948, W], [1949, E]],
	BOS: [[1947, E], [1971, ATL_]],
	BRK: [[2013, ATL_]],
	BUF: [[1971, ATL_]],
	CAP: [[1974, C]],
	CHA: [[2005, SE]],
	CHH: [[1989, ATL_], [1990, MW], [1991, C]],
	CHI: [[1967, W], [1971, MW], [1981, C]],
	CHO: [[2015, SE]],
	CHP: [[1962, W]],
	CHS: [[1947, W], [1950, C]],
	CHZ: [[1963, W]],
	CIN: [[1958, W], [1963, E], [1971, C]],
	CLE: [[1971, C]],
	CLR: [[1947, W]],
	DAL: [[1981, MW], [2005, SW]],
	DEN: [[1977, MW], [2005, NW]],
	DET: [[1958, W], [1971, MW], [1979, C]],
	DNN: [[1950, W]],
	DTF: [[1947, W]],
	FTW: [[1949, W], [1950, C], [1951, W]],
	GSW: [[1972, PAC]],
	HOU: [[1972, PAC], [1973, C], [1981, MW], [2005, SW]],
	IND: [[1977, MW], [1980, C]],
	INJ: [[1949, W]],
	INO: [[1950, W]],
	KCK: [[1976, MW]],
	KCO: [[1973, MW]],
	LAC: [[1985, PAC]],
	LAL: [[1961, W], [1971, PAC]],
	MEM: [[2002, MW], [2005, SW]],
	MIA: [[1989, MW], [1990, ATL_], [2005, SE]],
	MIL: [[1969, E], [1971, MW], [1981, C]],
	MIN: [[1990, MW], [1991, MW], [2005, NW]],
	MLH: [[1952, W]],
	MNL: [[1949, W], [1950, C], [1951, W]],
	NJN: [[1978, ATL_]],
	NOH: [[2003, C], [2005, SW]],
	NOK: [[2006, SW]],
	NOJ: [[1975, C]],
	NOP: [[2014, SW]],
	NYK: [[1947, E], [1971, ATL_]],
	NYN: [[1977, ATL_]],
	OKC: [[2009, NW]],
	ORL: [[1990, C], [1991, MW], [1992, ATL_], [2005, SE]],
	PHI: [[1964, E], [1971, ATL_]],
	PHO: [[1969, W], [1971, MW], [1973, PAC]],
	PHW: [[1947, E]],
	PIT: [[1947, W]],
	POR: [[1971, PAC], [2005, NW]],
	PRO: [[1947, E]],
	ROC: [[1949, W], [1950, C], [1951, W]],
	SAC: [[1986, MW], [1989, PAC]],
	SAS: [[1977, C], [1981, MW], [2005, SW]],
	SDC: [[1979, PAC]],
	SDR: [[1968, W], [1971, PAC]],
	SEA: [[1968, W], [1971, PAC], [2005, NW]],
	SFW: [[1963, W], [1971, PAC]],
	SHE: [[1950, W]],
	STB: [[1947, W], [1950, C]],
	STL: [[1956, W]],
	SYR: [[1950, E]],
	TOR: [[1996, C], [2005, ATL_]],
	TRH: [[1947, E]],
	TRI: [[1950, W]],
	UTA: [[1980, MW], [2005, NW]],
	VAN: [[1996, MW]],
	WAS: [[1998, ATL_], [2005, SE]],
	WAT: [[1950, W]],
	WSB: [[1975, C], [1979, ATL_]],
	WSC: [[1947, E]],
};

// Rough metro population in millions, for BBGM revenue/hype.
const POP = {
	Anderson: 0.1, Atlanta: 6.3, Baltimore: 2.8, Boston: 4.9, Brooklyn: 20.1,
	Buffalo: 1.1, Capital: 6.4, Charlotte: 2.8, Chicago: 9.4, Cincinnati: 2.3,
	Cleveland: 2.1, Dallas: 8.1, Denver: 3.0, Detroit: 4.4, "Fort Wayne": 0.4,
	"Golden State": 4.7, Houston: 7.5, Indiana: 2.1, Indianapolis: 2.1,
	"Kansas City": 2.2, "Kansas City-Omaha": 3.2, "Los Angeles": 12.9,
	Memphis: 1.3, Miami: 6.2, Milwaukee: 1.6, Minnesota: 3.7, Minneapolis: 3.7,
	"New Jersey": 20.1, "New Orleans": 1.3, "New Orleans/Oklahoma City": 2.7,
	"New York": 20.1, "Oklahoma City": 1.4, Orlando: 2.8, Philadelphia: 6.2,
	Phoenix: 5.0, Pittsburgh: 2.4, Portland: 2.5, Providence: 1.7,
	Rochester: 1.1, Sacramento: 2.4, "San Antonio": 2.7, "San Diego": 3.3,
	Seattle: 4.0, "San Francisco": 4.7, Sheboygan: 0.1, "St. Louis": 2.8,
	Syracuse: 0.7, Toronto: 6.7, "Tri-Cities": 0.4, Utah: 1.3, Vancouver: 2.6,
	Washington: 6.4, Waterloo: 0.2,
};

// Games per season, by first season of each length.
const NUM_GAMES = [
	[1947, 60], [1948, 48], [1949, 60], [1950, 68], [1952, 66], [1953, 70],
	[1954, 72], [1960, 75], [1961, 79], [1962, 80], [1967, 81], [1968, 82],
];

// Playoff formats, sized so the bracket always fits the number of teams.
const PLAYOFFS = [
	[1947, [3, 5, 7], 2], // 6 teams
	[1967, [5, 7, 7], 0], // 8 teams
	[1976, [3, 7, 7, 7], 4], // 12 teams
	[1984, [5, 7, 7, 7], 0], // 16 teams
	[2003, [7, 7, 7, 7], 0],
];
const PLAY_IN_START = 2021;

const stepValue = (steps, season) =>
	steps.filter(([from]) => from <= season).pop()?.[1];
const divEra = (season) => DIV_ERAS.filter((era) => era.start <= season).pop();
const getDid = (abbrev, season) => {
	const name = stepValue(DIVISIONS[abbrev], season);
	const div = divEra(season).divs.find((d) => d.name === name);
	if (!div) {
		throw new Error(`${abbrev} ${season}: no division "${name}"`);
	}
	return div;
};

// Group abbrevs into physical teams by following prev/next links. Each group
// becomes one BBGM team (tid), so relocations keep their history.
const groupOf = {};
const find = (a) => (groupOf[a] === a ? a : (groupOf[a] = find(groupOf[a])));
for (const a of Object.keys(teamData)) groupOf[a] = a;
for (const t of Object.values(teamData)) {
	for (const link of [t.prev, t.next]) {
		if (link) groupOf[find(link)] = find(t.abbrev);
	}
}

// Which abbrev each group uses in each season.
const timeline = {};
for (let season = START; season <= END; season++) {
	for (const t of Object.values(teamData)) {
		if (isActive(t, season)) {
			const g = find(t.abbrev);
			timeline[g] ??= {};
			if (timeline[g][season]) {
				throw new Error(`${g} has two teams in ${season}`);
			}
			timeline[g][season] = t.abbrev;
		}
	}
}

const groups = Object.keys(timeline).sort((a, b) => {
	const firstA = Math.min(...Object.keys(timeline[a]));
	const firstB = Math.min(...Object.keys(timeline[b]));
	return firstA - firstB || a.localeCompare(b);
});

const BRANDING = ["abbrev", "region", "name", "colors", "imgURL", "imgURLSmall"];
const infoFor = (abbrev, season) => {
	const info = getTeamInfo(abbrev, season);
	const { did, cid } = getDid(abbrev, season);
	const out = { did, cid, pop: POP[info.region] };
	for (const key of BRANDING) {
		if (info[key] !== undefined) out[key] = info[key];
	}
	return out;
};

const teams = [];
const events = [];
const addEvent = (event) => events.push({ ...event, id: events.length + 1 });

groups.forEach((g, tid) => {
	const seasons = Object.keys(timeline[g]).map(Number);
	const first = Math.min(...seasons);
	const last = Math.max(...seasons);
	const firstInfo = infoFor(timeline[g][first], first);

	// Teams that join later start disabled, in a division that exists at the
	// start (BBGM tries to fix invalid ones before the league is loaded, and
	// crashes). The expansion draft/teamInfo events move them later.
	const startDiv = divEra(START).divs.find((d) => d.cid === firstInfo.cid) ?? divEra(START).divs[0];
	teams.push({
		tid,
		...firstInfo,
		...(first > START ? { did: startDiv.did, cid: startDiv.cid, disabled: true } : {}),
	});

	let prev = firstInfo;
	if (first > START) {
		// The expansion draft runs after the previous season's playoffs, when
		// that season's divisions are still in place.
		const prevEra = divEra(first - 1);
		const div =
			prevEra.divs.find((d) => d.name === stepValue(DIVISIONS[timeline[g][first]], first)) ??
			prevEra.divs.find((d) => d.cid === firstInfo.cid) ??
			prevEra.divs[0];
		addEvent({
			type: "expansionDraft",
			season: first - 1,
			phase: DRAFT_LOTTERY,
			info: { teams: [{ ...firstInfo, tid, did: div.did, cid: div.cid }] },
		});
		// Move to the right division once the new season's layout is in place.
		prev = { ...firstInfo, did: div.did, cid: div.cid };
	}

	for (let season = first; season <= last; season++) {
		const abbrev = timeline[g][season];
		if (!abbrev) {
			throw new Error(`${g} has a gap in ${season}`);
		}
		const info = infoFor(abbrev, season);
		const changed = {};
		for (const key of [...BRANDING, "pop"]) {
			if (JSON.stringify(info[key]) !== JSON.stringify(prev[key])) {
				changed[key] = info[key];
			}
		}
		const newDivs = divEra(season).start === season && season > START;
		if (Object.keys(changed).length > 0 || newDivs || info.did !== prev.did) {
			// BBGM drops the old imgURLSmall if imgURL changes without one.
			if (changed.imgURL && info.imgURLSmall && !changed.imgURLSmall) {
				changed.imgURLSmall = info.imgURLSmall;
			}
			addEvent({
				type: "teamInfo",
				season,
				phase: PRESEASON,
				info: { tid, did: info.did, cid: info.cid, ...changed },
			});
		}
		prev = info;
	}

	if (last < END) {
		addEvent({
			type: "contraction",
			season: last,
			phase: DRAFT_LOTTERY,
			info: { tid },
		});
	}
});

// Merge expansion drafts in the same season into one draft.
const drafts = {};
for (const e of events.filter((e) => e.type === "expansionDraft")) {
	if (drafts[e.season]) {
		drafts[e.season].info.teams.push(...e.info.teams);
		e.merged = true;
	} else {
		drafts[e.season] = e;
	}
}

// BBGM's default protects (minRosterSize - numExpansionTeams) players, which
// can leave fewer draftable players than the expansion teams need when many
// teams join a small league (7 teams joined a 10-team league in 1950). Protect
// only as many as still leaves enough.
const MIN_ROSTER_SIZE = 13;
for (const draft of Object.values(drafts)) {
	const season = draft.season;
	const numActive = Object.values(teamData).filter(
		(t) => isActive(t, season) && isActive(t, season + 1),
	).length;
	const numExpansion = draft.info.teams.length;
	const perTeam = Math.ceil((numExpansion * MIN_ROSTER_SIZE) / numActive);
	draft.info.numProtectedPlayers = Math.max(
		0,
		Math.min(MIN_ROSTER_SIZE - numExpansion, MIN_ROSTER_SIZE - perTeam),
	);
}

// League settings in effect for a season.
const settingsFor = (season) => {
	const [, series, byes] = PLAYOFFS.filter(([from]) => from <= season).pop();
	const era = divEra(season);
	return {
		numGames: stepValue(NUM_GAMES, season),
		numGamesPlayoffSeries: series,
		numPlayoffByes: byes,
		playIn: season >= PLAY_IN_START,
		confs: era.confs,
		divs: era.divs,
	};
};

// BBGM always reads the latest entry of a setting's history, even one dated in
// the future, so the file holds the starting settings and later changes are
// scheduled events. They go first so each season's new divisions exist before
// that season's teamInfo events move teams into them.
const settingsEvents = [];
for (let season = START + 1; season <= END; season++) {
	const before = settingsFor(season - 1);
	const after = settingsFor(season);
	const info = {};
	for (const key of Object.keys(after)) {
		if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
			info[key] = after[key];
		}
	}
	if (Object.keys(info).length > 0) {
		settingsEvents.push({ type: "gameAttributes", season, phase: PRESEASON, info });
	}
}

const league = {
	version: 67,
	startingSeason: START,
	gameAttributes: {
		phase: PRESEASON,
		startingSeason: START,
		hideDisabledTeams: true,
		...settingsFor(START),
	},
	teams,
	scheduledEvents: [...settingsEvents, ...events.filter((e) => !e.merged)].map(
		({ merged, id, ...e }, i) => ({ ...e, id: i + 1 }),
	),
};

const file = `leagues/nba-${START}.json`;
fs.mkdirSync("leagues", { recursive: true });
fs.writeFileSync(file, JSON.stringify(league, null, "\t"));
console.log(
	`${file}: ${teams.length} teams (${teams.filter((t) => !t.disabled).length} active at start), ${league.scheduledEvents.length} scheduled events`,
);
