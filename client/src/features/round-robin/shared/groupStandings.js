// Group-level standings (one row per group), built from each group's player
// standings. Summing player rows and halving assumes every side had two
// players; walkovers (byes) and short-handed doubles sides have one, so we
// add the missing half back from the match list so each counts as a full
// match (P 1, W 1, 2 pts). Shared by the admin and player views.
const EMPTY_FIX = { matchesPlayed: 0, wins: 0, losses: 0, draws: 0, totalPoints: 0, pointsDiff: 0 };

export const computeGroupStandings = (groups = [], matches = [], matchType) => {
  // playerId -> groupId, so the away side of a doubles fixture (which lives
  // in a different group) can be credited to the right group.
  const groupOfPlayer = {};
  groups.forEach((g) =>
    (g.standings ?? []).forEach((st) => {
      groupOfPlayer[String(st.playerId?._id ?? st.playerId)] = String(g._id);
    })
  );
  const idOf = (x) => (x ? String(x._id ?? x) : null);
  const isDoubles = matchType === "Doubles";
  const oneManSideFix = {};
  const addHalf = (groupId, result, ptsFor, ptsAgainst) => {
    if (!groupId) return;
    const f = (oneManSideFix[groupId] ??= { ...EMPTY_FIX });
    f.matchesPlayed += 0.5;
    if (result === "win") { f.wins += 0.5; f.totalPoints += 1; }
    else if (result === "draw") { f.draws += 0.5; f.totalPoints += 0.5; }
    else f.losses += 0.5;
    f.pointsDiff += (ptsFor - ptsAgainst) / 2;
  };
  matches.forEach((m) => {
    if (m.status !== "completed") return;
    const homeGroup = idOf(m.groupId) ?? groupOfPlayer[idOf(m.player1Id)];
    if (m.isBye) {
      addHalf(homeGroup, "win", 0, 0);
      return;
    }
    // Singles: both players sit in the same group, so the plain /2 is right.
    if (!isDoubles) return;
    const home = (m.sets ?? []).reduce((t, x) => t + (Number(x.home) || 0), 0);
    const away = (m.sets ?? []).reduce((t, x) => t + (Number(x.away) || 0), 0);
    const homeWon = idOf(m.winner) === idOf(m.player1Id);
    const homeResult = m.isDraw ? "draw" : homeWon ? "win" : "loss";
    const awayResult = m.isDraw ? "draw" : homeWon ? "loss" : "win";
    if (m.player1Id && !m.player1PartnerId) addHalf(homeGroup, homeResult, home, away);
    if (m.player2Id && !m.player2PartnerId) addHalf(groupOfPlayer[idOf(m.player2Id)], awayResult, away, home);
  });

  return groups.map((g) => {
    const players = g.standings ?? [];
    const sum = players.reduce(
      (acc, p) => ({
        wins:          acc.wins          + (p.wins          || 0),
        losses:        acc.losses        + (p.losses        || 0),
        draws:         acc.draws         + (p.draws         || 0),
        matchesPlayed: acc.matchesPlayed + (p.matchesPlayed || 0),
        totalPoints:   acc.totalPoints   + (p.totalPoints   || 0),
        pointsFor:     acc.pointsFor     + (p.pointsFor     || 0),
        pointsAgainst: acc.pointsAgainst + (p.pointsAgainst || 0),
      }),
      { wins: 0, losses: 0, draws: 0, matchesPlayed: 0, totalPoints: 0, pointsFor: 0, pointsAgainst: 0 }
    );
    const divisor = players.length > 0 ? 2 : 1;
    // Summing player rows and halving assumes every side had 2 players.
    // Walkovers (byes) and short-handed doubles sides have only 1, so
    // halving leaves them at 0.5 — add the missing half back so each one
    // counts as a full match (P 1, W 1, 2 pts).
    const fix = oneManSideFix[String(g._id)] ?? EMPTY_FIX;
    return {
      _id:           g._id,
      groupName:     g.groupName,
      matchesPlayed: sum.matchesPlayed / divisor + fix.matchesPlayed,
      wins:          sum.wins          / divisor + fix.wins,
      losses:        sum.losses        / divisor + fix.losses,
      draws:         sum.draws         / divisor + fix.draws,
      totalPoints:   sum.totalPoints   / divisor + fix.totalPoints,
      pointsDiff:    (sum.pointsFor - sum.pointsAgainst) / divisor + fix.pointsDiff,
    };
  }).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.pointsDiff - a.pointsDiff;
  });
};
