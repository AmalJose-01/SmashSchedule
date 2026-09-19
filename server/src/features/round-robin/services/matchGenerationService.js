const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// Reused ONLY for judging how "fair" a catch-up makeup match is (see
// generateMakeupMatches below) — the same scheduling-weight scale the
// new queue-based engine (queueRoundRobinEngine.js) uses for its own
// +/-2 court-balance rule. This has nothing to do with a player's real
// win/loss points (memberPointsService.js / constants/grades.js
// GRADE_DEFAULT_POINTS) — that scoring logic is untouched.
const { DEFAULT_POINTS_BY_GRADE } = require("./queueRoundRobinEngine");

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Distribute players into groups using the chosen strategy.
 * @param {Array} players - Array of RoundRobinPlayer docs
 * @param {Number} numberOfGroups
 * @param {String} strategy - "random" | "by-grade" | "balanced"
 * @param {Object} [previousGroupIndexByPlayerId] - Map of playerId (string) →
 *   the group index (0-based, matching "Group A" = 0, "Group B" = 1, ...)
 *   they were in before this regeneration. When supplied, Regenerate makes a
 *   best effort to move every player out of their previous group instead of
 *   (by chance, or determinism for by-grade/balanced) leaving them where
 *   they were.
 * @returns {Array[]} - Array of player arrays, one per group
 */
const groupPlayers = (players, numberOfGroups, strategy, previousGroupIndexByPlayerId = {}) => {
  const gradeOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated"];
  const hasPrevious = previousGroupIndexByPlayerId && Object.keys(previousGroupIndexByPlayerId).length > 0;

  // Grade-based strategies sort deterministically, which means re-running
  // Regenerate with the same players would rebuild the identical groups
  // every time. Shuffling first (Array#sort is stable) randomizes the order
  // of players who share a grade, so the grade tiers are preserved but the
  // exact group each player lands in still varies between regenerations.
  const buildOrdered = () => {
    if (strategy === "by-grade" || strategy === "balanced") {
      return shuffle(players).sort(
        (a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)
      );
    }
    return shuffle(players);
  };

  const buildGroupsFromOrder = (ordered) => {
    const groups = Array.from({ length: numberOfGroups }, () => []);
    if (strategy === "balanced") {
      // Snake draft: fill groups left-to-right then right-to-left
      ordered.forEach((player, index) => {
        const round = Math.floor(index / numberOfGroups);
        const pos = index % numberOfGroups;
        const groupIndex = round % 2 === 0 ? pos : numberOfGroups - 1 - pos;
        groups[groupIndex].push(player);
      });
    } else {
      // Sequential fill (random-shuffled or by-grade sequential)
      ordered.forEach((player, index) => {
        groups[index % numberOfGroups].push(player);
      });
    }
    return groups;
  };

  const countConflicts = (groups) => {
    if (!hasPrevious) return 0;
    let conflicts = 0;
    groups.forEach((group, groupIndex) => {
      group.forEach((player) => {
        if (previousGroupIndexByPlayerId[String(player._id)] === groupIndex) conflicts++;
      });
    });
    return conflicts;
  };

  // Try a handful of shuffles and keep the one with the fewest players left
  // in their previous group — with more than one group this almost always
  // finds a perfect (zero-repeat) arrangement within a few attempts.
  const canAvoidRepeats = numberOfGroups > 1 && hasPrevious;
  const maxAttempts = canAvoidRepeats ? 200 : 1;

  let bestGroups = null;
  let bestConflicts = Infinity;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = buildGroupsFromOrder(buildOrdered());
    const conflicts = countConflicts(candidate);
    if (conflicts < bestConflicts) {
      bestConflicts = conflicts;
      bestGroups = candidate;
    }
    if (conflicts === 0) break;
  }

  // Best-effort repair pass for any leftovers: swap a still-conflicting
  // player with someone from a different group, as long as the swap doesn't
  // just create a new conflict for the swap partner.
  if (bestConflicts > 0 && canAvoidRepeats) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let gi = 0; gi < bestGroups.length && !changed; gi++) {
        const group = bestGroups[gi];
        for (let ai = 0; ai < group.length && !changed; ai++) {
          const player = group[ai];
          if (previousGroupIndexByPlayerId[String(player._id)] !== gi) continue;

          for (let gj = 0; gj < bestGroups.length && !changed; gj++) {
            if (gj === gi) continue;
            if (previousGroupIndexByPlayerId[String(player._id)] === gj) continue; // moving here would still conflict
            const other = bestGroups[gj];
            for (let aj = 0; aj < other.length; aj++) {
              const partner = other[aj];
              if (previousGroupIndexByPlayerId[String(partner._id)] === gi) continue; // would conflict for partner
              group[ai] = partner;
              other[aj] = player;
              changed = true;
              break;
            }
          }
        }
      }
    }
  }

  return bestGroups;
};

