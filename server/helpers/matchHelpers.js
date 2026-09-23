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

/**
 * Cross-group knockout Round 1 seeding.
 *
 * Replaces a pure random draw with the standard "avoid two teams from the
 * same group meeting in the very first knockout round" seeding used by most
 * bracket sports (e.g. a World Cup Round of 16 draw): groups are paired up
 * in ADJACENT PAIRS, in group-name order (Group A + Group B, Group C +
 * Group D, ...), and within each pair the WINNER of one group faces the
 * RUNNER-UP of the other:
 *   Group A winner  vs  Group B runner-up
 *   Group B winner  vs  Group A runner-up
 *   Group C winner  vs  Group D runner-up
 *   Group D winner  vs  Group C runner-up
 *   ... and so on for every further pair of groups.
 *
 * A team beyond rank 2 (a 3rd/4th-place team only pulled in to top the
 * bracket up to a valid size — see the "remainingTeams" top-up logic in
 * the knockout controllers) has no natural cross-group partner under this
 * rule. Those are seeded by strength instead (best vs next-best, by
 * totalPoints then pointsDiff), still preferring to avoid a same-group
 * pairing when a different pairing is available — much fairer than a
 * random draw, even though it isn't the winner/runner-up crossover rule.
 *
 * @param {Array<{teamId:String, name:String, groupName:String, rank:Number, totalPoints?:Number, pointsDiff?:Number}>} qualifiedTeams
 *   `rank` is 1-based WITHIN the team's own group (1 = group winner, 2 =
 *   runner-up, 3+ = lower placings pulled in only to fill the bracket).
 * @returns {Array<[Object, Object|null]>} first-round pairs; the second
 *   slot of the very last pair is `null` only in the (normally unreachable,
 *   since bracket sizes are kept even) case of one truly unpaired leftover.
 */
const buildCrossGroupKnockoutPairs = (qualifiedTeams) => {
  const byGroupNameAsc = (a, b) => (a.groupName || "").localeCompare(b.groupName || "");

  const winners = qualifiedTeams.filter((t) => t.rank === 1).sort(byGroupNameAsc);
  const runnersUp = qualifiedTeams.filter((t) => t.rank === 2).sort(byGroupNameAsc);
  const leftovers = qualifiedTeams.filter((t) => t.rank > 2);

  const pairs = [];
  const usedRunnerUpIds = new Set();
  const takeRunnerUpFor = (groupName) =>
    runnersUp.find((r) => r.groupName === groupName && !usedRunnerUpIds.has(r.teamId));

  for (let i = 0; i < winners.length; i += 2) {
    const groupX = winners[i];
    const groupY = winners[i + 1];

    if (groupY) {
      // Adjacent pair of groups: cross their winner against the OTHER
      // group's runner-up.
      const runnerUpForY = takeRunnerUpFor(groupY.groupName);
      const runnerUpForX = takeRunnerUpFor(groupX.groupName);
      if (runnerUpForY) {
        pairs.push([groupX, runnerUpForY]);
        usedRunnerUpIds.add(runnerUpForY.teamId);
      }
      if (runnerUpForX) {
        pairs.push([groupY, runnerUpForX]);
        usedRunnerUpIds.add(runnerUpForX.teamId);
      }
      if (!runnerUpForY && !runnerUpForX) {
        // Neither group has a runner-up (e.g. only 1 qualifier/group) —
        // nothing to cross, so the two group winners face each other.
        pairs.push([groupX, groupY]);
      }
    } else {
      // Odd number of groups: the last winner has no partner group to
      // cross with — give it any leftover runner-up from a DIFFERENT
      // group instead of leaving it unpaired.
      const fallbackRunnerUp = runnersUp.find(
        (r) => r.groupName !== groupX.groupName && !usedRunnerUpIds.has(r.teamId)
      );
      if (fallbackRunnerUp) {
        pairs.push([groupX, fallbackRunnerUp]);
        usedRunnerUpIds.add(fallbackRunnerUp.teamId);
      } else {
        leftovers.push(groupX); // no cross-group partner anywhere — seed it below instead
      }
    }
  }

  // Any runner-up the crossover above didn't use (odd group count, or a
  // group missing its own winner) also falls through to the strength-seeded
  // leftover pool rather than being silently dropped.
  runnersUp.forEach((r) => {
    if (!usedRunnerUpIds.has(r.teamId)) leftovers.push(r);
  });

  // Leftover / lower-placed teams: seed by strength (best vs next-best),
  // preferring a cross-group pairing over a same-group one when a choice
  // is available.
  leftovers.sort(
    (a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0) || (b.pointsDiff ?? 0) - (a.pointsDiff ?? 0)
  );
  while (leftovers.length >= 2) {
    const top = leftovers.shift();
    let partnerIndex = leftovers.findIndex((t) => t.groupName !== top.groupName);
    if (partnerIndex === -1) partnerIndex = 0; // every remaining team is from the same group — no choice left
    const [partner] = leftovers.splice(partnerIndex, 1);
    pairs.push([top, partner]);
  }
  if (leftovers.length === 1) {
    // One truly unpaired leftover — shouldn't normally happen since
    // bracket sizes are kept even, but surface it as a real pair entry
    // (partner: null) instead of silently dropping the team.
    pairs.push([leftovers[0], null]);
  }

  return pairs;
};

module.exports = {
  getTotalPoints,
  determineWinner,
  determineKnockoutWinnerAndStatus,
  isValidScore,
  buildCrossGroupKnockoutPairs,
};
