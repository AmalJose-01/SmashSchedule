const mongoose = require("mongoose");

const membershipTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["STANDARD", "STUDENT", "VETERAN"],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    displayName: { type: String, required: true }, // "Standard", "Student", "Veteran"
    description: { type: String, default: "" },
    price: { type: Number, required: true }, // Annual membership price
    discountPercentage: { type: Number, default: 0 },
    validityMonths: { type: Number, default: 12 }, // Membership validity in months
    requiresDocumentVerification: { type: Boolean, default: false },
    requiredDocumentType: {
      type: [String],
      enum: ["STUDENT_ID", "GOVERNMENT_ID", "VETERAN_PROOF"],
      default: [],
    },
    benefits: [
      {
        title: String,
        description: String,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Each admin can only have one of each type name
membershipTypeSchema.index({ name: 1, createdBy: 1 }, { unique: true });

const MembershipType = mongoose.model("MembershipType", membershipTypeSchema);
module.exports = MembershipType;
