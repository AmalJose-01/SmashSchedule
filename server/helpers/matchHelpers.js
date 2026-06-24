// helpers/matchHelpers.js

/**
 * Get total points scored by home and away teams
 */
const getTotalPoints = (sets) => {
  let homeTotal = 0;
  let awayTotal = 0;

  sets.forEach((set) => {
    homeTotal += set.home;
    awayTotal += set.away;
  });

  return { homeTotal, awayTotal };
};

/**
 * Validate all sets against tournament scoring config.
 * @param {Array}  sets   - [{ home, away }]
 * @param {Object} config - { setWinningPoint, winningPointGap }
 */
const isValidScore = (sets, config = {}) => {
  const winPt = config.setWinningPoint ?? 21;
  const gap   = config.winningPointGap  ?? 2;

  return sets.every((set) => {
    const h = set.home;
    const a = set.away;

    // Allow empty set (0-0)
    if (h === 0 && a === 0) return true;

    // Tied above 0 — not allowed
    if (h === a && h > 0) return false;

    // Winner must reach setWinningPoint with at least winningPointGap lead
    const maxScore = Math.max(h, a);
    const diff     = Math.abs(h - a);
    return maxScore >= winPt && diff >= gap;
  });
};

/**
 * Determine winner based on sets and tournament config.
 * @param {Array}  sets   - [{ home, away }]
 * @param {Object} config - { numberOfSets, setWinningPoint, winningPointGap }
 */
const determineWinner = (sets, config = {}) => {
  const winPt      = config.setWinningPoint ?? 21;
  const gap        = config.winningPointGap  ?? 2;
  const maxSets    = config.numberOfSets     ?? sets.length;
  // True majority of sets — works for both odd (e.g. Best of 3 → 2) and
  // even (e.g. Best of 2 → 2, Best of 4 → 3) set counts.
  const requiredWins = Math.floor(maxSets / 2) + 1;

  let homeSetWins = 0;
  let awaySetWins = 0;

  sets.forEach((set) => {
    const h = set.home;
    const a = set.away;
    if (h >= winPt && h - a >= gap) homeSetWins++;
    else if (a >= winPt && a - h >= gap) awaySetWins++;
  });

  let winner      = null;
  let matchStatus = "ongoing";

  if (homeSetWins >= requiredWins) {
    winner      = "home";
    matchStatus = "finished";
  } else if (awaySetWins >= requiredWins) {
    winner      = "away";
    matchStatus = "finished";
  } else if (
    maxSets % 2 === 0 &&
    homeSetWins + awaySetWins === maxSets &&
    homeSetWins === awaySetWins
  ) {
    // Even-numbered format (e.g. Best of 2) with all sets played and split
    // evenly — no set-count majority is possible, so total points decide.
    const { homeTotal, awayTotal } = getTotalPoints(sets);
    if (homeTotal > awayTotal) winner = "home";
    else if (awayTotal > homeTotal) winner = "away";
    else winner = "draw";
    matchStatus = "finished";
  }

  return { winner, matchStatus };
};

function determineKnockoutWinnerAndStatus(scores, teamsHome, teamsAway) {
  let homeWins = 0;
  let awayWins = 0;

  scores.forEach((set) => {
    if (set.home > set.away) homeWins++;
    else if (set.away > set.home) awayWins++;
  });

  const requiredWins = Math.ceil(scores.length / 2);
  let winner = null;
  let status = "ongoing";

  if (homeWins >= requiredWins) {
    winner = teamsHome;
    status = "finished";
  } else if (awayWins >= requiredWins) {
    winner = teamsAway;
    status = "finished";
  }

  return { winner, status };
}

module.exports = { getTotalPoints, determineWinner, determineKnockoutWinnerAndStatus, isValidScore };
