const RoundRobinGroup = require("../models/RoundRobinGroup");
const RoundRobinMatch = require("../models/RoundRobinMatch");
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
      draws: 0,
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
 *
 * pointsDiff must be recomputed BEFORE sorting, not after: applyResult /
 * reverseResult only ever touch pointsFor/pointsAgainst, so an entry's
 * pointsDiff field is still whatever it was left at at the END of the
 * PREVIOUS call to this function — one result behind — until this refresh
 * runs. Sorting first and refreshing after (the original order here) means
 * every pointsDiff tie-break compares stale values, which most visibly
 * breaks a fresh entry's very first tie-break (starts at the ensureEntry
 * default of 0 for everyone, real or not).
 */
const rankStandings = (standings) => {
  standings.forEach((s) => {
    s.pointsDiff = s.pointsFor - s.pointsAgainst;
  });
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
    return b.pointsFor - a.pointsFor;
  });
  standings.forEach((s, idx) => {
    s.rank = idx + 1;
  });
};

/**
 * Apply result stats to a single standings entry.
 * @param {Object} entry      - Standings entry (mutated in place)
 * @param {Number} ptsFor     - Points scored by this player's side
 * @param {Number} ptsAgainst - Points scored against this player's side
 * @param {"win"|"loss"|"draw"} result - Outcome for this player's side
 */
const applyResult = (entry, ptsFor, ptsAgainst, result) => {
  entry.matchesPlayed += 1;
  entry.pointsFor += ptsFor;
  entry.pointsAgainst += ptsAgainst;
  if (result === "win") {
    entry.wins += 1;
    entry.totalPoints += 2;
  } else if (result === "draw") {
    // Draws are only possible for an even-numbered Best of N (e.g. Best of 2)
    // tied on both sets and total points. Worth half a win in the table.
    entry.draws += 1;
    entry.totalPoints += 1;
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
  const homeResult = winner === "home" ? "win" : winner === "draw" ? "draw" : "loss";
  const awayResult = winner === "away" ? "win" : winner === "draw" ? "draw" : "loss";

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

    applyResult(p1Entry, homeTotal, awayTotal, homeResult);
    applyResult(p2Entry, awayTotal, homeTotal, awayResult);

    rankStandings(groupA.standings);
    groupA.markModified("standings");
    await groupA.save();

    return { groupA: groupA.standings, groupB: null };
  }

  // ── Doubles — update Group A (home pair) ────────────────────────────────────
  const p1Entry  = ensureEntry(groupA.standings, getId(match.player1Id),        getName(match.player1Id));
  const p1pEntry = ensureEntry(groupA.standings, getId(match.player1PartnerId), getName(match.player1PartnerId));

  applyResult(p1Entry,  homeTotal, awayTotal, homeResult);
  applyResult(p1pEntry, homeTotal, awayTotal, homeResult);

  rankStandings(groupA.standings);
  groupA.markModified("standings");
  await groupA.save();

  // ── Doubles — update Group B (away pair) ────────────────────────────────────
  if (groupB) {
    const p2Entry  = ensureEntry(groupB.standings, getId(match.player2Id),        getName(match.player2Id));
    const p2pEntry = ensureEntry(groupB.standings, getId(match.player2PartnerId), getName(match.player2PartnerId));

    applyResult(p2Entry,  awayTotal, homeTotal, awayResult);
    applyResult(p2pEntry, awayTotal, homeTotal, awayResult);

    rankStandings(groupB.standings);
    groupB.markModified("standings");
    await groupB.save();
  }

  return { groupA: groupA.standings, groupB: groupB?.standings ?? null };
};

/**
 * Reverse a previously recorded match result from standings.
 * Subtracts the stats that were added when the score was first recorded.
 */
const reverseStandings = async (match, sets, config = {}) => {
  const { winner } = determineWinner(sets, config);
  const { homeTotal, awayTotal } = getTotalPoints(sets);
  const homeResult = winner === "home" ? "win" : winner === "draw" ? "draw" : "loss";
  const awayResult = winner === "away" ? "win" : winner === "draw" ? "draw" : "loss";

  const isDoubles = !!match.player1PartnerId;

  const groupA = await RoundRobinGroup.findById(match.groupId);
  if (!groupA) return null;

  let groupB = null;
  if (isDoubles) {
    groupB = await RoundRobinGroup.findOne({
      tournamentId: match.tournamentId,
      "players.playerId": getId(match.player2Id),
      _id: { $ne: groupA._id },
    });
  }

  const getName = (field) => (field && typeof field === "object" ? field.name : "") ?? "";

  const reverseResult = (entry, ptsFor, ptsAgainst, result) => {
    entry.matchesPlayed = Math.max(0, entry.matchesPlayed - 1);
    entry.pointsFor     = Math.max(0, entry.pointsFor     - ptsFor);
    entry.pointsAgainst = Math.max(0, entry.pointsAgainst - ptsAgainst);
    if (result === "win") {
      entry.wins        = Math.max(0, entry.wins        - 1);
      entry.totalPoints = Math.max(0, entry.totalPoints - 2);
    } else if (result === "draw") {
      entry.draws       = Math.max(0, entry.draws       - 1);
      entry.totalPoints = Math.max(0, entry.totalPoints - 1);
    } else {
      entry.losses      = Math.max(0, entry.losses      - 1);
    }
  };

  if (!isDoubles) {
    const p1Entry = ensureEntry(groupA.standings, getId(match.player1Id), getName(match.player1Id));
    const p2Entry = ensureEntry(groupA.standings, getId(match.player2Id), getName(match.player2Id));
    reverseResult(p1Entry, homeTotal, awayTotal, homeResult);
    reverseResult(p2Entry, awayTotal, homeTotal, awayResult);
    rankStandings(groupA.standings);
    groupA.markModified("standings");
    await groupA.save();
    return { groupA: groupA.standings, groupB: null };
  }

  // Doubles — reverse Group A (home pair)
  const p1Entry  = ensureEntry(groupA.standings, getId(match.player1Id),        getName(match.player1Id));
  const p1pEntry = ensureEntry(groupA.standings, getId(match.player1PartnerId), getName(match.player1PartnerId));
  reverseResult(p1Entry,  homeTotal, awayTotal, homeResult);
  reverseResult(p1pEntry, homeTotal, awayTotal, homeResult);
  rankStandings(groupA.standings);
  groupA.markModified("standings");
  await groupA.save();

  // Doubles — reverse Group B (away pair)
  if (groupB) {
    const p2Entry  = ensureEntry(groupB.standings, getId(match.player2Id),        getName(match.player2Id));
    const p2pEntry = ensureEntry(groupB.standings, getId(match.player2PartnerId), getName(match.player2PartnerId));
    reverseResult(p2Entry,  awayTotal, homeTotal, awayResult);
    reverseResult(p2pEntry, awayTotal, homeTotal, awayResult);
    rankStandings(groupB.standings);
    groupB.markModified("standings");
    await groupB.save();
  }

  return { groupA: groupA.standings, groupB: groupB?.standings ?? null };
};

