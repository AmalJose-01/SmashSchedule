/**
 * Queue-based round robin scheduling engine.
 *
 * Implements, for ONE pool of players sharing courts at the same time slots:
 *   Rule 1 — fair, rotating sit-out
 *   Rule 2 — no repeated partnerships                          (STRICT)
 *   Rule 3 — no immediate next-slot opponent-as-partner/opponent (STRICT, with fallback)
 *   Rule 4 — tier diversity for partners                        (PREFERRED)
 *   Rule 5 — court point balance within +/-2                    (STRICT)
 *   Rule 6 — balanced group split (>=8 players)                 (PREFERRED)
 *   Rule 7 — strongest players get the extra ("4th") game
 *   Rule 8 — global opponent variety                            (PREFERRED)
 *
 * The pool handed to this engine is already "one scheduling unit" — the
 * whole tournament for a normal Balanced Round Robin, or a single grade
 * group (after odd-count borrowing/merging) for a Graded Round Robin. See
 * gradedRoundRobinEngine.js for the grade-group orchestration layer that
 * sits on top of this file.
 *
 * Everything here is a pure function of its inputs (an injectable `rng` is
 * accepted for deterministic tests) — no DB access, no Mongoose. A thin
 * controller/service layer is expected to translate the `rounds` output
 * into whatever persistence shape the app's RoundRobinMatch schema needs
 * (see the bottom of this file for a `toFlatMatchList` helper that does a
 * reasonable version of that translation).
 */

// Default scheduling-weight scale from the spec (Rule 5). Deliberately kept
// separate from server/src/features/round-robin/constants/grades.js, whose
// GRADE_DEFAULT_POINTS values drive promotion/demotion — a different concern
// with a different numeric scale. Callers can override via
// options.pointsByGrade if they want to feed in real per-player ranking
// points instead of a flat per-grade value.
const DEFAULT_POINTS_BY_GRADE = {
  A: 10,
  B: 9,
  C: 8,
  D: 7,
  E: 6,
  F: 5,
  G: 4,
};

const sortedPairKey = (a, b) => (String(a) < String(b) ? `${a}|${b}` : `${b}|${a}`);

const defaultRng = Math.random;

const shuffle = (arr, rng = defaultRng) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Normalizes raw player input and attaches the scheduling data every other
 * function in this module needs: numeric `points`, a 3-way `tier`
 * (Strong/Mid/Weak, Rule 4) and a 2-way `splitGroup` (0/1, Rule 6).
 *
 * @param {Array<{id:String,name:String,grade:String}>} players
 * @param {Object} [pointsByGrade]
 * @returns {Array<Object>} enriched player objects, new array (input untouched)
 */
const enrichPlayers = (players, pointsByGrade = DEFAULT_POINTS_BY_GRADE) => {
  const enriched = players.map((p) => ({
    ...p,
    id: String(p.id),
    points: typeof p.points === "number" ? p.points : pointsByGrade[p.grade] ?? 6,
  }));

  // Rule 4: split the pool into thirds by points (ties broken by original
  // order) to get each player's own tier, and the tier they should be
  // seeking in a partner on their Nth game (cycles Strong -> Mid -> Weak).
  const byPointsDesc = [...enriched].sort((a, b) => b.points - a.points);
  const third = Math.ceil(byPointsDesc.length / 3) || 1;
  byPointsDesc.forEach((p, idx) => {
    p.tier = idx < third ? "Strong" : idx < third * 2 ? "Mid" : "Weak";
  });

  // Rule 6: for pools of 8+, split into two skill-balanced halves (top half /
  // bottom half by points). Partners are preferred from the SAME split
  // group; opponents are preferred from the OPPOSITE split group.
  if (enriched.length >= 8) {
    const half = Math.ceil(byPointsDesc.length / 2);
    byPointsDesc.forEach((p, idx) => {
      p.splitGroup = idx < half ? 0 : 1;
    });
  } else {
    enriched.forEach((p) => {
      p.splitGroup = 0;
    });
  }

  return enriched;
};

const TIER_CYCLE = ["Strong", "Mid", "Weak"];

