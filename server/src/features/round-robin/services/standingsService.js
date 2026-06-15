const RoundRobinGroup = require("../models/RoundRobinGroup");
const { getTotalPoints, determineWinner } = require("../../../../helpers/matchHelpers");

/**
 * Ensure a standings entry exists for a player; return it.
 */
const ensureEntry = (standings, playerId, name = "") => {
  let entry = standings.find((s) => s.playerId.toString() === playerId);
  if (!entry) {
    standings.push({
      playerId,
      name,
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

/**
 * Re-sort standings by totalPoints → pointsDiff → pointsFor and assign ranks.
 */
const rankStandings = (standings) => {
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
    return b.pointsFor - a.pointsFor;
  });
  standings.forEach((s, idx) => {
    s.pointsDiff = s.pointsFor - s.pointsAgainst;
    s.rank = idx + 1;
  });
};

/**
 * Apply result stats to a single standings entry.
 * @param {Object} entry      - Standings entry (mutated in place)
 * @param {Number} ptsFor     - Points scored by this player's side
 * @param {Number} ptsAgainst - Points scored against this player's side
 * @param {Boolean} won       - true if this player's side won
 */
const applyResult = (entry, ptsFor, ptsAgainst, won) => {
  entry.matchesPlayed += 1;
  entry.pointsFor += ptsFor;
  entry.pointsAgainst += ptsAgainst;
  if (won) {
    entry.wins += 1;
    entry.totalPoints += 2;
  } else {
    entry.losses += 1;
  }
};

/**
 * Safely extract a string ID from a field that may be a raw ObjectId,
 * a populated Mongoose document, or null/undefined.
 */
const getId = (field) => {
  if (!field) return null;
  if (typeof field === "object" && field._id) return field._id.toString();
  return field.toString();
};

/**
 * Update standings after a match score is recorded.
 *
 * Singles: updates player1Id (home) and player2Id (away) in the match's group.
 *
 * Doubles: updates all four players across two groups —
 *   • Group A (match.groupId):  player1Id + player1PartnerId (home team)
 *   • Group B (looked up by player2Id): player2Id + player2PartnerId (away team)
 *
 * @param {Object} match  - Saved RoundRobinMatch document
 * @param {Array}  sets   - Array of { home, away } set scores
 * @param {Object} config - Tournament scoring config { numberOfSets, setWinningPoint, winningPointGap }
 * @returns {Object} Updated standings: { groupA: [...], groupB: [...] | null }
 */
const updateStandings = async (match, sets, config = {}) => {
  const { winner } = determineWinner(sets, config);
  const { homeTotal, awayTotal } = getTotalPoints(sets);
  const homeWon = winner === "home";
  const awayWon = winner === "away";

  const isDoubles = !!match.player1PartnerId;

  // ── Fetch group(s) ──────────────────────────────────────────────────────────
  const groupA = await RoundRobinGroup.findById(match.groupId);
  if (!groupA) return null;

  let groupB = null;
  if (isDoubles) {
    // Group B is the group that owns player2Id (different from groupA)
    groupB = await RoundRobinGroup.findOne({
      tournamentId: match.tournamentId,
      "players.playerId": getId(match.player2Id),
      _id: { $ne: groupA._id },
    });
  }

  const getName = (field) => (field && typeof field === "object" ? field.name : "") ?? "";

  // ── Singles ─────────────────────────────────────────────────────────────────
  if (!isDoubles) {
    const p1Entry = ensureEntry(groupA.standings, getId(match.player1Id), getName(match.player1Id));
    const p2Entry = ensureEntry(groupA.standings, getId(match.player2Id), getName(match.player2Id));

    applyResult(p1Entry, homeTotal, awayTotal, homeWon);
    applyResult(p2Entry, awayTotal, homeTotal, awayWon);

    rankStandings(groupA.standings);
    groupA.markModified("standings");
    await groupA.save();

    return { groupA: groupA.standings, groupB: null };
  }

  // ── Doubles — update Group A (home pair) ────────────────────────────────────
  const p1Entry  = ensureEntry(groupA.standings, getId(match.player1Id),        getName(match.player1Id));
  const p1pEntry = ensureEntry(groupA.standings, getId(match.player1PartnerId), getName(match.player1PartnerId));

  applyResult(p1Entry,  homeTotal, awayTotal, homeWon);
  applyResult(p1pEntry, homeTotal, awayTotal, homeWon);

  rankStandings(groupA.standings);
  groupA.markModified("standings");
  await groupA.save();

  // ── Doubles — update Group B (away pair) ────────────────────────────────────
  if (groupB) {
    const p2Entry  = ensureEntry(groupB.standings, getId(match.player2Id),        getName(match.player2Id));
    const p2pEntry = ensureEntry(groupB.standings, getId(match.player2PartnerId), getName(match.player2PartnerId));

    applyResult(p2Entry,  awayTotal, homeTotal, awayWon);
    applyResult(p2pEntry, awayTotal, homeTotal, awayWon);

    rankStandings(groupB.standings);
    groupB.markModified("standings");
    await groupB.save();
  }

  return { groupA: groupA.standings, groupB: groupB?.standings ?? null };
};

module.exports = { updateStandings };
