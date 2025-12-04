// helpers/matchHelpers.js

/**
 * Get total points scored by home and away teams
 * @param {Array} sets - Array of sets [{home, away}]
 * @returns {Object} - { homeTotal, awayTotal }
 */
const getTotalPoints = (sets) => {
  let homeTotal = 0;
  let awayTotal = 0;
  let totalSets = 0;

  sets.forEach(set => {
    homeTotal += set.home;
    awayTotal += set.away;
    if (set.home > 0 && set.away > 0) {
      // home wins this set
      totalSets += 1;
    }
  });

  return { homeTotal, awayTotal, totalSets };
};

/**
 * Determine winner based on best of 3 sets
 * @param {Array} sets - Array of sets [{home, away}]
 * @returns {String|null} - 'home', 'away' or null (draw)
 */
function determineWinner(sets)  {
  let homeSetWins = 0;
  let awaySetWins = 0;

  sets.forEach(set => {
    if (set.home > set.away) homeSetWins += 1;
    else if (set.away > set.home) awaySetWins += 1;
    // if tie in a set, no increment
  });

   const totalSets = sets.length;
  const requiredWins = Math.ceil(totalSets / 2);

  let winner = null;
  let status = "Ongoing";

  if (homeSetWins >= requiredWins) {
      winner = "home";
    status = "finished";
  } else if (awaySetWins >= requiredWins) {
    winner = "away";
    matchStatus = "finished";
  }
  return { winner, status };
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
  let status = "Ongoing";

  if (homeWins >= requiredWins) {
    winner = teamsHome;
    status = "finished";
  } else if (awayWins >= requiredWins) {
    winner = teamsAway;
    status = "finished";
  }

  return { winner, status };
}


module.exports = { getTotalPoints, determineWinner, determineKnockoutWinnerAndStatus };
