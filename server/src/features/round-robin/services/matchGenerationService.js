const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Distribute players into groups using the chosen strategy.
 * @param {Array} players - Array of RoundRobinPlayer docs
 * @param {Number} numberOfGroups
 * @param {String} strategy - "random" | "by-grade" | "balanced"
 * @returns {Array[]} - Array of player arrays, one per group
 */
const groupPlayers = (players, numberOfGroups, strategy) => {
  let ordered = [...players];

  if (strategy === "random") {
    // Fisher-Yates shuffle
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }
  } else if (strategy === "by-grade" || strategy === "balanced") {
    const gradeOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated"];
    ordered.sort(
      (a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)
    );
  }

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
    const rounds = buildCircleMethodRounds(players).slice(0, matchesPerMember);
    for (const round of rounds) {
      for (const [p1, p2] of round) {
        pushMatch(p1, p2);
      }
    }
  }

  return { matches, nextCourtIndex: courtIndex };
};

/**
 * Trim a list of generated matches so no player (by playerId, across player1Id,
 * player2Id, player1PartnerId, player2PartnerId) appears in more than `limit`
 * matches. Processes matches in their original order, greedily keeping a match
 * only if every player involved still has remaining budget.
 * @param {Array} matches
 * @param {Number} limit
 * @returns {Array}
 */
const capMatchesPerMember = (matches, limit) => {
  if (!limit || limit <= 0) return matches;

  const counts = new Map();
  const idsOf = (m) =>
    [m.player1Id, m.player2Id, m.player1PartnerId, m.player2PartnerId].filter(Boolean);

  const kept = [];
  for (const match of matches) {
    const ids = idsOf(match).map(String);
    const withinLimit = ids.every((id) => (counts.get(id) || 0) < limit);
    if (withinLimit) {
      ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
      kept.push(match);
    }
  }
  return kept;
};

/**
 * Generate doubles matches across all groups (group vs group format).
 *
 * Each group produces ALL C(n,2) intra-group player pairs as potential teams.
 * Matches are then created inter-group: for each pair of groups (A, B),
 * Group A's combinations are paired 1-to-1 with Group B's combinations,
 * giving n*(n-1)/2 matches per fixture (e.g. 21 matches for 7-player groups).
 *
 * Example (7 players per group):
 *   Group A pairs: P1-P2, P1-P3 … P6-P7  (21 pairs)
 *   Group B pairs: P8-P9, P8-P10 … P13-P14  (21 pairs)
 *   Match 1: P1-P2 vs P8-P9
 *   Match 2: P1-P3 vs P8-P10
 *   …
 *   Match 21: P6-P7 vs P13-P14
 *
 * If matchesPerMember is set, the generated fixture list is trimmed afterward so
 * no player appears (as either a player or a partner) in more than that many matches.
 *
 * @param {Array} allGroups - Array of { groupId, groupName, players: [{ playerId, name }] }
 * @param {ObjectId} tournamentId
 * @param {Number} numberOfCourts
 * @param {Number} [matchesPerMember] - cap on matches per player; omit for no cap
 * @returns {{ matches: Array }}
 */
const generateDoublesMatches = (allGroups, tournamentId, numberOfCourts, matchesPerMember = null) => {
  // Build all C(n,2) intra-group pairs for each group
  const groupCombinations = allGroups.map(({ groupId, groupName, players }) => {
    const pairs = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({ player1: players[i], player2: players[j] });
      }
    }
    return { groupId, groupName, pairs };
  });

  const matches = [];
  let courtIndex = 0;

  // Inter-group round-robin: Group A vs Group B, A vs C, B vs C …
  for (let gi = 0; gi < groupCombinations.length; gi++) {
    for (let gj = gi + 1; gj < groupCombinations.length; gj++) {
      const groupA = groupCombinations[gi];
      const groupB = groupCombinations[gj];
      const fixtureName = `${groupA.groupName} vs ${groupB.groupName}`;

      // Pair combinations 1-to-1 (use the shorter list's length if unequal)
      const matchCount = Math.min(groupA.pairs.length, groupB.pairs.length);
      for (let k = 0; k < matchCount; k++) {
        const pairA = groupA.pairs[k];
        const pairB = groupB.pairs[k];
        const courtNumber = (courtIndex % numberOfCourts) + 1;
        matches.push({
          tournamentId,
          groupId: groupA.groupId,
          // fixtureName kept separately so it can be renumbered after filtering;
          // matchName is finalized below once the per-member cap has been applied.
          _fixtureName: fixtureName,
          player1Id: pairA.player1.playerId,
          player1PartnerId: pairA.player2.playerId,
          player2Id: pairB.player1.playerId,
          player2PartnerId: pairB.player2.playerId,
          court: `Court ${courtNumber}`,
          status: "scheduled",
          sets: [],
          winner: null,
          loser: null,
        });
        courtIndex++;
      }
    }
  }

  const kept = capMatchesPerMember(matches, matchesPerMember);

  // Renumber matches sequentially within each fixture so the displayed
  // "Match N" labels have no gaps left behind by the cap filter.
  const fixtureCounters = new Map();
  for (const match of kept) {
    const fixtureName = match._fixtureName;
    const next = (fixtureCounters.get(fixtureName) || 0) + 1;
    fixtureCounters.set(fixtureName, next);
    match.matchName = `${fixtureName} - Match ${next}`;
    delete match._fixtureName;
  }

  return { matches: kept };
};

module.exports = { groupPlayers, generateSinglesMatches, generateDoublesMatches, capMatchesPerMember };
