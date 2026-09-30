// Players joining a round robin from their own login.
// Same rules as the admin "Add Players" flow, plus the registration deadline:
//   • only before the schedule is finalized
//   • only before the registration deadline (when set)
//   • never beyond Number of Slots
//   • only approved club members with a grade
const RoundRobinTournament = require("../models/RoundRobinTournament");
const RoundRobinMember = require("../models/RoundRobinMember");
const RoundRobinPlayer = require("../models/RoundRobinPlayer");
const RoundRobinGroup = require("../models/RoundRobinGroup");
const AdminUser = require("../../login-signup/model/adminUser");

const LOCKED_STATUSES = ["Finalized", "Ongoing", "Completed"];

const REASONS = {
  joined: "You're registered for this round robin.",
  notJoined: "You're not registered for this round robin.",
  locked: "Registration is closed — the schedule has been finalized.",
  deadline: "Registration is closed — the deadline has passed.",
  full: "This round robin is full.",
  notMember: "Join this club's round robin (from My Clubs) to register.",
  pending: "Your club membership is waiting for admin approval.",
  noGrade: "The club admin needs to set your grade before you can register.",
};

const findMember = async (adminId, userId) => {
  const account = await AdminUser.findById(userId).select("emailID").lean();
  const email = account?.emailID?.toLowerCase();
  const member = await RoundRobinMember.findOne({
    adminId,
    isActive: true,
    $or: [{ userId }, ...(email ? [{ email }] : [])],
  });
  return { member, email };
};

/**
 * Slot counts and whether this user can join. `playerCount` may be passed in
 * when the caller already has it (e.g. from an aggregate over many events).
 */
const getJoinInfo = async (tournament, userId, { playerCount, member } = {}) => {
  const count = playerCount ?? (await RoundRobinPlayer.countDocuments({ tournamentId: tournament._id }));
  const slots = Number(tournament.numberOfSlots) > 0 ? Number(tournament.numberOfSlots) : null;
  const remaining = slots != null ? Math.max(0, slots - count) : null;

  const m = member !== undefined ? member : (await findMember(tournament.adminId, userId)).member;
  const joined = m
    ? !!(await RoundRobinPlayer.exists({ tournamentId: tournament._id, memberId: m._id }))
    : false;

  // After the deadline (or once the schedule is finalized) nothing can change:
  // no joining and no cancelling.
  const locked = LOCKED_STATUSES.includes(tournament.status);
  const deadlinePassed = !!tournament.registrationDeadline && new Date(tournament.registrationDeadline) <= new Date();
  const closed = locked || deadlinePassed;

  let reason = null;
  if (joined) reason = "joined";
  else if (locked) reason = "locked";
  else if (deadlinePassed) reason = "deadline";
  else if (remaining === 0) reason = "full";
  else if (!m) reason = "notMember";
  else if (m.status === "pending") reason = "pending";
  else if (!m.grade) reason = "noGrade";

  return {
    playerCount: count,
    slots,
    remaining,
    joined,
    canJoin: !reason,
    canCancel: joined && !closed,
    closed,
    // Schedule has been generated — joined players get "View matches".
    scheduled: locked,
    closedText: locked ? REASONS.locked : deadlinePassed ? REASONS.deadline : null,
    reason,
    reasonText: reason ? REASONS[reason] : null,
    registrationDeadline: tournament.registrationDeadline ?? null,
  };
};

/** Registers the signed-in player. Throws { status, message } on refusal. */
const joinRoundRobin = async (tournamentId, userId) => {
  const tournament = await RoundRobinTournament.findById(tournamentId).lean();
  if (!tournament) throw { status: 404, message: "Round robin not found" };

  const { member } = await findMember(tournament.adminId, userId);
  const info = await getJoinInfo(tournament, userId, { member });
  if (!info.canJoin) throw { status: info.reason === "joined" ? 409 : 400, message: info.reasonText, info };

  let player;
  try {
    player = await RoundRobinPlayer.create({
      tournamentId,
      memberId: member._id,
      name: member.name,
      email: member.email,
      contact: member.contact,
      grade: member.grade,
      isMember: member.isMember,
    });
  } catch (err) {
    if (err.code === 11000) throw { status: 409, message: REASONS.joined };
    throw err;
  }

  // Two players can press Join at the same moment for the last slot — if that
  // pushed us over, undo this registration.
  if (info.slots != null) {
    const count = await RoundRobinPlayer.countDocuments({ tournamentId });
    if (count > info.slots) {
      await RoundRobinPlayer.deleteOne({ _id: player._id });
      throw { status: 400, message: REASONS.full };
    }
  }

  return getJoinInfo(tournament, userId, { member });
};

/** Cancels the signed-in player's registration (only before the deadline). */
const leaveRoundRobin = async (tournamentId, userId) => {
  const tournament = await RoundRobinTournament.findById(tournamentId).lean();
  if (!tournament) throw { status: 404, message: "Round robin not found" };

  const { member } = await findMember(tournament.adminId, userId);
  const info = await getJoinInfo(tournament, userId, { member });
  if (!info.joined) throw { status: 400, message: REASONS.notJoined, info };
  if (!info.canCancel) throw { status: 400, message: info.closedText || "Registration can no longer be changed.", info };

  const player = await RoundRobinPlayer.findOneAndDelete({ tournamentId, memberId: member._id });
  // Groups may already be generated (before finalize) — take them out there too.
  if (player) {
    await RoundRobinGroup.updateMany({ tournamentId }, { $pull: { players: { playerId: player._id } } });
  }

  return getJoinInfo(tournament, userId, { member });
};

module.exports = { getJoinInfo, joinRoundRobin, leaveRoundRobin, findMember };
