/**
 * Graded Round Robin orchestration layer.
 *
 * Sits on top of queueRoundRobinEngine.js and implements the parts of the
 * spec that are specific to grading a whole night's field into grade
 * groups before scheduling starts:
 *   - group players by grade (with a per-night manual override)
 *   - cascading odd-count borrow from an adjacent grade
 *   - full merge of a grade that's still under 4 players after borrowing
 *   - at-least-one-court-per-group allocation, multiple groups sharing the
 *     same time slots across different courts
 *   - one tournament-wide scoring config applied to every group
 *
 * Within-group scheduling (partners, opponents, point balance, tier
 * diversity, sit-out rotation, 4th game) is entirely delegated to
 * generateQueueSchedule from queueRoundRobinEngine.js — this file only
 * decides WHO is in which group and HOW MANY courts each group gets. A
 * "guest" player dropped into a merged group is not special-cased anywhere
 * here: generateQueueSchedule already balances teams/opponents by points
 * (Rule 5) and tier (Rule 4), so within a merged group it naturally seeks
 * out whoever is skill-closest — exactly what "guests preferentially
 * matched near their own skill level" asks for — without any extra code.
 */

const { generateQueueSchedule, DEFAULT_POINTS_BY_GRADE } = require("./queueRoundRobinEngine");
const { RANKED_GRADES } = require("../constants/grades");

/**
 * Best -> worst. Reuses the app's single source of truth for the ranked
 * ladder (server/.../constants/grades.js RANKED_GRADES) so this engine
 * never drifts from it if a grade is ever added/removed there. NOTE: this
 * is only the ORDER of grades — the scheduling POINTS used for court
 * balance (DEFAULT_POINTS_BY_GRADE, a tight 4-10 scale) are intentionally
 * a separate scale from that file's GRADE_DEFAULT_POINTS (0-80, used for
 * promotion/demotion): Rule 5's +/-2 cap only makes sense on a scale where
 * adjacent grades are a couple of points apart, not tens of points apart.
 */
const DEFAULT_GRADE_ORDER = RANKED_GRADES;

const MIN_VIABLE_GROUP_SIZE = 4;

/**
 * Applies the admin's per-night manual grade overrides ("Admin can manually
 * move any player to a different grade group for that night only") without
 * touching the player's stored profile grade.
 *
 * @param {Array} players - { id, name, grade, ... }
 * @param {Object} [overridesByPlayerId] - playerId -> grade, for tonight only
 * @returns {Array} new player objects; `.grade` reflects tonight's assignment, `.profileGrade` keeps the original
 */
const applyNightlyGradeOverrides = (players, overridesByPlayerId = {}) =>
  players.map((p) => {
    const tonightGrade = overridesByPlayerId[String(p.id)];
    return tonightGrade
      ? { ...p, grade: tonightGrade, profileGrade: p.grade }
      : { ...p, profileGrade: p.grade };
  });

/**
 * Grade-ladder odd-count resolution (spec section "3. Odd-Number
 * Resolution (cascading borrow)" and "4. Merged Grades").
 *
 * Algorithm, run to a fixed point:
 *   1. Walk the ladder (best -> worst) looking for a grade with an odd
 *      headcount that still has at least one un-locked neighbor.
 *   2. Prefer the neighbor that is ALSO odd — one player moving between two
 *      odd grades makes both even in a single move (the "fewest total
 *      moves" the spec asks for). If only one neighbor exists, use it. If
 *      both neighbors are even, borrowing from either just shifts the
 *      oddness sideways — pick the weaker-side neighbor by convention (the
 *      spec's own examples cascade downward through the ladder) and let the
 *      next pass resolve the neighbor it just made odd.
 *   3. The player who moves is whoever sits closest to the border between
 *      the two grades: the weakest player of the stronger grade, or the
 *      strongest player of the weaker grade — whichever of those two
 *      candidates is being pulled OUT of the odd grade (i.e. always a
 *      border player leaving the odd grade, never a random one).
 *   4. A player can be moved at most once per night; once moved they're
 *      locked and can't be re-borrowed by a later pass.
 *   5. Once no further single-move fixes are possible, any grade still
 *      under MIN_VIABLE_GROUP_SIZE (4) is fully merged into the neighbor it
 *      most recently traded with (or its nearest existing neighbor).
 *
 * @param {Array} players - post-nightly-override players: { id, name, grade, points? }
 * @param {Array<String>} [gradeOrder] - best -> worst ladder
 * @param {Object} [pointsByGrade] - used to rank "closest to the border" candidates when a player has no explicit `.points`
 * @returns {{ groups: Array<{label:String, grades:Array<String>, players:Array, merged:Boolean}>, moveLog: Array<String> }}
 */
