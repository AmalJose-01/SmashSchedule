// Single source of truth for the grade ladder and the points system tied to
// it. Best→worst order matters: GRADE_ORDER[i] is one tier better than
// GRADE_ORDER[i+1] for every A–G pair (H/Unrated sit outside the points
// ladder — new/unrated members aren't auto-promoted/demoted).
const GRADE_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated"];

// Default starting points for a member of each grade, and also the
// threshold used to auto-promote/demote between adjacent tiers:
//   - drop to <= the next-worse grade's default → demoted to that grade
//   - rise to >= the next-better grade's default → promoted to that grade
const GRADE_DEFAULT_POINTS = {
  A: 80,
  B: 75,
  C: 60,
  D: 45,
  E: 30,
  F: 15,
  G: 0,
  H: 0,
  Unrated: 0,
};

// Points awarded/deducted per individual match outcome.
const POINTS_PER_WIN = 0.5;
const POINTS_PER_LOSS = 0.5; // subtracted

// Member points are capped: a member at the cap gains nothing more from a
// win, but losses still take points off. Floor is 0.
const MIN_MEMBER_POINTS = 0;
const MAX_MEMBER_POINTS = 100;

const clampMemberPoints = (value) => {
  // Pending (self-joined, not yet approved) members have no points yet.
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return MIN_MEMBER_POINTS;
  return Math.min(MAX_MEMBER_POINTS, Math.max(MIN_MEMBER_POINTS, Math.round(n * 10) / 10));
};

// Grades that participate in the auto promote/demote ladder (A–G only).
const RANKED_GRADES = ["A", "B", "C", "D", "E", "F", "G"];

module.exports = {
  GRADE_ORDER,
  GRADE_DEFAULT_POINTS,
  POINTS_PER_WIN,
  POINTS_PER_LOSS,
  RANKED_GRADES,
  MIN_MEMBER_POINTS,
  MAX_MEMBER_POINTS,
  clampMemberPoints,
};