/** Rule 4: which partner tier a player should be seeking on their Nth (0-based) game. */
const desiredPartnerTier = (gamesPlayedSoFar) => TIER_CYCLE[gamesPlayedSoFar % TIER_CYCLE.length];

/**
 * Rule 7, computed ONCE up front rather than reactively mid-schedule: works
 * out how many rounds are needed to give everyone `baseGamesPerPlayer`
 * games, how much court capacity that leaves unused across those rounds,
 * and hands that leftover — one bonus game per slot of leftover, capped at
 * one bonus game per player — to the strongest players by points.
 *
 * Doing this statically (instead of reactively bumping players mid-loop
 * whenever a round would otherwise be under-filled) matters: a small pool
 * relative to court capacity legitimately has under-filled TAIL rounds
 * that are just Rule 1's normal sit-out rotation, not idle capacity to
 * "rescue" — reacting to every such round by bumping more players' targets
 * can spiral (the newly-bumped players themselves create more short
 * rounds later, bumping still more players...) and starve the schedule of
 * the room it needs to keep rules 2/3/5 satisfiable. Fixing every target
 * before the first round is even built avoids that entirely.
 *
 * @returns {{ target: Map<String,Number>, roundsPlanned: Number }}
 */
const computeTargets = (players, baseGamesPerPlayer, capacity, playersPerMatch) => {
  const n = players.length;
  const target = new Map(players.map((p) => [p.id, baseGamesPerPlayer]));
  if (n === 0 || capacity <= 0) return { target, roundsPlanned: 0 };

  const totalNeeded = n * baseGamesPerPlayer;
  const roundsPlanned = Math.max(1, Math.ceil(totalNeeded / capacity));
  const totalAvailable = roundsPlanned * capacity;
  const leftoverSlots = totalAvailable - totalNeeded;
  const extraGameCount = Math.max(0, Math.min(n, leftoverSlots));

  [...players]
    .sort((a, b) => b.points - a.points || a.id.localeCompare(b.id))
    .slice(0, extraGameCount)
    .forEach((p) => target.set(p.id, baseGamesPerPlayer + 1));

  return { target, roundsPlanned };
};

/**
 * Picks who plays this round out of everyone still short of their target,
 * biased toward whoever is furthest behind their own target — Rule 1's
 * fairness — with a small random tie-break so the exact rotation isn't
 * perfectly deterministic across identical-progress players.
 */
const pickPlayersForRound = (players, state, capacity, playersPerMatch, rng) => {
  const eligible = players.filter((p) => state.gamesPlayed.get(p.id) < state.target.get(p.id));

  const ranked = shuffle(eligible, rng).sort((a, b) => {
    const ratioA = state.gamesPlayed.get(a.id) / state.target.get(a.id);
    const ratioB = state.gamesPlayed.get(b.id) / state.target.get(b.id);
    if (ratioA !== ratioB) return ratioA - ratioB;
    // Furthest-behind tie-break: whoever has sat out longest goes first.
    return (state.lastPlayedRound.get(b.id) ?? -1) - (state.lastPlayedRound.get(a.id) ?? -1);
  });

  const maxSlots = Math.min(ranked.length, capacity);
  const usable = maxSlots - (maxSlots % playersPerMatch);
  return ranked.slice(0, usable);
};

const teamPoints = (team, pointsOf) => team.reduce((sum, id) => sum + pointsOf(id), 0);

/**
 * Rule 3 check: would this proposed team split put together two players who
 * were OPPONENTS in the immediately previous round, either as:
 *   - opponents again this round (a cross-team pair), or
 *   - partners this round (a same-team pair) — the extra case Rule 3 adds
 *     on top of Rule 2's separate, permanent "never repeat a partnership"
 *     check.
 */
const violatesImmediateRematch = (teamA, teamB, lastRoundOpponentPairs) => {
  const pairsToCheck = [];
  teamA.forEach((a) => teamB.forEach((b) => pairsToCheck.push([a, b]))); // would-be opponents
  if (teamA.length === 2) pairsToCheck.push(teamA); // would-be partners
  if (teamB.length === 2) pairsToCheck.push(teamB); // would-be partners
  return pairsToCheck.some(([a, b]) => lastRoundOpponentPairs.has(sortedPairKey(a, b)));
};