const resolveOddGrades = (players, gradeOrder = DEFAULT_GRADE_ORDER, pointsByGrade = DEFAULT_POINTS_BY_GRADE) => {
  // Extend the ladder with any grades present in the data but not in
  // gradeOrder (e.g. "H"/"Unrated") by appending them, in first-seen order,
  // after the known ladder — they still get adjacency-based borrowing
  // against the weakest known grade instead of being stranded.
  const seenExtra = [];
  players.forEach((p) => {
    if (!gradeOrder.includes(p.grade) && !seenExtra.includes(p.grade)) seenExtra.push(p.grade);
  });
  const ladder = [...gradeOrder, ...seenExtra];

  const byGrade = new Map(ladder.map((g) => [g, []]));
  players.forEach((p) => {
    byGrade.get(p.grade).push(p);
  });

  // Working buckets keyed by ladder index, only for grades that have anyone.
  const activeIndexes = ladder.map((_, i) => i).filter((i) => byGrade.get(ladder[i]).length > 0);
  const bucketOf = (i) => byGrade.get(ladder[i]);
  const pointsOf = (p) => (typeof p.points === "number" ? p.points : pointsByGrade[p.grade] ?? 0);

  const locked = new Set(); // player ids that have already moved tonight
  const moveLog = [];
  const lastTradedWith = new Map(); // ladder index -> ladder index, for the merge step

  const neighborsOf = (i) => {
    const pos = activeIndexes.indexOf(i);
    const prev = pos > 0 ? activeIndexes[pos - 1] : null; // stronger side
    const next = pos < activeIndexes.length - 1 ? activeIndexes[pos + 1] : null; // weaker side
    return { prev, next };
  };

  const moveOnePlayer = (fromIdx, toIdx) => {
    const fromBucket = bucketOf(fromIdx);
    const movingToWeaker = toIdx > fromIdx;
    // Border player: weakest-of-the-stronger-grade moves down, or
    // strongest-of-the-weaker-grade moves up — either way, the player in
    // `fromBucket` closest to the border with `toIdx`.
    const candidates = fromBucket.filter((p) => !locked.has(String(p.id)));
    if (!candidates.length) return false;
    candidates.sort((a, b) => (movingToWeaker ? pointsOf(a) - pointsOf(b) : pointsOf(b) - pointsOf(a)));
    const mover = candidates[0];

    fromBucket.splice(fromBucket.indexOf(mover), 1);
    bucketOf(toIdx).push(mover);
    locked.add(String(mover.id));
    lastTradedWith.set(fromIdx, toIdx);
    lastTradedWith.set(toIdx, fromIdx);
    moveLog.push(
      `${mover.name} (${ladder[fromIdx]}) moved to ${ladder[toIdx]} for tonight to even out the groups.`
    );
    return true;
  };

  // Fixed-point loop: keep scanning for an odd, fixable grade until a full
  // pass makes no change (handles cascades of more than one hop).
  let changed = true;
  let safety = 0;
  while (changed && safety < ladder.length * 4) {
    changed = false;
    safety++;
    for (const i of activeIndexes) {
      if (bucketOf(i).length % 2 === 0) continue;
      const { prev, next } = neighborsOf(i);
      if (prev === null && next === null) continue; // isolated odd grade: nothing to borrow from

      const prevOdd = prev !== null && bucketOf(prev).length % 2 === 1;
      const nextOdd = next !== null && bucketOf(next).length % 2 === 1;

      let target = null;
      if (prevOdd) target = prev;
      else if (nextOdd) target = next;
      else target = next !== null ? next : prev; // both even (or only one side exists): cascade toward the weaker side by default

      if (target !== null && moveOnePlayer(i, target)) changed = true;
    }
  }

  // Merge pass: anything still under MIN_VIABLE_GROUP_SIZE gets folded into
  // an adjacent grade for the night. Re-run after each merge since folding
  // two buckets together changes the active-index list.
  let mergedSomething = true;
  const mergedInto = new Map(); // ladder index -> ladder index it was folded into (chases through chains)
  while (mergedSomething) {
    mergedSomething = false;
    const currentActive = ladder.map((_, i) => i).filter((i) => !mergedInto.has(i) && bucketOf(i).length > 0);
    for (const i of currentActive) {
      if (bucketOf(i).length >= MIN_VIABLE_GROUP_SIZE) continue;
      const pos = currentActive.indexOf(i);
      const prev = pos > 0 ? currentActive[pos - 1] : null;
      const next = pos < currentActive.length - 1 ? currentActive[pos + 1] : null;
      const preferred = lastTradedWith.has(i) && currentActive.includes(lastTradedWith.get(i))
        ? lastTradedWith.get(i)
        : next !== null
        ? next
        : prev;
      if (preferred === null) continue; // the only grade with anyone in it — nothing to merge into

      bucketOf(preferred).push(...bucketOf(i));
      bucketOf(i).length = 0;
      mergedInto.set(i, preferred);
      moveLog.push(`${ladder[i]} had fewer than ${MIN_VIABLE_GROUP_SIZE} players after borrowing — merged into ${ladder[preferred]} for tonight.`);
      mergedSomething = true;
      break; // recompute currentActive from scratch after a structural change
    }
  }

  // Build final groups: one per surviving ladder index that still has
  // players, labelled with every grade that ended up folded into it.
  const gradesFoldedInto = new Map(); // ladder index -> [grade labels merged in, including itself]
  ladder.forEach((g, i) => {
    let target = i;
    const chain = [i];
    while (mergedInto.has(target)) {
      target = mergedInto.get(target);
      chain.push(target);
    }
    const finalIdx = target;
    if (!gradesFoldedInto.has(finalIdx)) gradesFoldedInto.set(finalIdx, []);
    if (byGrade.get(ladder[i])) gradesFoldedInto.get(finalIdx).push(ladder[i]);
  });

  const groups = [];
  ladder.forEach((_, i) => {
    if (mergedInto.has(i)) return; // folded away, not a group of its own
    const finalPlayers = bucketOf(i);
    if (!finalPlayers.length) return;
    const grades = (gradesFoldedInto.get(i) || [ladder[i]]).filter((g) => g !== undefined);
    groups.push({
      label: grades.length > 1 ? grades.join("+") : grades[0],
      grades,
      players: finalPlayers,
      merged: grades.length > 1,
    });
  });

  return { groups, moveLog };
};

