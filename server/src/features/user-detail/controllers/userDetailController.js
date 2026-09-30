const UserDetail = require("../models/UserDetail");
const { deletePlayerAccount } = require("../services/accountDeletionService");
const mongoose = require("mongoose");
const AdminUser = require("../../login-signup/model/adminUser");
const Club = require("../../../../model/club");
const { isValidPhone, INVALID_PHONE_MESSAGE } = require("../../../../utils/phone");
const RoundRobinMember = require("../../round-robin/models/RoundRobinMember");

const CLUB_FIELDS = "name logo clubCode adminId location.city location.state location.country phoneNumber email";

// Returns the player's clubs, newest first, dropping any whose club was
// deleted. Each club carries roundRobinStatus: "none" | "pending" | "approved".
const listMyClubs = async (userId) => {
  const [detail, account] = await Promise.all([
    UserDetail.findOne({ userId }).populate("clubs.club", CLUB_FIELDS).lean(),
    AdminUser.findById(userId).select("emailID").lean(),
  ]);
  const clubs = (detail?.clubs ?? []).filter((c) => c.club);
  const adminIds = clubs.map((c) => c.club.adminId).filter(Boolean);
  const email = account?.emailID?.toLowerCase();
  const members = adminIds.length
    ? await RoundRobinMember.find({
        adminId: { $in: adminIds },
        isActive: true,
        $or: [{ userId }, ...(email ? [{ email }] : [])],
      })
        .select("adminId status")
        .lean()
    : [];
  const statusByAdmin = new Map(members.map((m) => [String(m.adminId), m.status || "approved"]));

  return clubs
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .map((c) => {
      const { adminId, ...club } = c.club; // don't send the admin's id to players
      return {
        ...club,
        isFavourite: !!c.isFavourite,
        addedAt: c.addedAt,
        roundRobinStatus: statusByAdmin.get(String(adminId)) ?? "none",
      };
    });
};

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

const toResponse = (detail, account) => ({
  name:
    detail?.name ||
    [account?.firstName, account?.lastName].filter(Boolean).join(" ") ||
    "",
  email: account?.emailID || "", // login email — read-only, lives on the account
  contact: detail?.contact || "",
  gender: detail?.gender || "",
  dateOfBirth: detail?.dateOfBirth || null,
  nationalMemberId: detail?.nationalMemberId || "",
  updatedAt: detail?.updatedAt || null,
  isSaved: !!detail,
});

// Copies profile changes onto the player's RoundRobinMember records: ones
// already linked to this account, plus any with the same login email (which
// get linked now). Only fields the player actually changed are written.
const syncRoundRobinMembers = async (userId, email, update) => {
  const fields = {};
  if (update.name !== undefined) fields.name = update.name;
  if (update.contact !== undefined) fields.contact = update.contact;
  if (update.gender !== undefined) fields.gender = update.gender;
  if (update.dateOfBirth !== undefined) fields.dateOfBirth = update.dateOfBirth;
  if (update.nationalMemberId !== undefined) fields.nationalMemberId = update.nationalMemberId;
  if (!Object.keys(fields).length) return;
  try {
    await RoundRobinMember.updateMany(
      { $or: [{ userId }, ...(email ? [{ email: email.toLowerCase() }] : [])] },
      { $set: { ...fields, userId } }
    );
  } catch (err) {
    // Profile itself is saved; a sync hiccup shouldn't fail the request.
    console.error("round robin member sync failed:", err);
  }
};

