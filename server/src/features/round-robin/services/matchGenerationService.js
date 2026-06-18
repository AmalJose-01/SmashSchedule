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
 * Generate all round-robin match combinations for a single group.
 * Singles: n*(n-1)/2 matches
 * @param {Array} players - Array of player objects { playerId, name }
 * @param {ObjectId} tournamentId
 * @param {ObjectId} groupId
 * @param {String} groupName
 * @param {Number} numberOfCourts
 * @param {Number} courtStartIndex - running court counter across groups
 * @returns {{ matches: Array, nextCourtIndex: Number }}
 */
const generateSinglesMatches = (
  players,
  tournamentId,
  groupId,
  groupName,
  numberOfCourts,
  courtStartIndex = 0
) => {
  const matches = [];
  let courtIndex = courtStartIndex;
  let matchCounter = 1;

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const courtNumber = (courtIndex % numberOfCourts) + 1;
      matches.push({
        tournamentId,
        groupId,
        matchName: `${groupName} - Match ${matchCounter}`,
        player1Id: players[i].playerId,
        player2Id: players[j].playerId,
        court: `Court ${courtNumber}`,
        status: "scheduled",
        sets: [],
        winner: null,
        loser: null,
      });
      courtIndex++;
      matchCounter++;
    }
  }

  return { matches, nextCourtIndex: courtIndex };
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
 * @param {Array} allGroups - Array of { groupId, groupName, players: [{ playerId, name }] }
 * @param {ObjectId} tournamentId
 * @param {Number} numberOfCourts
 * @returns {{ matches: Array }}
 */
const generateDoublesMatches = (allGroups, tournamentId, numberOfCourts) => {
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
  let matchCounter = 1;

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
          matchName: `${fixtureName} - Match ${matchCounter}`,
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
        matchCounter++;
      }
    }
  }

  return { matches };
};

module.exports = { groupPlayers, generateSinglesMatches, generateDoublesMatches };
