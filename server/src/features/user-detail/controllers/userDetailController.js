const UserDetail = require("../models/UserDetail");
const mongoose = require("mongoose");
const AdminUser = require("../../login-signup/model/adminUser");
const Club = require("../../../../model/club");

const CLUB_FIELDS = "name logo clubCode location.city location.state location.country phoneNumber email";

// Returns the player's clubs, newest first, dropping any whose club was deleted.
const listMyClubs = async (userId) => {
  const detail = await UserDetail.findOne({ userId })
    .populate("clubs.club", CLUB_FIELDS)
    .lean();
  return (detail?.clubs ?? [])
    .filter((c) => c.club)
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .map((c) => ({ ...c.club, isFavourite: !!c.isFavourite, addedAt: c.addedAt }));
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

module.exports = userDetailController;
