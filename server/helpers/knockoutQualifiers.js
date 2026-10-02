// Pick the teams/players that go into the knockout bracket.
//
// A knockout bracket only works with a power of 2 (2, 4, 8, 16, 32...).
// 1. Take the top N ("Qualified to Knockout") from every group.
// 2. Round the bracket UP to the next power of 2 and fill the empty places
//    with the next-best teams from all groups: every 3rd place first, then
//    4th places, ... — within the same place by points, then point difference.
//    e.g. 19 players, groups of 4 → 5 groups → top 2 = 10 → bracket of 16
//         → + all five 3rd places + the best 4th place = 16 → 8 matches.
// 3. If there aren't enough players in total to reach that size, the
//    bracket is the largest power of 2 that fits, keeping the best-ranked.

const byStrength = (a, b) =>
  a.rank - b.rank || // better group position first
  b.totalPoints - a.totalPoints ||
  b.pointsDiff - a.pointsDiff;

const nextPow2 = (n) => (n <= 1 ? (n === 1 ? 2 : 0) : 2 ** Math.ceil(Math.log2(n)));
const prevPow2 = (n) => (n < 2 ? 0 : 2 ** Math.floor(Math.log2(n)));

const selectKnockoutQualifiers = (groups, perGroup) => {
  const perGroupN = Math.max(1, Number(perGroup) || 1);
  const everyone = [];

  for (const group of groups) {
    const standings = (group.standings || []).map((standing) => {
      const team = (group.teams || []).find(
        (t) => String(t.teamId) === String(standing.teamId)
      );
      return {
        name: team ? team.name : "Unknown Team",
        teamId: team ? team.teamId : standing.teamId,
        groupName: group.groupName,
        totalPoints: Number(standing.totalPoints) || 0,
        pointsDiff:
          Number(standing.pointsDiff) ||
          (Number(standing.pointsFor) || 0) - (Number(standing.pointsAgainst) || 0),
      };
    });

    standings
      .sort((a, b) => b.totalPoints - a.totalPoints || b.pointsDiff - a.pointsDiff)
      .forEach((t, idx) => everyone.push({ ...t, rank: idx + 1 })); // rank inside the group
  }

  const direct = everyone.filter((t) => t.rank <= perGroupN);
  const others = everyone.filter((t) => t.rank > perGroupN).sort(byStrength);

  let size = nextPow2(direct.length);
  if (size > everyone.length) size = prevPow2(everyone.length);

  const qualified =
    size >= direct.length
      ? [...direct, ...others.slice(0, size - direct.length)]
      : direct.sort(byStrength).slice(0, size); // not enough players overall

  return { qualified, size };
};

// Round numbers used by the app: 1 = Round of 16, 2 = QF, 3 = SF, 4 = Final.
// A 32 bracket starts at 0 ("Round of 32").
const roundNumberForSize = (size) => ({ 32: 0, 16: 1, 8: 2, 4: 3, 2: 4 }[size] ?? 1);

module.exports = { selectKnockoutQualifiers, roundNumberForSize, nextPow2, prevPow2 };