/**
 * Rule: "At least one court per grade group where possible. Multiple grade
 * groups can share the same time slot across different courts."
 *
 * If there are at least as many courts as groups, every group gets 1 court
 * guaranteed, and any remaining courts are handed out largest-remainder
 * style, proportional to group size (bigger groups get through their
 * rounds faster with more courts). If there are FEWER courts than groups,
 * as many groups as fit get 1 court each in "wave 1"; the rest are queued
 * into later waves, reusing courts as earlier waves finish — the app layer
 * decides in what real-world order the waves run.
 *
 * @param {Array<{label:String, players:Array}>} groups
 * @param {Number} totalCourts
 * @returns {{ courtsByGroupLabel: Object<String,Number>, waves: Array<Array<String>> }}
 */
const allocateCourtsToGroups = (groups, totalCourts) => {
  if (!groups.length) return { courtsByGroupLabel: {}, waves: [] };

  if (totalCourts >= groups.length) {
    const courtsByGroupLabel = {};
    groups.forEach((g) => {
      courtsByGroupLabel[g.label] = 1;
    });
    let remaining = totalCourts - groups.length;

    if (remaining > 0) {
      const totalPlayers = groups.reduce((sum, g) => sum + g.players.length, 0) || 1;
      const shares = groups.map((g) => ({
        label: g.label,
        exact: (g.players.length / totalPlayers) * remaining,
      }));
      shares.forEach((s) => {
        const whole = Math.floor(s.exact);
        courtsByGroupLabel[s.label] += whole;
        remaining -= whole;
      });
      // Largest-remainder leftovers go to the groups closest to rounding up.
      shares
        .sort((a, b) => b.exact % 1 - (a.exact % 1))
        .slice(0, remaining)
        .forEach((s) => {
          courtsByGroupLabel[s.label] += 1;
        });
    }

    return { courtsByGroupLabel, waves: [groups.map((g) => g.label)] };
  }

  // Fewer courts than groups: wave the groups, biggest groups first so the
  // group that will take the most rounds gets going immediately.
  const ordered = [...groups].sort((a, b) => b.players.length - a.players.length);
  const waves = [];
  const courtsByGroupLabel = {};
  for (let i = 0; i < ordered.length; i += totalCourts) {
    const wave = ordered.slice(i, i + totalCourts);
    waves.push(wave.map((g) => g.label));
    wave.forEach((g) => {
      courtsByGroupLabel[g.label] = 1;
    });
  }
  return { courtsByGroupLabel, waves };
};

/**
 * Full Graded Round Robin schedule generator: grade grouping -> odd-count
 * resolution/merge -> court allocation -> per-group queue scheduling, all
 * under one tournament-wide scoring config.
 *
 * @param {Array} players - { id, name, grade, points? }
 * @param {Object} config
 * @param {Array<String>} [config.gradeOrder]
 * @param {Object} [config.overridesByPlayerId] - per-night manual grade moves
 * @param {Number} config.numberOfCourts
 * @param {"Singles"|"Doubles"} [config.matchType="Doubles"]
 * @param {Number} [config.baseGamesPerPlayer=3]
 * @param {Number} [config.maxPointDiff=2]
 * @param {Object} [config.pointsByGrade]
 * @param {Function} [config.rng]
 * @returns {{ groups: Array, moveLog: Array<String>, warnings: Array<String> }}
 */
