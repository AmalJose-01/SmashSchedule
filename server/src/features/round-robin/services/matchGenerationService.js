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
    const gradeOrder = ["A", "B", "C", "D", "E", "Unrated"];
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

module.exports = { groupPlayers, generateSinglesMatches };
