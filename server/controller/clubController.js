const Club = require("../model/club");
const AdminUser = require("../model/adminUser");
const Tournament = require("../model/tournamentModel");
const RoundRobinTournament = require("../src/features/round-robin/models/RoundRobinTournament");
const mongoose = require("mongoose");
const { sortEvents, tournamentDate } = require("../utils/eventSort");
const RoundRobinPlayer = require("../src/features/round-robin/models/RoundRobinPlayer");
const { getJoinInfo, findMember } = require("../src/features/round-robin/services/playerJoinService");
const cloudinary = require("cloudinary").v2;
const {
  generateUniqueClubCode,
  normaliseClubCode,
  isClubCodeShape,
  ensureClubWithCode,
} = require("../utils/clubCode");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: check if a club profile is complete
const checkProfileComplete = (club) => {
  return !!(club.name && club.phoneNumber && club.location?.city);
};

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const clubController = {

  // ========== GET MY CLUB PROFILE (Admin) ==========
  getMyClubProfile: async (req, res) => {
    try {
      let club = await Club.findOne({ adminId: req.userId }).lean();
      const admin = await AdminUser.findById(req.userId).select("emailID").lean();

      if (!club) {
        // Return empty profile scaffold
        return res.status(200).json({
          club: null,
          email: admin?.emailID || "",
          isProfileComplete: false,
        });
      }

      return res.status(200).json({
        club,
        email: admin?.emailID || "",
        isProfileComplete: club.isProfileComplete,
      });
    } catch (error) {
      console.error("getMyClubProfile error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== CREATE OR UPDATE CLUB PROFILE (Admin) ==========
  upsertClubProfile: async (req, res) => {
    try {
      const { name, registrationNumber, phoneNumber, email, location } = req.body;

      const updateData = {
        adminId: req.userId,
        ...(name !== undefined && { name }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(email !== undefined && { email }),
      };

      // Use dot-notation for location fields so the coordinates subdoc is not overwritten
      if (location !== undefined) {
        if (location.address !== undefined) updateData["location.address"] = location.address;
        if (location.city !== undefined) updateData["location.city"] = location.city;
        if (location.state !== undefined) updateData["location.state"] = location.state;
        if (location.zipCode !== undefined) updateData["location.zipCode"] = location.zipCode;
        if (location.country !== undefined) updateData["location.country"] = location.country;
        if (location.coordinates) updateData["location.coordinates"] = location.coordinates;
      }

      // A club created here for the first time also gets its code.
      const hasClub = await Club.exists({ adminId: req.userId });
      let club = await Club.findOneAndUpdate(
        { adminId: req.userId },
        {
          $set: updateData,
          ...(!hasClub && { $setOnInsert: { clubCode: await generateUniqueClubCode(Club) } }),
        },
        { new: true, upsert: true }
      );

      club.isProfileComplete = checkProfileComplete(club);
      await club.save();

      return res.status(200).json({
        message: "Club profile saved successfully",
        club,
        isProfileComplete: club.isProfileComplete,
      });
    } catch (error) {
      console.error("upsertClubProfile error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== UPLOAD CLUB LOGO (Admin) ==========
  uploadClubLogo: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Only JPG, PNG, WEBP are allowed" });
      }

      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "Logo must be under 2MB" });
      }

      // Delete old logo if exists
      const existing = await Club.findOne({ adminId: req.userId });
      if (existing?.logoPublicId) {
        await cloudinary.uploader.destroy(existing.logoPublicId).catch(() => {});
      }

      const result = await uploadToCloudinary(req.file.buffer, "club-logos");

      const club = await Club.findOneAndUpdate(
        { adminId: req.userId },
        { $set: { logo: result.secure_url, logoPublicId: result.public_id } },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        message: "Logo uploaded successfully",
        logo: result.secure_url,
        club,
      });
    } catch (error) {
      console.error("uploadClubLogo error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GENERATE CLUB CODE (Admin) ==========
  // For admins created before club codes existed. Idempotent: if the club
  // already has a code it's returned unchanged, never replaced.
  generateClubCode: async (req, res) => {
    try {
      const club = await ensureClubWithCode(Club, req.userId);
      return res.status(200).json({ message: "Club key ready", clubCode: club.clubCode, club });
    } catch (error) {
      console.error("generateClubCode error:", error);
      return res.status(500).json({ message: "Could not generate club key" });
    }
  },

  // ========== GET CLUB BY CODE (Public - for users) ==========
  getClubByCode: async (req, res) => {
    try {
      const code = normaliseClubCode(req.params.code);
      if (!isClubCodeShape(code)) {
        return res.status(400).json({ message: "Club key must be 8 letters/numbers" });
      }
      const club = await Club.findOne({ clubCode: code }).lean();
      if (!club) return res.status(404).json({ message: "No club found with that key" });
      return res.status(200).json({ club });
    } catch (error) {
      console.error("getClubByCode error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== SEARCH CLUBS (Public - for users) ==========
  searchClubs: async (req, res) => {
    try {
      const { q, lat, lng, radius = 50 } = req.query;

      let query = { isProfileComplete: true };

      if (lat && lng) {
        // Geo proximity search (radius in km)
        const clubs = await Club.find({
          ...query,
          "location.coordinates": {
            $near: {
              $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: parseFloat(radius) * 1000, // convert km to metres
            },
          },
          ...(q && { $text: { $search: q } }),
        })
          .limit(20)
          .lean();

        return res.status(200).json({ clubs });
      }

      if (q) {
        // Exact club key match (8 chars) wins — show just that club.
        if (isClubCodeShape(q)) {
          const byCode = await Club.findOne({ clubCode: normaliseClubCode(q) }).lean();
          if (byCode) return res.status(200).json({ clubs: [byCode] });
        }

        // Text search by name or city
        const clubs = await Club.find({
          ...query,
          $or: [
            { name: { $regex: q, $options: "i" } },
            { "location.city": { $regex: q, $options: "i" } },
            { "location.state": { $regex: q, $options: "i" } },
          ],
        })
          .limit(20)
          .lean();

        return res.status(200).json({ clubs });
      }

      // No filter — return all complete clubs
      const clubs = await Club.find(query).sort({ name: 1 }).limit(50).lean();
      return res.status(200).json({ clubs });
    } catch (error) {
      console.error("searchClubs error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== CLUB EVENTS (for players) ==========
  // Tournaments + round robins run by the club's admin. Includes Draft round
  // robins — a round robin stays "Draft" from creation until its matches are
  // finalized, which is exactly when players want to see it's coming up.
  getClubEvents: async (req, res) => {
    try {
      const { clubId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ message: "Invalid club" });
      }
      const club = await Club.findById(clubId).select("adminId").lean();
      if (!club) return res.status(404).json({ message: "Club not found" });

      const [tournaments, roundRobins] = await Promise.all([
        Tournament.aggregate([
          { $match: { adminId: club.adminId } },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              tournamentName: 1, numberOfPlayersQualifiedToKnockout: 1, date: 1, time: 1,
              status: 1, registrationFee: 1, maximumParticipants: 1, uniqueKey: 1, matchType: 1, location: 1,
            },
          },
          { $lookup: { from: "teams", localField: "_id", foreignField: "tournamentId", as: "teams" } },
          { $addFields: { registeredTeamsCount: { $size: "$teams" } } },
          { $project: { teams: 0 } },
        ]),
        RoundRobinTournament.find({ adminId: club.adminId })
          .select("tournamentName matchType status startDate endDate registrationDeadline numberOfSlots numberOfCourts adminId")
          .sort({ startDate: -1, createdAt: -1 })
          .lean(),
      ]);

      // Slots used / left and whether this player can join each round robin.
      const counts = roundRobins.length
        ? await RoundRobinPlayer.aggregate([
            { $match: { tournamentId: { $in: roundRobins.map((r) => r._id) } } },
            { $group: { _id: "$tournamentId", n: { $sum: 1 } } },
          ])
        : [];
      const countBy = new Map(counts.map((c) => [String(c._id), c.n]));
      const { member } = await findMember(club.adminId, req.userId);
      const roundRobinsWithJoin = await Promise.all(
        roundRobins.map(async (r) => {
          const join = await getJoinInfo(r, req.userId, { playerCount: countBy.get(String(r._id)) ?? 0, member });
          const { adminId, ...rest } = r;
          return { ...rest, join };
        })
      );

      // Events change often (new round robins, status updates) — never let the
      // browser reuse a cached copy (that's what produced 304 Not Modified).
      res.set("Cache-Control", "no-store");
      return res.status(200).json({
        // Latest first; same day → later end first; otherwise by name.
        tournaments: sortEvents(tournaments, (t) => ({ start: tournamentDate(t), end: tournamentDate(t), name: t.tournamentName })),
        roundRobins: sortEvents(roundRobinsWithJoin, (r) => ({ start: r.startDate, end: r.endDate, name: r.tournamentName })),
      });
    } catch (error) {
      console.error("getClubEvents error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GET CLUB BY ID (Public) ==========
  getClubById: async (req, res) => {
    try {
      const club = await Club.findById(req.params.clubId).lean();
      if (!club) return res.status(404).json({ message: "Club not found" });
      return res.status(200).json({ club });
    } catch (error) {
      console.error("getClubById error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = clubController;