/**
 * Build the standard "circle method" round-robin schedule for a list of players.
 * Returns an array of rounds, each round being an array of [playerA, playerB] pairs.
 * Across all (n-1) rounds (n players, padded with a bye if odd), every pair of
 * players faces each other exactly once — taking only the first N rounds gives
 * every player exactly N distinct matches (minus any round where they draw a bye).
 * @param {Array} players
 * @returns {Array<Array<[Object, Object]>>}
 */
const buildCircleMethodRounds = (players) => {
  let arr = [...players];
  const hasBye = arr.length % 2 !== 0;
  if (hasBye) arr.push(null); // bye placeholder so pairing math stays even

  const n = arr.length;
  const rounds = [];

  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const p1 = arr[i];
      const p2 = arr[n - 1 - i];
      if (p1 && p2) round.push([p1, p2]);
    }
    rounds.push(round);

    // Rotate everyone except the player fixed at index 0
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }

  return rounds;
};

/**
 * Generate round-robin match combinations for a single group.
 * Full round robin: n*(n-1)/2 matches (every player faces every other player once).
 * If matchesPerMember is set and is less than n-1, it is a HARD CAP — no player
 * is ever scheduled for more than that many matches — with a best-effort
 * minimum of the same number (a player can end up one match short, on an
 * odd-sized group's rotating bye, but never over the cap).
 * @param {Array} players - Array of player objects { playerId, name }
 * @param {ObjectId} tournamentId
 * @param {ObjectId} groupId
 * @param {String} groupName
 * @param {Number} numberOfCourts
 * @param {Number} courtStartIndex - running court counter across groups
 * @param {Number} [matchesPerMember] - hard cap on distinct matches per player; falls back to full round robin if omitted or >= n-1
 * @returns {{ matches: Array, nextCourtIndex: Number }}
 */
const generateSinglesMatches = (
  players,
  tournamentId,
  groupId,
  groupName,
  numberOfCourts,
  courtStartIndex = 0,
  matchesPerMember = null
) => {
  const matches = [];
  let courtIndex = courtStartIndex;
  let matchCounter = 1;

  const n = players.length;
  const maxPossible = n - 1;
  const useFullRoundRobin =
    !matchesPerMember || matchesPerMember <= 0 || matchesPerMember >= maxPossible;

  const pushMatch = (p1, p2) => {
    const courtNumber = (courtIndex % numberOfCourts) + 1;
    matches.push({
      tournamentId,
      groupId,
      matchName: `${groupName} - Match ${matchCounter}`,
      player1Id: p1.playerId,
      player2Id: p2.playerId,
      court: `Court ${courtNumber}`,
      status: "scheduled",
      sets: [],
      winner: null,
      loser: null,
    });
    courtIndex++;
    matchCounter++;
  };

  if (useFullRoundRobin) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        pushMatch(players[i], players[j]);
      }
    }
  } else {
    // Hard cap: a player must never be scheduled for more than
    // `matchesPerMember` matches. Walk the circle-method schedule round by
    // round and only keep a pairing if BOTH players are still under the cap
    // — skipping (not deferring) any pairing that would push someone over.
    // For an even-sized group every round pairs every player at once, so
    // this reaches an exact N-per-player result with zero skips needed. Only
    // an odd-sized group's rotating bye can leave a handful of players one
    // match short of the target — a capped player simply stops being
    // scheduled, and everyone still under the cap keeps pairing off against
    // each other in later rounds instead.
    const allRounds = buildCircleMethodRounds(players);
    const counts = new Map(players.map((p) => [String(p.playerId), 0]));

    for (const round of allRounds) {
      for (const [p1, p2] of round) {
        const c1 = counts.get(String(p1.playerId)) || 0;
        const c2 = counts.get(String(p2.playerId)) || 0;
        if (c1 >= matchesPerMember || c2 >= matchesPerMember) continue;
        pushMatch(p1, p2);
        counts.set(String(p1.playerId), c1 + 1);
        counts.set(String(p2.playerId), c2 + 1);
      }
      if ([...counts.values()].every((c) => c >= matchesPerMember)) break;
    }
  }

  return { matches, nextCourtIndex: courtIndex };
};