const userDetailController = {
  // GET /user-detail/me
  getMyDetail: async (req, res) => {
    try {
      const [detail, account] = await Promise.all([
        UserDetail.findOne({ userId: req.userId }).lean(),
        AdminUser.findById(req.userId).select("firstName lastName emailID").lean(),
      ]);
      return res.status(200).json({ data: toResponse(detail, account) });
    } catch (error) {
      console.error("getMyDetail error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // PUT /user-detail/me — create or update the signed-in user's details
  upsertMyDetail: async (req, res) => {
    try {
      const { name, contact, gender, dateOfBirth, nationalMemberId } = req.body;

      if (name !== undefined && !String(name).trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      if (contact !== undefined && !isValidPhone(contact)) {
        return res.status(400).json({ message: INVALID_PHONE_MESSAGE });
      }
      if (gender && !GENDERS.includes(gender)) {
        return res.status(400).json({ message: "Invalid gender" });
      }
      let dob = undefined;
      if (dateOfBirth !== undefined) {
        dob = dateOfBirth ? new Date(dateOfBirth) : null;
        if (dob && (Number.isNaN(dob.getTime()) || dob > new Date())) {
          return res.status(400).json({ message: "Invalid date of birth" });
        }
      }

      const update = {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(contact !== undefined && { contact }),
        ...(gender !== undefined && { gender }),
        ...(dob !== undefined && { dateOfBirth: dob }),
        ...(nationalMemberId !== undefined && { nationalMemberId }),
      };

      const detail = await UserDetail.findOneAndUpdate(
        { userId: req.userId },
        { $set: update },
        { new: true, upsert: true, runValidators: true }
      ).lean();
      const account = await AdminUser.findById(req.userId).select("firstName lastName emailID").lean();

      // Keep the player's round robin member records (every club) in sync with
      // their profile. Grade, points and membership stay admin-managed.
      await syncRoundRobinMembers(req.userId, account?.emailID, update);

      return res.status(200).json({ message: "Profile saved", data: toResponse(detail, account) });
    } catch (error) {
      console.error("upsertMyDetail error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /user-detail/clubs
  getMyClubs: async (req, res) => {
    try {
      return res.status(200).json({ data: await listMyClubs(req.userId) });
    } catch (error) {
      console.error("getMyClubs error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // POST /user-detail/clubs  { clubId }
  addMyClub: async (req, res) => {
    try {
      const { clubId } = req.body;
      if (!mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ message: "Invalid club" });
      }
      if (!(await Club.exists({ _id: clubId }))) {
        return res.status(404).json({ message: "Club not found" });
      }
      // Upsert the detail doc, then add the club only if it isn't there yet.
      await UserDetail.updateOne({ userId: req.userId }, { $setOnInsert: { userId: req.userId } }, { upsert: true });
      await UserDetail.updateOne(
        { userId: req.userId, "clubs.club": { $ne: clubId } },
        { $push: { clubs: { club: clubId, isFavourite: false, addedAt: new Date() } } }
      );
      return res.status(200).json({ message: "Added to My Clubs", data: await listMyClubs(req.userId) });
    } catch (error) {
      console.error("addMyClub error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // POST /user-detail/clubs/:clubId/join-round-robin
  // Adds the player to the club's round robin Member Bank as "pending" (no
  // grade/points) for the admin to approve. If the club already has a member
  // with the player's email, that record is linked to this account instead.
  joinClubRoundRobin: async (req, res) => {
    try {
      const { clubId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ message: "Invalid club" });
      }
      const club = await Club.findById(clubId).select("adminId").lean();
      if (!club) return res.status(404).json({ message: "Club not found" });

      const [account, detail] = await Promise.all([
        AdminUser.findById(req.userId).select("firstName lastName emailID").lean(),
        UserDetail.findOne({ userId: req.userId }).lean(),
      ]);
      const email = account?.emailID?.toLowerCase();
      if (!email) return res.status(400).json({ message: "Your account has no email" });

      // Include inactive (removed) records too, so we reuse rather than clash
      // with the unique (email, admin) index.
      let member = await RoundRobinMember.findOne({ adminId: club.adminId, email });
      if (member && member.isActive) {
        if (!member.userId) {
          member.userId = req.userId;
          await member.save();
        }
        return res.status(200).json({
          message: member.status === "pending" ? "Your request is waiting for approval" : "You're already a member of this club's round robin",
          data: { status: member.status || "approved" },
        });
      }

      const name =
        detail?.name ||
        [account.firstName, account.lastName].filter(Boolean).join(" ") ||
        email.split("@")[0];
      const personal = {
        name,
        contact: detail?.contact || "",
        ...(detail?.gender && { gender: detail.gender }),
        ...(detail?.dateOfBirth && { dateOfBirth: detail.dateOfBirth }),
        ...(detail?.nationalMemberId && { nationalMemberId: detail.nationalMemberId }),
      };

      if (member) {
        // Previously removed member re-joining: back to pending for approval.
        Object.assign(member, personal, { isActive: true, status: "pending", userId: req.userId, grade: null, points: null, isMember: null });
        await member.save();
      } else {
        member = await RoundRobinMember.create({
          adminId: club.adminId,
          email,
          ...personal,
          grade: null,
          points: null,
          isMember: null, // admin sets Member / Non-Member on approval
          status: "pending",
          userId: req.userId,
        });
      }

      // Make sure the club is in their list too.
      await UserDetail.updateOne({ userId: req.userId }, { $setOnInsert: { userId: req.userId } }, { upsert: true });
      await UserDetail.updateOne(
        { userId: req.userId, "clubs.club": { $ne: clubId } },
        { $push: { clubs: { club: clubId, isFavourite: false, addedAt: new Date() } } }
      );

      return res.status(201).json({ message: "Request sent — the club admin will approve it", data: { status: "pending" } });
    } catch (error) {
      console.error("joinClubRoundRobin error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // PATCH /user-detail/clubs/:clubId  { isFavourite }
  setClubFavourite: async (req, res) => {
    try {
      const { clubId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ message: "Invalid club" });
      }
      const result = await UserDetail.updateOne(
        { userId: req.userId, "clubs.club": clubId },
        { $set: { "clubs.$.isFavourite": !!req.body.isFavourite } }
      );
      if (!result.matchedCount) return res.status(404).json({ message: "Club isn't in My Clubs" });
      return res.status(200).json({ data: await listMyClubs(req.userId) });
    } catch (error) {
      console.error("setClubFavourite error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // DELETE /user-detail/clubs/:clubId — removes it from the player's list only
  removeMyClub: async (req, res) => {
    try {
      const { clubId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ message: "Invalid club" });
      }
      await UserDetail.updateOne({ userId: req.userId }, { $pull: { clubs: { club: clubId } } });
      return res.status(200).json({ message: "Removed from My Clubs", data: await listMyClubs(req.userId) });
    } catch (error) {
      console.error("removeMyClub error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

// DELETE /user-detail/account — player permanently deletes their account and
// all related data. Body must include { confirm: "DELETE" }.
userDetailController.deleteMyAccount = async (req, res) => {
  try {
    if (req.body?.confirm !== "DELETE") {
      return res.status(400).json({ message: 'Type DELETE to confirm account deletion.' });
    }
    const summary = await deletePlayerAccount(req.userId);
    return res.status(200).json({ message: "Your account and data have been deleted.", data: summary });
  } catch (error) {
    if (error?.status) return res.status(error.status).json({ message: error.message });
    console.error("deleteMyAccount error:", error);
    return res.status(500).json({ message: "Could not delete your account. Please try again." });
  }
};

module.exports = userDetailController;
