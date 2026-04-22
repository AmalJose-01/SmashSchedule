const RoundRobinGroup = require("../models/RoundRobinGroup");
const { getTotalPoints, determineWinner } = require("../../../../helpers/matchHelpers");

/**
 * Update standings in a group after a match score is recorded.
 * @param {Object} match - The saved RoundRobinMatch document
 * @param {Array} sets   - Array of { home, away } set scores
 */
const updateStandings = async (match, sets) => {
  const group = await RoundRobinGroup.findById(match.groupId);
  if (!group) return;

  const { winner } = determineWinner(sets);
  const { homeTotal, awayTotal } = getTotalPoints(sets);

  const player1Id = match.player1Id.toString();
  const player2Id = match.player2Id.toString();

  const winnerId = winner === "home" ? player1Id : player2Id;
  const loserId = winner === "home" ? player2Id : player1Id;

  const ensureEntry = (standings, playerId, name) => {
    let entry = standings.find((s) => s.playerId.toString() === playerId);
    if (!entry) {
      standings.push({
        playerId,
        name: name || "",
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDiff: 0,
        totalPoints: 0,
        rank: 0,
      });
      entry = standings[standings.length - 1];
    }
    return entry;
  };

  // Names are already stored in standings from group creation; pass empty fallback
  const p1Entry = ensureEntry(group.standings, player1Id, "");
  const p2Entry = ensureEntry(group.standings, player2Id, "");

  // Update points scored
  p1Entry.pointsFor += homeTotal;
  p1Entry.pointsAgainst += awayTotal;
  p2Entry.pointsFor += awayTotal;
  p2Entry.pointsAgainst += homeTotal;

  p1Entry.matchesPlayed += 1;
  p2Entry.matchesPlayed += 1;

  if (winner) {
    const winnerEntry = group.standings.find(
      (s) => s.playerId.toString() === winnerId
    );
    const loserEntry = group.standings.find(
      (s) => s.playerId.toString() === loserId
    );
    if (winnerEntry) {
      winnerEntry.wins += 1;
      winnerEntry.totalPoints += 2;
    }
    if (loserEntry) {
      loserEntry.losses += 1;
    }
  }

  // Recalculate pointsDiff and rank
  group.standings.forEach((s) => {
    s.pointsDiff = s.pointsFor - s.pointsAgainst;
  });

  group.standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
    return b.pointsFor - a.pointsFor;
  });

  group.standings.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  group.markModified("standings");
  await group.save();

  return group.standings;
};

module.exports = { updateStandings };