/**
 * Generate doubles matches across all groups (group vs group format), using a
 * round-based scheduler so the per-player minimum holds true no matter how
 * many groups there are (2, 3, 4+ — odd or even group counts).
 *
 * The old approach built one giant static list of "Group A pair vs Group B
 * pair" candidate matches up front and then greedily trimmed it down to each
 * player's match cap. That worked for exactly 2 groups, but broke down for 3+:
 * a player whose only remaining valid teammate was another already-shorted
 * player could end up with no feasible match left to "rescue" them with, even
 * though a valid schedule existed — the static candidate list itself was the
 * bottleneck, not the trimming heuristic.
 *
 * This version composes two independent circle-method rotations instead:
 *   1. Each group's own PARTNER rotation (`buildCircleMethodRounds(group.players)`)
 *      — round by round, which teammates pair up within that group.
 *   2. A GROUP-LEVEL FIXTURE rotation (`buildCircleMethodRounds(groupTokens)`,
 *      one token per group) — round by round, which other group each group
 *      faces (handles an odd number of groups via an automatic group bye,
 *      exactly like the player-level rotation handles an odd player count).
 *
 * Each "global round" advances the fixture rotation by one step; every group
 * that's actually fixtured in that round (i.e. not sitting out a group bye)
 * advances ITS OWN partner rotation by one step too — tracked via a per-group
 * local round counter rather than the shared global counter, so a group's bye
 * round doesn't desync its partner sequence or cause premature repeats. This
 * also keeps things fixture-balanced: every group faces every other group at
 * an even cadence (the same property the circle method guarantees for
 * players), so no single group/pairing is overused while others are skipped.
 *
 * If matchesPerMember is set, it is a HARD CAP — no player is ever scheduled
 * for more than that many matches, mirroring the singles fix above. A
 * candidate 2v2 match is only kept if all four players involved are still
 * under the cap; once a player hits it they simply stop being scheduled
 * while everyone else keeps going, so a handful of players can end up one
 * match short of the target (never over it). If omitted, every round is
 * played out, reproducing the old full round-robin coverage (every pair of
 * groups meets with every team combination once).
 *
 * Two groups can end up facing each other again in a later fixture cycle
 * (whenever more than one cycle is needed to hit the target). When that
 * happens, the team-pairing chosen for that repeat meeting is checked against
 * every pairing already used between that SAME pair of groups, and bumped
 * forward until an unused one is found — otherwise a naive index-based
 * rotation can land back on the exact same index it used the first time
 * (this happened in practice: e.g. group size 4 with an even number of
 * groups, where a group's local-round count advances by a multiple of its
 * own rotation length every full cycle, re-selecting an identical team
 * pairing against the same opponent and producing a literal duplicate
 * match). Once every distinct pairing between that pair of groups has
 * already been used, a further repeat meeting necessarily reuses one — that
 * point is only reached once truly exhausted, not avoidably.
 *
 * @param {Array} allGroups - Array of { groupId, groupName, players: [{ playerId, name }] }
 * @param {ObjectId} tournamentId
 * @param {Number} numberOfCourts
 * @param {Number} [matchesPerMember] - minimum matches per player; omit for full round robin
 * @returns {{ matches: Array }}
 */