const violatesRepeatedPartner = (team, everPartnered) => {
  if (team.length < 2) return false;
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      if (everPartnered.has(sortedPairKey(team[i], team[j]))) return true;
    }
  }
  return false;
};

/** Rule 4 + Rule 6 + Rule 8 soft score for one candidate team split (higher is better). */
const scorePartition = (teamA, teamB, ctx) => {
  const { playersById, state } = ctx;
  let score = 0;

  [teamA, teamB].forEach((team) => {
    if (team.length < 2) return;
    const [p1, p2] = team.map((id) => playersById.get(id));
    // Rule 4: does this partnership match each player's desired tier for
    // the game they're about to play?
    const g1 = state.gamesPlayed.get(p1.id);
    const g2 = state.gamesPlayed.get(p2.id);
    if (p2.tier === desiredPartnerTier(g1)) score += 2;
    if (p1.tier === desiredPartnerTier(g2)) score += 2;
    // Rule 6: partners preferably come from the same split group.
    if (p1.splitGroup === p2.splitGroup) score += 1;
  });

  // Rule 6: opponents preferably come from opposite split groups.
  teamA.forEach((a) => {
    teamB.forEach((b) => {
      const pa = playersById.get(a);
      const pb = playersById.get(b);
      if (pa.splitGroup !== pb.splitGroup) score += 1;
      // Rule 8: prefer opponents not already faced, and among those already
      // faced, the ones faced least often / longest ago.
      const key = sortedPairKey(a, b);
      const timesFaced = state.opponentCount.get(key) || 0;
      score += timesFaced === 0 ? 3 : Math.max(0, 2 - timesFaced);
    });
  });

  return score;
};

const ALL_PARTITIONS_OF_4 = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

/**
 * Given exactly 4 players for a court, pick the best valid team split.
 * Returns { teamA, teamB, flags } or null if every partition violates a
 * strict rule (caller is expected to try a repair swap with another court,
 * and only as a last resort relax Rule 3).
 *
 * With `forceAny: true`, never returns null: if no partition is fully
 * clean even with Rule 3 relaxed, it still returns the LEAST-BAD partition
 * (fewest/lightest violations) rather than an arbitrary fixed split — e.g.
 * preferring a partition that repeats an old partnership over one that
 * repeats a partnership AND blows the point-balance cap. Used only once
 * every other option (including a cross-court repair swap) is exhausted.
 */
const bestDoublesPartition = (foursome, ctx, { relaxImmediateRematch = false, forceAny = false } = {}) => {
  const candidates = ALL_PARTITIONS_OF_4.map(([[ia, ib], [ic, id]]) => {
    const teamA = [foursome[ia], foursome[ib]];
    const teamB = [foursome[ic], foursome[id]];
    const repeatsPartner =
      violatesRepeatedPartner(teamA, ctx.state.everPartnered) || violatesRepeatedPartner(teamB, ctx.state.everPartnered);
    const pointsA = teamPoints(teamA, ctx.pointsOf);
    const pointsB = teamPoints(teamB, ctx.pointsOf);
    const overCap = Math.max(0, Math.abs(pointsA - pointsB) - ctx.maxPointDiff);
    const isRematch = violatesImmediateRematch(teamA, teamB, ctx.state.lastRoundOpponentPairs);
    return { teamA, teamB, pointsA, pointsB, repeatsPartner, overCap, isRematch };
  });

  // Priority, most to least protected: Rule 2 (never, unless forceAny) >
  // Rule 5 point balance ("always enforced") > Rule 3 immediate rematch
  // (has an explicit documented fallback). So within the clean (non
  // partner-repeat) candidates, prefer relaxing Rule 3 fully before ever
  // touching Rule 5, and only fall back to a repeated partnership — via
  // forceAny — when every single other option is exhausted.
  const clean = candidates.filter((c) => !c.repeatsPartner);
  const tiers = [
    clean.filter((c) => !c.isRematch && c.overCap === 0),
    relaxImmediateRematch || forceAny ? clean.filter((c) => c.isRematch && c.overCap === 0) : [],
    forceAny ? clean.filter((c) => !c.isRematch && c.overCap > 0) : [],
    forceAny ? clean.filter((c) => c.isRematch && c.overCap > 0) : [],
    forceAny ? candidates.filter((c) => c.repeatsPartner) : [],
  ];
  const tier = tiers.find((t) => t.length > 0);
  if (!tier) return null;

  tier.sort((x, y) => scorePartition(y.teamA, y.teamB, ctx) - scorePartition(x.teamA, x.teamB, ctx) || x.overCap - y.overCap);
  const chosen = tier[0];

  const flags = [];
  if (chosen.isRematch) flags.push("relaxed-rule-3-immediate-rematch");
  if (chosen.overCap > 0) flags.push("relaxed-rule-5-point-balance");
  if (chosen.repeatsPartner) flags.push("repeated-partner-unavoidable");

  return { teamA: chosen.teamA, teamB: chosen.teamB, pointsA: chosen.pointsA, pointsB: chosen.pointsB, flags };
};

