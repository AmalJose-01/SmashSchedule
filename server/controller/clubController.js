const Club = require("../model/club");
const AdminUser = require("../model/adminUser");
const cloudinary = require("cloudinary").v2;

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

      if (!club) {
        // Return empty profile scaffold
        const admin = await AdminUser.findById(req.userId).select("emailID").lean();
        return res.status(200).json({
          club: null,
          email: admin?.emailID || "",
          isProfileComplete: false,
        });
      }

      return res.status(200).json({ club, isProfileComplete: club.isProfileComplete });
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

      let club = await Club.findOneAndUpdate(
        { adminId: req.userId },
        { $set: updateData },
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