const generateDoublesMatches = (allGroups, tournamentId, numberOfCourts, matchesPerMember = null) => {
  const numGroups = allGroups.length;
  if (numGroups < 2) return { matches: [] };

  // Per-group teammate rotation, and a group-level fixture rotation (treating
  // each group as a single "player" so odd group counts get a bye too).
  const groupPartnerRounds = allGroups.map((g) => buildCircleMethodRounds(g.players));
  const groupTokens = allGroups.map((g, idx) => ({ playerId: idx }));
  const groupFixtureRounds = buildCircleMethodRounds(groupTokens);
  const totalFixtureRounds = groupFixtureRounds.length || 1;

  const counts = new Map();
  allGroups.forEach((g) => g.players.forEach((p) => counts.set(String(p.playerId), 0)));

  // Advances only when a group is actually fixtured in a round, decoupling
  // its partner-rotation progress from a global round number it might sit
  // out of (group bye rounds).
  const groupLocalRound = new Array(numGroups).fill(0);

  // Per group-pair bookkeeping for the duplicate-avoidance check described
  // above: how far we've searched into the rotation for that pair so far
  // (pairSearchOffset), and which exact team-vs-team pairings have already
  // been used between that specific pair of groups (pairUsedPairings).
  const pairSearchOffset = new Map();
  const pairUsedPairings = new Map();

  const pairingSignature = (teamsA, teamsB) => {
    const pairCount = Math.min(teamsA.length, teamsB.length);
    const parts = [];
    for (let k = 0; k < pairCount; k++) {
      const [a1, a2] = teamsA[k];
      const [b1, b2] = teamsB[k];
      parts.push([a1.playerId, a2.playerId, b1.playerId, b2.playerId].sort().join(","));
    }
    return parts.sort().join("|");
  };

  const matches = [];
  let courtIndex = 0;

  const target = matchesPerMember && matchesPerMember > 0 ? matchesPerMember : null;
  const maxPartnerLen = Math.max(...groupPartnerRounds.map((r) => r.length || 1), 1);
  // Generous upper bound so the loop can't run away if a cap is somehow
  // unreachable (e.g. misconfigured target larger than feasible). Bumped up
  // from the old multiplier since the per-match hard-cap filter below can
  // make a cycle add fewer matches than before, needing more cycles to
  // reach the same target.
  const hardCap = totalFixtureRounds * maxPartnerLen * 5 + totalFixtureRounds + 5;
  let matchesAtLastCycle = 0;

  let round = 0;
  while (round < hardCap) {
    const fixtureRound = groupFixtureRounds[round % totalFixtureRounds];
    for (const [tokenA, tokenB] of fixtureRound) {
      const idxA = tokenA.playerId;
      const idxB = tokenB.playerId;
      const groupA = allGroups[idxA];
      const groupB = allGroups[idxB];
      const roundsA = groupPartnerRounds[idxA];
      const roundsB = groupPartnerRounds[idxB];
      if (!roundsA.length || !roundsB.length) continue;

      const pairKey = idxA < idxB ? `${idxA}-${idxB}` : `${idxB}-${idxA}`;
      const usedPairings = pairUsedPairings.get(pairKey) || new Set();
      const maxAttempts = Math.max(roundsA.length, roundsB.length);

      let searchOffset = pairSearchOffset.get(pairKey) || 0;
      let teamsA, teamsB, signature;
      let attempts = 0;
      do {
        teamsA = roundsA[(groupLocalRound[idxA] + searchOffset) % roundsA.length];
        teamsB = roundsB[(groupLocalRound[idxB] + searchOffset) % roundsB.length];
        signature = pairingSignature(teamsA, teamsB);
        searchOffset++;
        attempts++;
      } while (usedPairings.has(signature) && attempts <= maxAttempts);

      pairSearchOffset.set(pairKey, searchOffset);
      usedPairings.add(signature);
      pairUsedPairings.set(pairKey, usedPairings);

      groupLocalRound[idxA]++;
      groupLocalRound[idxB]++;

      const fixtureName = `${groupA.groupName} vs ${groupB.groupName}`;
      const pairCount = Math.min(teamsA.length, teamsB.length);
      for (let k = 0; k < pairCount; k++) {
        const [a1, a2] = teamsA[k];
        const [b1, b2] = teamsB[k];

        // Hard cap: skip this specific 2v2 pairing if any of the four
        // players involved has already reached the target — never schedule
        // a match that would push someone over it.
        if (target !== null) {
          const anyCapped = [a1, a2, b1, b2].some(
            (p) => (counts.get(String(p.playerId)) || 0) >= target
          );
          if (anyCapped) continue;
        }

        const courtNumber = (courtIndex % numberOfCourts) + 1;
        matches.push({
          tournamentId,
          groupId: groupA.groupId,
          // fixtureName kept separately so it can be renumbered once all
          // rounds are generated; matchName is finalized below.
          _fixtureName: fixtureName,
          player1Id: a1.playerId,
          player1PartnerId: a2.playerId,
          player2Id: b1.playerId,
          player2PartnerId: b2.playerId,
          court: `Court ${courtNumber}`,
          status: "scheduled",
          sets: [],
          winner: null,
          loser: null,
        });
        courtIndex++;
        counts.set(String(a1.playerId), (counts.get(String(a1.playerId)) || 0) + 1);
        counts.set(String(a2.playerId), (counts.get(String(a2.playerId)) || 0) + 1);
        counts.set(String(b1.playerId), (counts.get(String(b1.playerId)) || 0) + 1);
        counts.set(String(b2.playerId), (counts.get(String(b2.playerId)) || 0) + 1);
      }
    }
    round++;

    // Only evaluate whether to stop at the boundary of a full fixture cycle
    // (every totalFixtureRounds rounds). Within a cycle every group faces
    // every other group exactly once (or sits out exactly one bye, for odd
    // group counts) — stopping mid-cycle would leave whichever group(s)
    // happened to play in the cut-off rounds with more matches than the
    // rest, breaking the "every group faces every group equally" balance.
    if (round % totalFixtureRounds !== 0) continue;

    if (target !== null) {
      const minCount = Math.min(...counts.values());
      if (minCount >= target) break;
      // No new matches were addable this whole cycle (every remaining
      // candidate pairing involves an already-capped player) — further
      // cycles can't make progress either, so stop instead of spinning
      // until hardCap.
      if (matches.length === matchesAtLastCycle) break;
      matchesAtLastCycle = matches.length;
    } else if (round >= totalFixtureRounds * maxPartnerLen) {
      // Uncapped: stop once every group's partner rotation has fully cycled
      // through every fixture round, i.e. full round-robin coverage reached.
      break;
    }
  }

  // Renumber matches sequentially within each fixture so the displayed
  // "Match N" labels are contiguous.
  const fixtureCounters = new Map();
  for (const match of matches) {
    const fixtureName = match._fixtureName;
    const next = (fixtureCounters.get(fixtureName) || 0) + 1;
    fixtureCounters.set(fixtureName, next);
    match.matchName = `${fixtureName} - Match ${next}`;
    delete match._fixtureName;
  }

  return { matches };
};