/**
 * Deals players into court-sized foursomes such that each foursome's total
 * point spread is small (good raw material for a +/-2 balanced partition):
 * sort by points, then deal round-robin across the foursomes like dealing
 * cards, so every foursome gets one player from roughly each skill band.
 */
const dealIntoGroups = (playing, groupSize, pointsOf) => {
  const sorted = [...playing].sort((a, b) => pointsOf(b) - pointsOf(a));
  const groupCount = sorted.length / groupSize;
  const groups = Array.from({ length: groupCount }, () => []);
  sorted.forEach((id, idx) => {
    groups[idx % groupCount].push(id);
  });
  return groups;
};

/**
 * Local repair: if some foursome has no valid strict partition, try
 * swapping one of its players with a player from another foursome and
 * re-check both. Bounded attempts; mutates `groups` in place on success.
 */
const repairFoursomes = (groups, ctx, maxAttempts = 60) => {
  const isSolvable = (foursome) => bestDoublesPartition(foursome, ctx) !== null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const brokenIndex = groups.findIndex((g) => !isSolvable(g));
    if (brokenIndex === -1) return true;

    let fixed = false;
    for (let otherIndex = 0; otherIndex < groups.length && !fixed; otherIndex++) {
      if (otherIndex === brokenIndex) continue;
      for (let i = 0; i < groups[brokenIndex].length && !fixed; i++) {
        for (let j = 0; j < groups[otherIndex].length && !fixed; j++) {
          const a = groups[brokenIndex][i];
          const b = groups[otherIndex][j];
          groups[brokenIndex][i] = b;
          groups[otherIndex][j] = a;
          if (isSolvable(groups[brokenIndex]) && isSolvable(groups[otherIndex])) {
            fixed = true;
          } else {
            // undo
            groups[brokenIndex][i] = a;
            groups[otherIndex][j] = b;
          }
        }
      }
    }
    if (!fixed) return false; // give up; caller falls back to relaxation
  }
  return groups.every(isSolvable);
};

const buildDoublesRound = (playing, ctx) => {
  const groups = dealIntoGroups(playing, 4, ctx.pointsOf);
  const solvedCleanly = repairFoursomes(groups, ctx);

  const matches = [];
  const warnings = [];

  groups.forEach((foursome, idx) => {
    let partition = bestDoublesPartition(foursome, ctx);
    if (!partition) {
      // Strict repair failed for this foursome even after swaps — relax
      // Rule 3 (allow an immediate-opponent-rematch) before ever touching
      // Rule 2, per the spec's fallback ordering.
      partition = bestDoublesPartition(foursome, ctx, { relaxImmediateRematch: true });
    }
    if (!partition) {
      // Truly impossible to seat this foursome cleanly, even with Rule 3
      // relaxed (can happen only in very small/late-tournament pools).
      // Fall back to the LEAST-BAD partition — scored the same way as
      // normal, just permitting a repeated partnership or an over-cap point
      // diff if that's genuinely the only way to fill the court — and flag
      // it for the admin instead of silently breaking a strict rule.
      partition = bestDoublesPartition(foursome, ctx, { relaxImmediateRematch: true, forceAny: true });
      warnings.push(
        `Court ${idx + 1}: no clean team split was possible for players ${foursome.join(", ")} (flags: ${partition.flags.join(", ")}).`
      );
    }
    matches.push({
      court: idx + 1,
      type: "doubles",
      teamA: partition.teamA,
      teamB: partition.teamB,
      teamAPoints: partition.pointsA,
      teamBPoints: partition.pointsB,
      pointDiff: Math.abs(partition.pointsA - partition.pointsB),
      flags: partition.flags,
    });
  });

  if (!solvedCleanly) {
    warnings.push("One or more courts this round needed a relaxed constraint to fill (see match flags).");
  }

  return { matches, warnings };
};