/**
 * Apply a BYE match's result straight to its group's standings — there's no
 * real score (no opponent, nothing was "for" or "against" anyone), so only
 * the win/matchesPlayed counters move, exactly the way `applyResult` moves
 * them for a normal win, with pointsFor/pointsAgainst left at 0.
 *
 * @param {Object} match - a saved RoundRobinMatch doc with isBye: true (groupId, player1Id, player1PartnerId)
 */
const applyByeStanding = async (match) => {
  if (!match.groupId) return null;

  const group = await RoundRobinGroup.findById(match.groupId);
  if (!group) return null;

  const p1Entry = ensureEntry(group.standings, getId(match.player1Id));
  applyResult(p1Entry, 0, 0, "win");

  if (match.player1PartnerId) {
    const p1pEntry = ensureEntry(group.standings, getId(match.player1PartnerId));
    applyResult(p1pEntry, 0, 0, "win");
  }

  rankStandings(group.standings);
  group.markModified("standings");
  await group.save();

  return group.standings;
};

/**
 * Standings for a Graded Round Robin tournament, computed fresh from
 * completed matches rather than an incrementally-updated document.
 *
 * A Graded tournament has no RoundRobinGroup documents at all — its grade
 * groups are recomputed at finalize time straight from player grades (see
 * gradedRoundRobinEngine.js) and each match just carries a
 * `gradeGroupLabel` string instead of a `groupId` reference. Rather than
 * bolt that onto the Balanced format's incremental update/reverse dance
 * (which mutates a persisted `standings` array and would need its own
 * "find the right document for this label" lookup on every score change),
 * this recomputes the table on demand from whatever matches are currently
 * completed. That trades a little query cost on read for zero standings
 * drift risk — there's no separate state that could fall out of sync with
 * the matches themselves.
 *
 * @param {ObjectId|String} tournamentId
 * @returns {Array<{groupName:String, standings:Array}>} same shape as the
 *   Balanced format's getStandings response, keyed by grade group label
 *   instead of RoundRobinGroup name — so existing clients that just render
 *   `data.map(g => ({ groupName: g.groupName, standings: g.standings }))`
 *   need no changes to support Graded tournaments too.
 */
const computeGradedStandings = async (tournamentId) => {
  const matches = await RoundRobinMatch.find({
    tournamentId,
    status: "completed",
    isBye: { $ne: true }, // Graded matches are never byes, but guard anyway
  })
    .populate("player1Id", "name")
    .populate("player1PartnerId", "name")
    .populate("player2Id", "name")
    .populate("player2PartnerId", "name")
    .populate("winner", "name");

  const getName = (field) => (field && typeof field === "object" ? field.name : "") ?? "";
  const standingsByLabel = new Map();

  matches.forEach((match) => {
    if (!match.player1Id || !match.player2Id) return; // safety: skip anything without two real sides

    const label = match.gradeGroupLabel || "Ungrouped";
    if (!standingsByLabel.has(label)) standingsByLabel.set(label, []);
    const standings = standingsByLabel.get(label);

    const { homeTotal, awayTotal } = getTotalPoints(match.sets || []);
    const homeResult = match.isDraw ? "draw" : getId(match.winner) === getId(match.player1Id) ? "win" : "loss";
    const awayResult = match.isDraw ? "draw" : homeResult === "win" ? "loss" : "win";
    const isDoubles = !!match.player1PartnerId;

    applyResult(ensureEntry(standings, getId(match.player1Id), getName(match.player1Id)), homeTotal, awayTotal, homeResult);
    if (isDoubles) {
      applyResult(
        ensureEntry(standings, getId(match.player1PartnerId), getName(match.player1PartnerId)),
        homeTotal,
        awayTotal,
        homeResult
      );
    }
    applyResult(ensureEntry(standings, getId(match.player2Id), getName(match.player2Id)), awayTotal, homeTotal, awayResult);
    if (isDoubles) {
      applyResult(
        ensureEntry(standings, getId(match.player2PartnerId), getName(match.player2PartnerId)),
        awayTotal,
        homeTotal,
        awayResult
      );
    }
  });

  const result = [];
  standingsByLabel.forEach((standings, groupName) => {
    rankStandings(standings);
    result.push({ groupName, standings });
  });
  return result;
};

module.exports = { updateStandings, reverseStandings, applyByeStanding, computeGradedStandings };