/**
 * Best-effort "catch-up" pass for players who are still short of the
 * `target` match count after the normal group/fixture-based generation —
 * an unavoidable outcome of odd-sized groups (singles) or the doubles
 * partner+fixture rotation intersecting with the hard per-player cap (see
 * the comments on generateSinglesMatches / generateDoublesMatches above).
 *
 * BUG FIX: this pass used to only pair a shortfall player against someone
 * of their EXACT grade, and required at least 4 (doubles) / 2 (singles)
 * shortfall players in that ONE grade before it would create anything.
 * With shortfall players spread thinly across several grades — the normal
 * case, since a group's shortfall is whoever happened to draw the group's
 * rotating bye — almost no grade ever reached that threshold, so nearly
 * everyone fell through untouched to generateByeMatches and the tournament
 * ended up handing out a wall of individual BYEs instead of real games.
 *
 * Fixed by judging fairness the same way the rest of the app now does —
 * a +/-2 point-balance cap on the same DEFAULT_POINTS_BY_GRADE scale the
 * queue-based engine uses for its Rule 5 (see queueRoundRobinEngine.js) —
 * instead of requiring an identical grade. The WHOLE shortfall pool
 * (every grade together) is considered for every match: sorted by points
 * and greedily grouped into the closest-in-points foursomes/pairs
 * available, so a shortfall player is paired with whoever is nearest their
 * own level tournament-wide, not stuck waiting for 3 more players of their
 * own exact grade to also be short. A BYE is now only handed out when the
 * shortfall pool has truly run dry (0 or 1 player left with nobody
 * comparable to pair against) — the rare last resort the spec describes,
 * not the common case.
 *
 * @param {Array} allPlayers - every player in the tournament: { playerId, name, grade }
 * @param {Array} existingMatches - matches already generated (any groupId); used to compute current per-player counts and, for singles, to avoid an exact repeat pairing
 * @param {Number} target - match count to top shortfall players up to
 * @param {String} matchType - "Singles" | "Doubles"
 * @param {ObjectId} tournamentId
 * @param {Number} numberOfCourts
 * @param {Number} [courtStartIndex] - running court counter to continue from
 * @returns {{ matches: Array, stillShortPlayerIds: Array<String> }}
 */
