const RoundRobinMember = require("../models/RoundRobinMember");
const {
  GRADE_DEFAULT_POINTS,
  POINTS_PER_WIN,
  POINTS_PER_LOSS,
  RANKED_GRADES,
} = require("../constants/grades");

// Walks a member up/down the ranked ladder (A-G) until their grade matches
// their points, per the confirmed rule: promote when points reach the
// next-better grade's default, demote when points fall to <= the
// next-worse grade's default. H/Unrated are outside the ladder and never
// auto-transition.
const applyGradeTransition = (member) => {
  let idx = RANKED_GRADES.indexOf(member.grade);
  if (idx === -1) return;

  let changed = true;
  let guard = 0;
  while (changed && guard < RANKED_GRADES.length) {
    changed = false;
    guard++;

    if (idx > 0) {
      const betterGrade = RANKED_GRADES[idx - 1];
      if (member.points >= GRADE_DEFAULT_POINTS[betterGrade]) {
        idx -= 1;
        changed = true;
        continue;
      }
    }

    if (idx < RANKED_GRADES.length - 1) {
      const worseGrade = RANKED_GRADES[idx + 1];
      if (member.points <= GRADE_DEFAULT_POINTS[worseGrade]) {
        idx += 1;
        changed = true;
        continue;
      }
    }
  }

  member.grade = RANKED_GRADES[idx];
};

const adjustMemberPoints = async (memberId, delta) => {
  if (!memberId) return;
  const member = await RoundRobinMember.findById(memberId);
  if (!member) return;

  const updated = Math.round((member.points + delta) * 10) / 10;
  member.points = Math.max(0, updated);
  applyGradeTransition(member);
  await member.save();
};

const getPlayerSides = (match) => ({
  homePlayers: [match.player1Id, match.player1PartnerId].filter(Boolean),
  awayPlayers: [match.player2Id, match.player2PartnerId].filter(Boolean),
});

// Derive "home" | "away" | null from an already-persisted match doc — used
// on score reset, where we no longer have the freshly-computed winner side
// on hand and have to read it back off the stored winner/isDraw fields.
const getWinnerSideFromMatch = (match) => {
  if (match.isDraw || !match.winner) return null;
  const player1Id = String(match.player1Id?._id || match.player1Id || "");
  const winnerId = String(match.winner?._id || match.winner || "");
  return player1Id === winnerId ? "home" : "away";
};

// direction: 1 to apply points for a newly-finished match, -1 to reverse
// them (e.g. an admin resets a previously recorded score). Draws and
// undecided matches never change points.
const applyMatchPoints = async (match, winnerSide, direction = 1) => {
  if (winnerSide !== "home" && winnerSide !== "away") return;

  const { homePlayers, awayPlayers } = getPlayerSides(match);
  const winningPlayers = winnerSide === "home" ? homePlayers : awayPlayers;
  const losingPlayers = winnerSide === "home" ? awayPlayers : homePlayers;

  for (const player of winningPlayers) {
    await adjustMemberPoints(player.memberId, POINTS_PER_WIN * direction);
  }
  for (const player of losingPlayers) {
    await adjustMemberPoints(player.memberId, -POINTS_PER_LOSS * direction);
  }
};

module.exports = {
  applyMatchPoints,
  adjustMemberPoints,
  getWinnerSideFromMatch,
  applyGradeTransition,
};
