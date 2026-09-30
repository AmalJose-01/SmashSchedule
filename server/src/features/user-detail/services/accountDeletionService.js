// Permanently deletes a PLAYER account (accountType "user") and everything
// tied to it. Club admins' accounts are not handled here.
//
//  • Deleted: login account, profile (UserDetail), club round robin member
//    records, membership records + uploaded documents, registrations in round
//    robins that haven't been scheduled yet.
//  • Anonymised (kept, because other people's results depend on them):
//    registrations already used in a match schedule, group/standings names,
//    legacy tournament team entries.
//  • Payments: kept for tax/refunds/disputes but anonymised (no name/email).
const mongoose = require("mongoose");
const AdminUser = require("../../login-signup/model/adminUser");
const UserDetail = require("../models/UserDetail");
const RoundRobinMember = require("../../round-robin/models/RoundRobinMember");
const RoundRobinPlayer = require("../../round-robin/models/RoundRobinPlayer");
const RoundRobinMatch = require("../../round-robin/models/RoundRobinMatch");
const RoundRobinGroup = require("../../round-robin/models/RoundRobinGroup");
const RoundRobinPayment = require("../../round-robin/models/RoundRobinPayment");
const Member = require("../../../../model/member");
const Membership = require("../../../../model/membership");
const MemberDocument = require("../../../../model/memberDocument");
const Team = require("../../../../model/team");

const DELETED_NAME = "Deleted player";
const placeholderEmail = (id) => `deleted-${id}@deleted.invalid`;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const httpError = (status, message) => Object.assign(new Error(message), { status });

const deletePlayerAccount = async (userId) => {
  const account = await AdminUser.findById(userId).select("emailID accountType").lean();
  if (!account) throw httpError(404, "Account not found");
  if (account.accountType !== "user") {
    throw httpError(403, "Only player accounts can be deleted here. Contact support to close a club admin account.");
  }
  const email = String(account.emailID || "").toLowerCase().trim();
  const emailMatch = email ? { $regex: `^${escapeRegex(email)}$`, $options: "i" } : null;

  const session = await mongoose.startSession();
  const summary = { registrationsDeleted: 0, registrationsAnonymised: 0, clubMemberships: 0, memberships: 0, teams: 0 };
  try {
    await session.withTransaction(async () => {
      // ── Round robin: club member records + tournament registrations ──
      const members = await RoundRobinMember.find({
        $or: [{ userId }, ...(emailMatch ? [{ email: emailMatch }] : [])],
      }).select("_id").session(session);
      const memberIds = members.map((m) => m._id);

      const players = await RoundRobinPlayer.find({
        $or: [{ memberId: { $in: memberIds } }, ...(emailMatch ? [{ email: emailMatch }] : [])],
      }).select("_id").session(session);

      for (const { _id: playerId } of players) {
        const inSchedule = await RoundRobinMatch.exists({
          $or: [
            { player1Id: playerId }, { player1PartnerId: playerId },
            { player2Id: playerId }, { player2PartnerId: playerId },
          ],
        }).session(session);

        if (inSchedule) {
          // Other players' results reference this entry — keep it, strip identity.
          await RoundRobinPlayer.updateOne(
            { _id: playerId },
            { $set: { name: DELETED_NAME, email: placeholderEmail(playerId), contact: "" }, $unset: { memberId: "" } },
            { session }
          );
          await RoundRobinGroup.updateMany(
            { "players.playerId": playerId },
            { $set: { "players.$[p].name": DELETED_NAME } },
            { arrayFilters: [{ "p.playerId": playerId }], session }
          );
          await RoundRobinGroup.updateMany(
            { "standings.playerId": playerId },
            { $set: { "standings.$[s].name": DELETED_NAME } },
            { arrayFilters: [{ "s.playerId": playerId }], session }
          );
          summary.registrationsAnonymised += 1;
        } else {
          await RoundRobinGroup.updateMany(
            { "players.playerId": playerId },
            { $pull: { players: { playerId }, standings: { playerId } } },
            { session }
          );
          await RoundRobinPlayer.deleteOne({ _id: playerId }, { session });
          summary.registrationsDeleted += 1;
        }

        // Payments stay (tax/refunds/disputes) but lose the person's name.
        await RoundRobinPayment.updateMany({ playerId }, { $set: { playerName: DELETED_NAME } }, { session });
      }

      await RoundRobinPayment.updateMany({ memberId: { $in: memberIds } }, { $set: { playerName: DELETED_NAME } }, { session });
      const rrDel = await RoundRobinMember.deleteMany({ _id: { $in: memberIds } }, { session });
      summary.clubMemberships = rrDel.deletedCount;

      // ── Membership module (Member → Membership, MemberDocument) ──
      const legacyMembers = await Member.find({
        $or: [{ userId }, ...(emailMatch ? [{ email: emailMatch }] : [])],
      }).select("_id").session(session);
      const legacyIds = legacyMembers.map((m) => m._id);
      if (legacyIds.length) {
        await MemberDocument.deleteMany({ memberId: { $in: legacyIds } }, { session });
        await Membership.deleteMany({ memberId: { $in: legacyIds } }, { session });
        const mDel = await Member.deleteMany({ _id: { $in: legacyIds } }, { session });
        summary.memberships = mDel.deletedCount;
      }

      // ── Legacy knockout/group tournament teams (shared with a partner) ──
      if (emailMatch) {
        const p1 = await Team.updateMany(
          { playerOneEmail: emailMatch },
          { $set: { playerOneName: DELETED_NAME, playerOneEmail: "deleted@deleted.invalid", playerOneContact: "-", playerOneDOB: "-" } },
          { session, runValidators: false }
        );
        const p2 = await Team.updateMany(
          { playerTwoEmail: emailMatch },
          { $set: { playerTwoName: DELETED_NAME, playerTwoEmail: "deleted@deleted.invalid", playerTwoContact: "-", playerTwoDOB: "-" } },
          { session, runValidators: false }
        );
        summary.teams = p1.modifiedCount + p2.modifiedCount;
      }

      // ── Profile + login ──
      await UserDetail.deleteOne({ userId }, { session });
      await AdminUser.deleteOne({ _id: userId }, { session });
    });
  } finally {
    await session.endSession();
  }
  return summary;
};

module.exports = { deletePlayerAccount };
