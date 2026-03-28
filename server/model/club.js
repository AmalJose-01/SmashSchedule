const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      unique: true, // One club per admin
    },
    name: { type: String, default: "" },
    logo: { type: String, default: null }, // Cloudinary URL
    logoPublicId: { type: String, default: null },
    registrationNumber: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
      },
    },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 2dsphere index for geo proximity search
clubSchema.index({ "location.coordinates": "2dsphere" });
// Text index for name/city search
clubSchema.index({ name: "text", "location.city": "text", "location.state": "text" });

const Club = mongoose.model("Club", clubSchema);
module.exports = Club;
