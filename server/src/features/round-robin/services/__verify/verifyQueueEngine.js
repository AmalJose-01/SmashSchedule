/**
 * Verification harness for queueRoundRobinEngine.js and
 * gradedRoundRobinEngine.js. Not a unit-test framework — a standalone
 * script that runs the engines across a spread of realistic and edge-case
 * scenarios and asserts the STRICT rules (2, 3, 5) always hold, reporting
 * pass/fail per rule and adherence rates for the PREFERRED rules (1, 4, 6, 8)
 * and the Rule 7 extra-game behavior.
 */

const { generateQueueSchedule, enrichPlayers } = require("../queueRoundRobinEngine");
const {
  generateGradedRoundRobin,
  resolveOddGrades,
  allocateCourtsToGroups,
} = require("../gradedRoundRobinEngine");

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  FAIL: ${msg}`);
};
const ok = (msg) => console.log(`  ok: ${msg}`);

const seededRng = (seed) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const GRADES = ["A", "B", "C", "D", "E", "F", "G"];
const makePlayers = (n, { gradeSpread = true } = {}) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    grade: gradeSpread ? GRADES[i % GRADES.length] : "C",
  }));

const sortedKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Runs every strict-rule + preferred-rule check against one schedule and prints a report. */
const auditSchedule = (label, schedule, { matchType }) => {
  console.log(`\n=== ${label} ===`);
  console.log(`  rounds: ${schedule.rounds.length}, warnings: ${schedule.warnings.length}`);

  // Rule 2: no repeated partnership, ever — unless the match is flagged as
  // a deliberate, reported last-resort (spec's "impossible to maintain all
  // constraints -> flag to admin" edge case).
  const partnerSeen = new Set();
  let rule2Violations = 0;
  let rule2FlaggedUnavoidable = 0;
  schedule.rounds.forEach((r) => {
    r.matches.forEach((m) => {
      const flagged = m.flags.includes("repeated-partner-unavoidable");
      [m.teamA, m.teamB].forEach((team) => {
        if (team.length < 2) return;
        const key = sortedKey(team[0], team[1]);
        if (partnerSeen.has(key)) {
          if (flagged) rule2FlaggedUnavoidable++;
          else rule2Violations++;
        }
        partnerSeen.add(key);
      });
    });
  });
  if (rule2Violations > 0) fail(`Rule 2 (no repeated partnerships): ${rule2Violations} UNFLAGGED repeats found`);
  else ok(`Rule 2 (no repeated partnerships): holds (${rule2FlaggedUnavoidable} deliberately flagged as unavoidable)`);

  // Rule 3: no immediate next-round opponent-as-partner/opponent repeat,
  // UNLESS the match is flagged as a deliberate relaxation.
  let rule3Violations = 0;
  let rule3Relaxations = 0;
  for (let i = 1; i < schedule.rounds.length; i++) {
    const prevOpponentPairs = new Set();
    schedule.rounds[i - 1].matches.forEach((m) => {
      m.teamA.forEach((a) => m.teamB.forEach((b) => prevOpponentPairs.add(sortedKey(a, b))));
    });
    schedule.rounds[i].matches.forEach((m) => {
      const flagged = m.flags.includes("relaxed-rule-3-immediate-rematch");
      const allPairs = [];
      [m.teamA, m.teamB].forEach((team) => {
        if (team.length === 2) allPairs.push([team[0], team[1]]);
      });
      m.teamA.forEach((a) => m.teamB.forEach((b) => allPairs.push([a, b])));
      const violated = allPairs.some(([a, b]) => prevOpponentPairs.has(sortedKey(a, b)));
      if (violated && !flagged) rule3Violations++;
      else if (violated && flagged) rule3Relaxations++;
    });
  }
  if (rule3Violations > 0) fail(`Rule 3 (no immediate rematch): ${rule3Violations} UNFLAGGED violations`);
  else ok(`Rule 3 (no immediate rematch): holds (${rule3Relaxations} deliberately flagged relaxations)`);

  // Rule 5: court point balance within +/-2, unless flagged.
  let rule5Violations = 0;
  schedule.rounds.forEach((r) => {
    r.matches.forEach((m) => {
      const flagged = m.flags.some((f) => f.startsWith("relaxed-rule-5") || f === "repeated-partner-unavoidable");
      if (m.pointDiff > 2 && !flagged) rule5Violations++;
    });
  });
  if (rule5Violations > 0) fail(`Rule 5 (point balance +/-2): ${rule5Violations} UNFLAGGED violations`);
  else ok("Rule 5 (point balance +/-2): holds");

  // Rule 1: sit-out fairness — max minus min sit-out count should be small.
  const sitCounts = Object.values(schedule.playerSummary).map((p) => p.sitOuts);
  const spread = sitCounts.length ? Math.max(...sitCounts) - Math.min(...sitCounts) : 0;
  if (spread > 2) fail(`Rule 1 (fair sit-out rotation): spread of ${spread} sit-outs across players is too wide`);
  else ok(`Rule 1 (fair sit-out rotation): spread is ${spread} sit-out(s) across all players`);

  // Rule 7: strongest players should be the ones who got the extra game.
  const bumped = Object.entries(schedule.playerSummary).filter(([, p]) => p.gotExtraGame);
  if (bumped.length) {
    const bumpedPointsMin = Math.min(...bumped.map(([, p]) => require("../queueRoundRobinEngine").DEFAULT_POINTS_BY_GRADE[p.grade]));
    const nonBumped = Object.values(schedule.playerSummary).filter((p) => !p.gotExtraGame);
    const nonBumpedPointsMax = nonBumped.length
      ? Math.max(...nonBumped.map((p) => require("../queueRoundRobinEngine").DEFAULT_POINTS_BY_GRADE[p.grade]))
      : -Infinity;
    ok(
      `Rule 7 (extra game to strongest): ${bumped.length} player(s) bumped, weakest-bumped points=${bumpedPointsMin}, strongest-non-bumped points=${nonBumpedPointsMax}`
    );
  } else {
    ok("Rule 7 (extra game to strongest): nobody needed a bonus game this run (capacity matched target exactly)");
  }

  // Rule 4 (preferred): tier-match adherence rate.
  let tierChecks = 0;
  let tierMatches = 0;
  const gamesSoFar = new Map();
  schedule.rounds.forEach((r) => {
    r.matches.forEach((m) => {
      [m.teamA, m.teamB].forEach((team) => {
        if (team.length < 2) return;
        const [a, b] = team;
        const tierA = schedule.playerSummary[a].tier;
        const tierB = schedule.playerSummary[b].tier;
        const nA = gamesSoFar.get(a) || 0;
        const nB = gamesSoFar.get(b) || 0;
        const desired = ["Strong", "Mid", "Weak"];
        tierChecks += 2;
        if (tierB === desired[nA % 3]) tierMatches++;
        if (tierA === desired[nB % 3]) tierMatches++;
      });
      [...m.teamA, ...m.teamB].forEach((id) => gamesSoFar.set(id, (gamesSoFar.get(id) || 0) + 1));
    });
  });
  if (tierChecks > 0) {
    ok(`Rule 4 (tier diversity, preferred): ${((tierMatches / tierChecks) * 100).toFixed(0)}% of partner-slots hit the desired tier`);
  }

  return { rule2Violations, rule3Violations, rule5Violations };
};

console.log("############ CORE QUEUE ENGINE ############");

// Scenario 1: 20 players, 4 courts, doubles — the spec's own headline example.
{
  const players = makePlayers(20);
  const schedule = generateQueueSchedule(players, {
    matchType: "Doubles",
    numberOfCourts: 4,
    baseGamesPerPlayer: 3,
    rng: seededRng(1),
  });
  auditSchedule("20 players / 4 courts / doubles / target 3", schedule, { matchType: "Doubles" });
}

// Scenario 2: 16 players, 4 courts, doubles — capacity divides evenly, should need no extra games.
{
  const players = makePlayers(16);
  const schedule = generateQueueSchedule(players, {
    matchType: "Doubles",
    numberOfCourts: 4,
    baseGamesPerPlayer: 3,
    rng: seededRng(2),
  });
  auditSchedule("16 players / 4 courts / doubles / target 3 (even capacity)", schedule, { matchType: "Doubles" });
}

// Scenario 3: small tournament (<8 players) — grouping rules should be ignored gracefully.
{
  const players = makePlayers(6);
  const schedule = generateQueueSchedule(players, {
    matchType: "Doubles",
    numberOfCourts: 1,
    baseGamesPerPlayer: 3,
    rng: seededRng(3),
  });
  auditSchedule("6 players / 1 court / doubles (small tournament, <8)", schedule, { matchType: "Doubles" });
}

// Scenario 4: odd leftover forcing the singles fallback (18 players, doubles).
{
  const players = makePlayers(18);
  const schedule = generateQueueSchedule(players, {
    matchType: "Doubles",
    numberOfCourts: 4,
    baseGamesPerPlayer: 3,
    rng: seededRng(4),
  });
  const singlesFallbackRounds = schedule.rounds.filter((r) => r.matches.some((m) => m.type === "singles"));
  console.log(`\n=== 18 players / 4 courts / doubles (odd leftover) ===`);
  console.log(`  singles-fallback rounds: ${singlesFallbackRounds.length}`);
  auditSchedule("18 players / 4 courts / doubles (odd leftover) [rules]", schedule, { matchType: "Doubles" });
}

// Scenario 5: singles tournament.
{
  const players = makePlayers(9);
  const schedule = generateQueueSchedule(players, {
    matchType: "Singles",
    numberOfCourts: 2,
    baseGamesPerPlayer: 4,
    rng: seededRng(5),
  });
  auditSchedule("9 players / 2 courts / singles / target 4", schedule, { matchType: "Singles" });
}

// Scenario 9: undersized pools that can never field a match at all. Doubles
// needs >=4 players per court, with one deliberate exception (exactly 2
// players falls back to singles) — anything else too small (0, 1, or 3 for
// Doubles; 0 or 1 for Singles) must come back with an explicit warning
// instead of a silently empty, unexplained schedule.
{
  console.log(`\n=== Undersized pools (can never field a match) ===`);
  const expectWarning = (matchType, n) => {
    const schedule = generateQueueSchedule(makePlayers(n), {
      matchType,
      numberOfCourts: 1,
      baseGamesPerPlayer: 3,
    });
    const hasWarning = schedule.warnings.some((w) => w.startsWith("Not enough players"));
    if (schedule.rounds.length !== 0 || !hasWarning) {
      fail(`${matchType} with ${n} player(s): expected 0 rounds + an explicit "not enough players" warning, got ${schedule.rounds.length} round(s) and warnings=${JSON.stringify(schedule.warnings)}`);
    } else {
      ok(`${matchType} with ${n} player(s): correctly refused with a clear warning (no silent empty schedule)`);
    }
  };
  expectWarning("Doubles", 1);
  expectWarning("Doubles", 3);
  expectWarning("Singles", 1);

  // The one deliberate exception: exactly 2 players in Doubles still plays,
  // via the singles fallback.
  const twoPlayerDoubles = generateQueueSchedule(makePlayers(2), {
    matchType: "Doubles",
    numberOfCourts: 1,
    baseGamesPerPlayer: 3,
  });
  if (twoPlayerDoubles.rounds.length === 0) {
    fail("Doubles with exactly 2 players should fall back to singles instead of refusing");
  } else {
    ok(`Doubles with exactly 2 players: falls back to singles (${twoPlayerDoubles.rounds.length} round(s))`);
  }
}

console.log("\n\n############ GRADED ROUND ROBIN ############");

// Scenario 6: cascading borrow — deliberately lopsided grade counts.
{
  const gradeCounts = { A: 3, B: 5, C: 1, D: 7, E: 2, F: 9, G: 1 };
  let idCounter = 1;
  const players = [];
  Object.entries(gradeCounts).forEach(([grade, count]) => {
    for (let i = 0; i < count; i++) {
      players.push({ id: `p${idCounter}`, name: `Player ${idCounter} (${grade})`, grade });
      idCounter++;
    }
  });
  console.log(`\n=== Cascading borrow: ${JSON.stringify(gradeCounts)} ===`);
  const { groups, moveLog } = resolveOddGrades(players);
  moveLog.forEach((m) => console.log(`  move: ${m}`));
  groups.forEach((g) => console.log(`  group ${g.label}: ${g.players.length} players (merged=${g.merged})`));

  let invariantOk = true;
  groups.forEach((g) => {
    if (g.players.length > 0 && g.players.length < 4) {
      invariantOk = false;
      fail(`Group ${g.label} ended up with ${g.players.length} players (< 4) after resolution`);
    }
  });
  const totalIn = players.length;
  const totalOut = groups.reduce((s, g) => s + g.players.length, 0);
  if (totalIn !== totalOut) fail(`Player count mismatch: went in with ${totalIn}, came out with ${totalOut}`);
  else ok(`All ${totalIn} players accounted for across ${groups.length} final group(s)`);
  if (invariantOk) ok("Every non-empty group has >= 4 players (min viable size)");
}

// Scenario 7: full graded round robin end-to-end, 4 courts across groups.
{
  const gradeCounts = { A: 4, B: 6, C: 5, D: 8, E: 3, F: 4 };
  let idCounter = 1;
  const players = [];
  Object.entries(gradeCounts).forEach(([grade, count]) => {
    for (let i = 0; i < count; i++) {
      players.push({ id: `p${idCounter}`, name: `Player ${idCounter} (${grade})`, grade });
      idCounter++;
    }
  });
  console.log(`\n=== Full graded round robin: ${JSON.stringify(gradeCounts)}, 4 courts ===`);
  const result = generateGradedRoundRobin(players, {
    numberOfCourts: 4,
    matchType: "Doubles",
    baseGamesPerPlayer: 3,
    rng: seededRng(7),
  });
  console.log(`  ${result.groups.length} group(s), ${result.waves.length} wave(s)`);
  result.moveLog.forEach((m) => console.log(`  move: ${m}`));
  let totalPlayersScheduled = 0;
  result.groups.forEach((g) => {
    console.log(`  group ${g.label}: ${g.players.length} players, ${g.courts} court(s)`);
    totalPlayersScheduled += g.players.length;
    if (g.players.length >= 2) {
      const r = auditSchedule(`  -> group ${g.label} schedule`, g.schedule, { matchType: "Doubles" });
    }
  });
  if (totalPlayersScheduled !== players.length) {
    fail(`Graded round robin lost players: started with ${players.length}, groups total ${totalPlayersScheduled}`);
  } else {
    ok(`Graded round robin accounted for all ${players.length} players`);
  }
  if (result.warnings.length) {
    console.log(`  warnings:`);
    result.warnings.forEach((w) => console.log(`    - ${w}`));
  }
}

// Scenario 8: manual per-night grade override.
{
  const players = makePlayers(12, { gradeSpread: false }).map((p, i) => ({ ...p, grade: i < 6 ? "C" : "D" }));
  console.log(`\n=== Manual nightly override: move p1 from C to D ===`);
  const result = generateGradedRoundRobin(players, {
    numberOfCourts: 2,
    matchType: "Doubles",
    baseGamesPerPlayer: 2,
    overridesByPlayerId: { p1: "D" },
    rng: seededRng(8),
  });
  const groupWithP1 = result.groups.find((g) => g.players.some((p) => p.id === "p1"));
  console.log(`  p1 ended up in group ${groupWithP1.label}, grades in that group: ${groupWithP1.grades.join(",")}`);
  if (!groupWithP1.grades.includes("D") || groupWithP1.players.find((p) => p.id === "p1").profileGrade !== "C") {
    fail("Manual override did not apply correctly, or profileGrade wasn't preserved");
  } else {
    ok("Manual per-night override applied; profile grade preserved for records");
  }
}

// Scenario 9 (graded): a single isolated grade with too few players to ever
// be merged (nothing above or below it on the ladder) AND too few to field
// a Doubles match on its own. Exercises the same undersized-pool warning
// from Scenario 9 above, but arriving through the full grading pipeline
// (resolveOddGrades -> generateQueueSchedule) rather than calling the queue
// engine directly — makes sure the warning actually surfaces all the way up
// to what the admin sees, instead of being swallowed at the group boundary.
{
  const players = [
    { id: "iso1", name: "Iso 1", grade: "A" },
    { id: "iso2", name: "Iso 2", grade: "A" },
    { id: "iso3", name: "Iso 3", grade: "A" },
  ];
  console.log(`\n=== Isolated 3-player grade group (no neighbor to merge into) ===`);
  const result = generateGradedRoundRobin(players, { numberOfCourts: 1, matchType: "Doubles", baseGamesPerPlayer: 3 });
  const group = result.groups[0];
  const surfaced = result.warnings.some((w) => w.includes("Not enough players"));
  if (!group || group.players.length !== 3 || group.schedule.rounds.length !== 0 || !surfaced) {
    fail(`Isolated 3-player group: expected the group kept intact (3 players, 0 rounds) with the shortfall warning surfaced; got ${JSON.stringify(result)}`);
  } else {
    ok("Isolated 3-player grade group: correctly left unscheduled with the shortfall warning surfaced to the admin");
  }
}

console.log(`\n\n${failures === 0 ? "ALL STRICT-RULE CHECKS PASSED" : `${failures} STRICT-RULE FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