const generateMakeupMatches = (
  allPlayers,
  existingMatches,
  target,
  matchType,
  tournamentId,
  numberOfCourts,
  courtStartIndex = 0
) => {
  if (!target || target <= 0 || !allPlayers.length) return { matches: [], stillShortPlayerIds: [] };

  const idOf = (p) => String(p.playerId ?? p._id ?? p);
  // Same points-by-grade scale the main scheduling engine uses for court
  // balance — used here ONLY to judge how fair a candidate makeup pairing
  // is, never to change what a player actually earns for winning/losing.
  const pointsOf = (p) => (typeof p.points === "number" ? p.points : DEFAULT_POINTS_BY_GRADE[p.grade] ?? 6);

  const counts = new Map(allPlayers.map((p) => [idOf(p), 0]));
  existingMatches.forEach((m) => {
    [m.player1Id, m.player1PartnerId, m.player2Id, m.player2PartnerId]
      .filter(Boolean)
      .forEach((pid) => counts.set(String(pid), (counts.get(String(pid)) || 0) + 1));
  });

  // Every direct opponent pairing already used, so a singles makeup match
  // doesn't just repeat a match that's already on the schedule.
  const alreadyFaced = new Set();
  existingMatches.forEach((m) => {
    const side1 = [m.player1Id, m.player1PartnerId].filter(Boolean).map(String);
    const side2 = [m.player2Id, m.player2PartnerId].filter(Boolean).map(String);
    side1.forEach((a) => side2.forEach((b) => alreadyFaced.add([a, b].sort().join("|"))));
  });

  const matches = [];
  let courtIndex = courtStartIndex;
  let matchCounter = 1;

  const pushMatch = (homeIds, awayIds) => {
    const courtNumber = (courtIndex % numberOfCourts) + 1;
    matches.push({
      tournamentId,
      groupId: null,
      matchName: `Makeup - Match ${matchCounter}`,
      player1Id: homeIds[0],
      player1PartnerId: homeIds[1] || null,
      player2Id: awayIds[0],
      player2PartnerId: awayIds[1] || null,
      court: `Court ${courtNumber}`,
      status: "scheduled",
      sets: [],
      winner: null,
      loser: null,
    });
    homeIds.concat(awayIds).forEach((pid) => {
      const key = String(pid);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    courtIndex++;
    matchCounter++;
  };

  const isShort = (p) => (counts.get(idOf(p)) || 0) < target;

  if (matchType === "Doubles") {
    // One balanced foursome per pass, pulled from the WHOLE shortfall pool
    // (every grade together) rather than one grade's own bucket. Sorting
    // by points first and always taking the current top 4 remaining
    // shortfall players means each foursome is made of whoever is
    // currently closest in skill among everyone still short — not
    // artificially confined to a single grade — so a match keeps getting
    // found as long as ANY 4 shortfall players remain, of any grade mix.
    let progressed = true;
    while (progressed) {
      progressed = false;
      const pool = allPlayers.filter(isShort).sort((a, b) => pointsOf(b) - pointsOf(a));
      if (pool.length < 4) break;

      const [a, b, c, d] = pool;
      // All 3 ways to split 4 players into two teams of 2 — keep whichever
      // keeps the two teams' combined points closest (mirrors the main
      // engine's own best-partition search, at the scale of one match).
      const partitions = [
        [[a, b], [c, d]],
        [[a, c], [b, d]],
        [[a, d], [b, c]],
      ];
      let bestSplit = partitions[0];
      let bestDiff = Infinity;
      partitions.forEach(([teamA, teamB]) => {
        const diff = Math.abs(
          pointsOf(teamA[0]) + pointsOf(teamA[1]) - (pointsOf(teamB[0]) + pointsOf(teamB[1]))
        );
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSplit = [teamA, teamB];
        }
      });

      const [teamA, teamB] = bestSplit;
      pushMatch([idOf(teamA[0]), idOf(teamA[1])], [idOf(teamB[0]), idOf(teamB[1])]);
      progressed = true;
    }
  } else {
    // Singles: same whole-pool, points-sorted approach — pair off whoever
    // is closest in points among everyone still short, skipping a pairing
    // that would just repeat an opponent match already on the schedule
    // when a different valid partner is available.
    let progressed = true;
    while (progressed) {
      progressed = false;
      const pool = allPlayers.filter(isShort).sort((a, b) => pointsOf(b) - pointsOf(a));
      for (let i = 0; i < pool.length && !progressed; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          const key = [idOf(pool[i]), idOf(pool[j])].sort().join("|");
          if (alreadyFaced.has(key)) continue;
          pushMatch([idOf(pool[i])], [idOf(pool[j])]);
          alreadyFaced.add(key);
          progressed = true;
          break;
        }
      }
    }
  }

  const stillShortPlayerIds = allPlayers.filter(isShort).map(idOf);
  return { matches, stillShortPlayerIds };
};