const generateGradedRoundRobin = (players, config) => {
  const {
    gradeOrder = DEFAULT_GRADE_ORDER,
    overridesByPlayerId = {},
    numberOfCourts,
    matchType = "Doubles",
    baseGamesPerPlayer = 3,
    maxPointDiff = 2,
    pointsByGrade,
    rng,
  } = config;

  const nightly = applyNightlyGradeOverrides(players, overridesByPlayerId);
  const { groups: rawGroups, moveLog } = resolveOddGrades(
    nightly,
    gradeOrder,
    pointsByGrade || DEFAULT_POINTS_BY_GRADE
  );
  const { courtsByGroupLabel, waves } = allocateCourtsToGroups(rawGroups, numberOfCourts);

  // Real court numbers: each group's own schedule numbers its courts
  // locally (1..however many it was given). Groups in the SAME wave run at
  // the same time, so they must get non-overlapping real court numbers;
  // groups in a LATER wave physically reuse the courts freed up by the
  // wave before them, so real court numbers restart at 1 within each wave.
  const courtOffsetByGroupLabel = {};
  const waveByGroupLabel = {};
  waves.forEach((waveLabels, waveIndex) => {
    let nextCourt = 1;
    waveLabels.forEach((label) => {
      courtOffsetByGroupLabel[label] = nextCourt;
      waveByGroupLabel[label] = waveIndex;
      nextCourt += courtsByGroupLabel[label] || 1;
    });
  });

  const warnings = [];
  const groups = rawGroups.map((g) => {
    const courts = courtsByGroupLabel[g.label] || 1;
    const courtOffset = courtOffsetByGroupLabel[g.label] || 1;
    const wave = waveByGroupLabel[g.label] || 0;

    if (g.players.length < 2) {
      warnings.push(`Group ${g.label}: fewer than 2 players — no matches generated.`);
      return { ...g, courts, courtOffset, wave, schedule: { rounds: [], playerSummary: {}, warnings: [], meta: {} } };
    }
    const schedule = generateQueueSchedule(g.players, {
      matchType,
      numberOfCourts: courts,
      baseGamesPerPlayer,
      maxPointDiff,
      pointsByGrade,
      rng,
    });
    // Remap each match's group-local court number (1..courts) to a real,
    // tournament-wide court number so two groups sharing a wave never both
    // claim "Court 1".
    schedule.rounds.forEach((round) => {
      round.matches.forEach((m) => {
        m.realCourt = courtOffset - 1 + m.court;
      });
    });
    warnings.push(...schedule.warnings.map((w) => `Group ${g.label}: ${w}`));
    return { ...g, courts, courtOffset, wave, schedule };
  });

  return { groups, moveLog, waves, warnings };
};

/**
 * Flattens a generateGradedRoundRobin() result into a list shaped like
 * RoundRobinMatch documents — the Graded-format counterpart of
 * queueRoundRobinEngine's toFlatMatchList, using each match's real
 * (tournament-wide) court number and tagging every match with which grade
 * group and wave it belongs to.
 *
 * @param {ReturnType<typeof generateGradedRoundRobin>} result
 * @param {Object} options
 * @param {import("mongoose").Types.ObjectId|String} options.tournamentId
 * @returns {Array} plain objects ready for RoundRobinMatch.insertMany
 */
const toFlatGradedMatchList = (result, { tournamentId }) => {
  const list = [];
  result.groups.forEach((g) => {
    g.schedule.rounds.forEach((round) => {
      round.matches.forEach((m) => {
        list.push({
          tournamentId,
          groupId: null, // Graded format has no RoundRobinGroup docs — gradeGroupLabel carries the grouping instead
          gradeGroupLabel: g.label,
          wave: g.wave,
          slot: round.roundNumber,
          matchName: `Group ${g.label} - Round ${round.roundNumber} - Court ${m.realCourt}`,
          court: `Court ${m.realCourt}`,
          player1Id: m.teamA[0],
          player1PartnerId: m.teamA[1] || null,
          player2Id: m.teamB[0],
          player2PartnerId: m.teamB[1] || null,
          status: "scheduled",
          sets: [],
          winner: null,
          loser: null,
          _pointDiff: m.pointDiff,
          _flags: m.flags,
        });
      });
    });
  });
  return list;
};

module.exports = {
  DEFAULT_GRADE_ORDER,
  MIN_VIABLE_GROUP_SIZE,
  applyNightlyGradeOverrides,
  resolveOddGrades,
  allocateCourtsToGroups,
  generateGradedRoundRobin,
  toFlatGradedMatchList,
};
