const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      unique: true,
    },
    membershipType: {
      type: String,
      enum: ["STANDARD", "STUDENT", "VETERAN"],
      default: "STANDARD",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_VERIFICATION", "EXPIRED", "SUSPENDED", "CANCELLED"],
      default: "PENDING_VERIFICATION",
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    renewalDate: { type: Date, default: null },
    membershipPrice: { type: Number, required: true },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    discountApplied: { type: Number, default: 0 }, // Percentage discount
    isAutoRenewal: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    approvalDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for quick lookups
membershipSchema.index({ memberId: 1 });
membershipSchema.index({ expiryDate: 1 });
membershipSchema.index({ status: 1 });

const Membership = mongoose.model("Membership", membershipSchema);
module.exports = Membership;
