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
    // ── Stripe Connect (club payouts) ──────────────────────────────────
    // Each club gets an Express connected account under the Webfluence
    // platform. Players pay through Stripe Checkout (destination charge);
    // the club's share pays out to its own BSB + account number, entered on
    // Stripe's hosted onboarding (never stored here).
    stripeAccountId: { type: String, default: null, index: true, sparse: true },
    stripeChargesEnabled: { type: Boolean, default: false },
    stripePayoutsEnabled: { type: Boolean, default: false },
    stripeDetailsSubmitted: { type: Boolean, default: false },
    // Platform fee in basis points (100 = 1%). Overridable per club.
    platformFeeBps: { type: Number, default: 100, min: 0, max: 5000 },
    isProfileComplete: { type: Boolean, default: false },
    // Unique 8-char key players use to find this club (typed or via QR).
    // Generated at admin sign-up; older clubs get one from the
    // "Generate key" button on the Club Profile page.
    clubCode: { type: String, uppercase: true, trim: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

// 2dsphere index for geo proximity search
clubSchema.index({ "location.coordinates": "2dsphere" });
// Text index for name/city search
clubSchema.index({ name: "text", "location.city": "text", "location.state": "text" });

const Club = mongoose.model("Club", clubSchema);
module.exports = Club;
