const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    age: { type: Number, required: true },
    dateOfBirth: { type: Date, default: null },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    profilePhoto: { type: String, default: null }, // Cloud storage URL
    membershipType: {
      type: String,
      enum: ["STANDARD", "STUDENT", "VETERAN"],
      default: "STANDARD",
    },
    membershipStatus: {
      type: String,
      enum: ["ACTIVE", "PENDING_VERIFICATION", "EXPIRED", "SUSPENDED", "CANCELLED"],
      default: "PENDING_VERIFICATION",
    },
    membershipStartDate: { type: Date, default: Date.now },
    membershipExpiryDate: { type: Date, required: true },
    isVerified: { type: Boolean, default: false },
    verificationDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MemberDocument",
      default: null,
    },
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastBookingDate: { type: Date, default: null },
    preference: {
      notifyViaEmail: { type: Boolean, default: true },
      notifyViaSMS: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for quick lookups
memberSchema.index({ email: 1 });
memberSchema.index({ userId: 1 });
memberSchema.index({ membershipStatus: 1 });
memberSchema.index({ membershipExpiryDate: 1 });

const Member = mongoose.model("Member", memberSchema);
module.exports = Member;