const buildSinglesRound = (playing, ctx) => {
  const sorted = [...playing].sort((a, b) => ctx.pointsOf(b) - ctx.pointsOf(a));
  const remaining = [...sorted];
  const matches = [];
  const warnings = [];
  let court = 1;

  while (remaining.length >= 2) {
    const a = remaining.shift();

    // Score every remaining candidate opponent, then pick from the best
    // available TIER rather than a single relax-then-give-up pass — tier 1
    // (clean) is always preferred; only when a tier is completely empty do
    // we drop to the next, so a forced compromise is always the smallest
    // one actually needed, and is always flagged correctly (this mirrors
    // bestDoublesPartition's forceAny logic for the doubles path).
    const candidates = remaining.map((b, i) => {
      const key = sortedPairKey(a, b);
      const pointsDiff = Math.abs(ctx.pointsOf(a) - ctx.pointsOf(b));
      const overCap = Math.max(0, pointsDiff - ctx.maxPointDiff);
      const isRematch = ctx.state.lastRoundOpponentPairs.has(key);
      const timesFaced = ctx.state.opponentCount.get(key) || 0;
      const freshness = timesFaced === 0 ? 3 : Math.max(0, 2 - timesFaced);
      return { i, b, pointsDiff, overCap, isRematch, freshness };
    });

    // Rule 5 (point balance) is "always enforced" with no documented
    // fallback, so it's protected ahead of Rule 3's explicit fallback: tier
    // order is (no rematch, in cap) > (rematch, in cap) > (no rematch, over
    // cap) > (rematch, over cap) — i.e. relax Rule 3 fully before ever
    // touching Rule 5.
    const tiers = [
      candidates.filter((c) => !c.isRematch && c.overCap === 0),
      candidates.filter((c) => c.isRematch && c.overCap === 0),
      candidates.filter((c) => !c.isRematch && c.overCap > 0),
      candidates.filter((c) => c.isRematch && c.overCap > 0),
    ];
    const tier = tiers.find((t) => t.length > 0) || [];
    tier.sort((x, y) => y.freshness - x.freshness || x.overCap - y.overCap);
    const chosen = tier[0];

    if (!chosen) {
      warnings.push(`Court ${court}: ${a} had no remaining opponent this round.`);
      break;
    }
    if (chosen.overCap > 0) {
      warnings.push(`Court ${court}: no opponent within the point-balance cap was available for ${a}.`);
    }

    const b = remaining.splice(chosen.i, 1)[0];
    const bestRelaxed = chosen.isRematch;
    const relaxedPointBalance = chosen.overCap > 0;
    const pointsA = ctx.pointsOf(a);
    const pointsB = ctx.pointsOf(b);
    const flags = [];
    if (bestRelaxed) flags.push("relaxed-rule-3-immediate-rematch");
    if (relaxedPointBalance) flags.push("relaxed-rule-5-point-balance");
    matches.push({
      court,
      type: "singles",
      teamA: [a],
      teamB: [b],
      teamAPoints: pointsA,
      teamBPoints: pointsB,
      pointDiff: Math.abs(pointsA - pointsB),
      flags,
    });
    court++;
  }

  if (remaining.length === 1) {
    warnings.push(`${remaining[0]} could not be paired this round and was left sitting out.`);
  }

  return { matches, warnings, unpaired: remaining };
};