/**
 * Final guarantee pass, run after generateMakeupMatches: awards a BYE to
 * anyone STILL short of `target` — typically an odd leftover with no
 * same-grade shortfall partner left to pair against (see the comment on
 * generateMakeupMatches). A bye has no live opponent and needs no score —
 * it's pre-resolved as a win the moment it's created — so unlike the makeup
 * pass, this one always fully closes the gap; there's no "still short" list
 * coming back out.
 *
 * A bye is always SOLO — exactly one player per bye match, in both Singles
 * and Doubles (partner slot left empty), rather than teaming two shortfall
 * players up together. That keeps a bye's win credited to the one player it
 * was actually for, instead of quietly handing a second player an extra win
 * they didn't individually need.
 *
 * Each returned match is fully resolved: status "completed", winner set to
 * player1Id, isBye: true, groupId set from `playerGroupIdMap` when known.
 * The caller is expected to apply match points + standings for these
 * immediately, exactly as it would for any other completed match.
 *
 * @param {Array} allPlayers - every player in the tournament: { playerId, name }
 * @param {Array} existingMatches - matches already generated (any source); used to compute current per-player counts
 * @param {Number} target - match count every player should end up with
 * @param {String} matchType - "Singles" | "Doubles" (kept for signature parity with the other generators; a bye is solo either way)
 * @param {ObjectId} tournamentId
 * @param {Map<String,String>} [playerGroupIdMap] - playerId (string) → their groupId (string); used to attribute a bye to the right group's standings
 * @returns {{ matches: Array }}
 */
const generateByeMatches = (
  allPlayers,
  existingMatches,
  target,
  matchType,
  tournamentId,
  playerGroupIdMap = new Map()
) => {
  if (!target || target <= 0 || !allPlayers.length) return { matches: [] };

  const idOf = (p) => String(p.playerId ?? p._id ?? p);

  const counts = new Map(allPlayers.map((p) => [idOf(p), 0]));
  existingMatches.forEach((m) => {
    [m.player1Id, m.player1PartnerId, m.player2Id, m.player2PartnerId]
      .filter(Boolean)
      .forEach((pid) => counts.set(String(pid), (counts.get(String(pid)) || 0) + 1));
  });

  const matches = [];

  const pushBye = (p1) => {
    matches.push({
      tournamentId,
      groupId: playerGroupIdMap.get(idOf(p1)) || null,
      matchName: `BYE - ${p1.name}`,
      player1Id: p1.playerId,
      player1PartnerId: null,
      player2Id: null,
      player2PartnerId: null,
      court: "BYE",
      status: "completed",
      sets: [],
      winner: p1.playerId,
      loser: null,
      isBye: true,
    });
    const key = idOf(p1);
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  // Each pass always advances `first` toward the target (pushBye always
  // credits p1), so the shortfall list is guaranteed to shrink every
  // iteration and the loop terminates.
  let stillShort = allPlayers.filter((p) => (counts.get(idOf(p)) || 0) < target);
  while (stillShort.length > 0) {
    pushBye(stillShort[0]);
    stillShort = allPlayers.filter((p) => (counts.get(idOf(p)) || 0) < target);
  }

  return { matches };
};

module.exports = {
  groupPlayers,
  generateSinglesMatches,
  generateDoublesMatches,
  generateMakeupMatches,
  generateByeMatches,
};
