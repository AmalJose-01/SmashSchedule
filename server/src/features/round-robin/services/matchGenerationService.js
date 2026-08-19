const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
 * If matchesPerMember is set and is less than n-1, only the first N rounds of the
 * circle-method schedule are used, giving each player exactly N distinct matches.
 * @param {Array} players - Array of player objects { playerId, name }
 * @param {ObjectId} tournamentId
 * @param {ObjectId} groupId
 * @param {String} groupName
 * @param {Number} numberOfCourts
 * @param {Number} courtStartIndex - running court counter across groups
 * @param {Number} [matchesPerMember] - cap on distinct matches per player; falls back to full round robin if omitted or >= n-1
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
    // For odd-sized groups, each round has exactly one player sitting out on
    // a rotating basis, so naively slicing the first N rounds shorts whichever
    // players happen to draw their bye within that window. Instead, keep
    // adding rounds until every player has reached at least `matchesPerMember`
    // matches — guaranteeing the minimum for everyone (a few unlucky players
    // whose bye falls early may end up with one extra match, which is the
    // correct trade-off vs. leaving them under the target).
    const allRounds = buildCircleMethodRounds(players);
    const counts = new Map(players.map((p) => [String(p.playerId), 0]));
    const selectedRounds = [];

    for (const round of allRounds) {
      selectedRounds.push(round);
      round.forEach(([p1, p2]) => {
        counts.set(String(p1.playerId), (counts.get(String(p1.playerId)) || 0) + 1);
        counts.set(String(p2.playerId), (counts.get(String(p2.playerId)) || 0) + 1);
      });
      const minCount = Math.min(...counts.values());
      if (minCount >= matchesPerMember) break;
    }

    for (const round of selectedRounds) {
      for (const [p1, p2] of round) {
        pushMatch(p1, p2);
      }
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
 * If matchesPerMember is set, rounds keep getting added until every player has
 * reached at least that many matches (mirroring the singles fix above), then
 * stop — a few unlucky players may end up with one extra match rather than
 * one short, which is the correct trade-off for a *minimum* guarantee. If
 * omitted, every round is played out, reproducing the old full round-robin
 * coverage (every pair of groups meets with every team combination once).
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
  // unreachable (e.g. misconfigured target larger than feasible).
  const hardCap = totalFixtureRounds * maxPartnerLen * 3 + totalFixtureRounds + 5;

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

module.exports = { groupPlayers, generateSinglesMatches, generateDoublesMatches };