/**
 * Main entry point. Generates a full slot-by-slot schedule for one pool of
 * players sharing `numberOfCourts` courts.
 *
 * @param {Array<{id:String,name:String,grade:String,points?:Number}>} players
 * @param {Object} options
 * @param {"Singles"|"Doubles"} [options.matchType="Doubles"]
 * @param {Number} options.numberOfCourts
 * @param {Number} [options.baseGamesPerPlayer=3] - Rule 7 base target
 * @param {Number} [options.maxPointDiff=2] - Rule 5 cap
 * @param {Object} [options.pointsByGrade] - override for DEFAULT_POINTS_BY_GRADE
 * @param {Number} [options.maxRounds] - safety cap; default derived from baseGamesPerPlayer
 * @param {Function} [options.rng] - injectable RNG (0..1) for deterministic tests
 * @returns {{rounds:Array, playerSummary:Object, warnings:Array<String>, meta:Object}}
 */
const generateQueueSchedule = (players, options) => {
  const {
    matchType = "Doubles",
    numberOfCourts,
    baseGamesPerPlayer = 3,
    maxPointDiff = 2,
    pointsByGrade = DEFAULT_POINTS_BY_GRADE,
    maxRounds,
    rng = defaultRng,
  } = options;

  if (!numberOfCourts || numberOfCourts < 1) throw new Error("numberOfCourts must be >= 1");
  if (!players.length) return { rounds: [], playerSummary: {}, warnings: [], meta: { totalRounds: 0 } };

  const playersPerTeam = matchType === "Doubles" ? 2 : 1;
  const playersPerMatch = playersPerTeam * 2;

  const enriched = enrichPlayers(players, pointsByGrade);
  const playersById = new Map(enriched.map((p) => [p.id, p]));
  const pointsOf = (id) => playersById.get(id).points;

  // Edge case: a pool too small to ever field a single match. Doubles needs
  // 4 players per court, with one deliberate exception baked into the main
  // loop below — exactly 2 players still get scheduled, as a singles
  // fallback (spec edge case: "Only 2 players left -> schedule a singles
  // match"). Any OTHER undersized pool (1 or 3 players for Doubles; just 1
  // for Singles) can never produce a match no matter how many rounds this
  // function runs — without this check the loop below would simply never
  // pick anyone and silently return an empty schedule with an empty
  // `warnings` array, which reads as "nothing needed scheduling" instead of
  // "this couldn't be scheduled at all". Surfacing it here, before the
  // per-round machinery even starts, gives the admin an actionable message
  // instead of a mysteriously match-less tournament (see the skill's edge
  // case table: "Impossible to generate valid schedule -> Error to admin
  // with suggestion").
  if (enriched.length < playersPerMatch && enriched.length !== 2) {
    const playerSummary = {};
    enriched.forEach((p) => {
      playerSummary[p.id] = {
        name: p.name,
        grade: p.grade,
        tier: p.tier,
        splitGroup: p.splitGroup,
        gamesPlayed: 0,
        target: baseGamesPerPlayer,
        gotExtraGame: false,
        sitOuts: 0,
      };
    });
    return {
      rounds: [],
      playerSummary,
      warnings: [
        `Not enough players to schedule any ${matchType} match: ${matchType === "Doubles" ? "need at least 4 players (or exactly 2, which falls back to singles)" : "need at least 2 players"}, got ${enriched.length}.`,
      ],
      meta: { totalRounds: 0, matchType, numberOfCourts, baseGamesPerPlayer },
    };
  }

  const capacity = numberOfCourts * playersPerMatch;
  const { target, roundsPlanned } = computeTargets(enriched, baseGamesPerPlayer, capacity, playersPerMatch);

  const state = {
    gamesPlayed: new Map(enriched.map((p) => [p.id, 0])),
    target,
    lastPlayedRound: new Map(),
    everPartnered: new Set(),
    lastRoundOpponentPairs: new Set(),
    opponentCount: new Map(),
    sitOutCount: new Map(enriched.map((p) => [p.id, 0])),
  };

  const ctx = { playersById, pointsOf, state, maxPointDiff };
  const safetyCap = maxRounds || roundsPlanned + baseGamesPerPlayer + 5;

  const rounds = [];
  const warnings = [];
  let round = 0;

  while (round < safetyCap) {
    let playing = pickPlayersForRound(enriched, state, capacity, playersPerMatch, rng);

    // Doubles edge case: exactly 2 players left who still need a game and
    // nobody else is eligible — schedule a singles match for them rather
    // than stranding them (spec edge case: "Only 2 players left in final
    // slot -> schedule a singles match").
    const stillEligible = enriched.filter((p) => state.gamesPlayed.get(p.id) < state.target.get(p.id));
    if (playing.length === 0 && matchType === "Doubles" && stillEligible.length === 2) {
      playing = stillEligible;
    }

    if (playing.length < 2) break; // nothing more schedulable

    const playingIds = playing.map((p) => p.id);
    const sittingOut = enriched.filter((p) => !playing.includes(p)).map((p) => p.id);

    const isSinglesFallback = matchType === "Doubles" && playing.length === 2;

    const { matches, roundWarnings } =
      matchType === "Singles" || isSinglesFallback
        ? (() => {
            const r = buildSinglesRound(playingIds, ctx);
            return { matches: r.matches, roundWarnings: r.warnings };
          })()
        : (() => {
            const r = buildDoublesRound(playingIds, ctx);
            return { matches: r.matches, roundWarnings: r.warnings };
          })();

    // Book-keeping: games played, partner/opponent history, sit-out counts.
    const thisRoundOpponentPairs = new Set();
    matches.forEach((m) => {
      [...m.teamA, ...m.teamB].forEach((id) => {
        state.gamesPlayed.set(id, state.gamesPlayed.get(id) + 1);
        state.lastPlayedRound.set(id, round);
      });
      if (m.teamA.length === 2) state.everPartnered.add(sortedPairKey(m.teamA[0], m.teamA[1]));
      if (m.teamB.length === 2) state.everPartnered.add(sortedPairKey(m.teamB[0], m.teamB[1]));
      m.teamA.forEach((a) =>
        m.teamB.forEach((b) => {
          const key = sortedPairKey(a, b);
          thisRoundOpponentPairs.add(key);
          state.opponentCount.set(key, (state.opponentCount.get(key) || 0) + 1);
        })
      );
    });
    sittingOut.forEach((id) => state.sitOutCount.set(id, state.sitOutCount.get(id) + 1));
    state.lastRoundOpponentPairs = thisRoundOpponentPairs;

    rounds.push({ roundNumber: round + 1, sittingOut, matches });
    warnings.push(...roundWarnings.map((w) => `Round ${round + 1}: ${w}`));

    round++;

    const anyoneStillEligible = enriched.some((p) => state.gamesPlayed.get(p.id) < state.target.get(p.id));
    if (!anyoneStillEligible) break;
  }

  const playerSummary = {};
  enriched.forEach((p) => {
    playerSummary[p.id] = {
      name: p.name,
      grade: p.grade,
      tier: p.tier,
      splitGroup: p.splitGroup,
      gamesPlayed: state.gamesPlayed.get(p.id),
      target: state.target.get(p.id),
      gotExtraGame: state.target.get(p.id) > baseGamesPerPlayer,
      sitOuts: state.sitOutCount.get(p.id),
    };
  });

  return {
    rounds,
    playerSummary,
    warnings,
    meta: { totalRounds: rounds.length, matchType, numberOfCourts, baseGamesPerPlayer },
  };
};

/**
 * Flattens the round-based schedule into a list shaped close to the
 * existing RoundRobinMatch documents (adds a `slot`/round number, which the
 * current schema doesn't have yet — see the integration notes returned
 * alongside this module).
 */
const toFlatMatchList = (schedule, { tournamentId, groupId = null, groupName = "" } = {}) => {
  const list = [];
  schedule.rounds.forEach((round) => {
    round.matches.forEach((m) => {
      list.push({
        tournamentId,
        groupId,
        slot: round.roundNumber,
        matchName: `${groupName ? `${groupName} - ` : ""}Round ${round.roundNumber} - Court ${m.court}`,
        court: `Court ${m.court}`,
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
  return list;
};

module.exports = {
  DEFAULT_POINTS_BY_GRADE,
  enrichPlayers,
  generateQueueSchedule,
  toFlatMatchList,
};
