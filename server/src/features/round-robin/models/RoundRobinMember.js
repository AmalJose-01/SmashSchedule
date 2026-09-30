const mongoose = require("mongoose");
const { Schema } = mongoose;
const { clampMemberPoints } = require("../constants/grades");

const RoundRobinMemberSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    name: { type: String, required: true },
    grade: {
      type: String,
      // null = not graded yet (a player who joined from their own login and
      // is waiting for admin approval).
      enum: ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated", null],
      default: "Unrated",
    },
    // Always kept within 0–100 (see clampMemberPoints) — every write path
    // (match results, manual edits, imports) goes through this setter.
    points: { type: Number, default: 0, set: clampMemberPoints },
    email: { type: String, required: true, lowercase: true, trim: true },
    contact: { type: String, default: "" },
    nationalMemberId: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true },
    isMember: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    // "pending" = the player asked to join from their own account; the admin
    // must approve (and set a grade) before they appear in the Member Bank.
    // Members the admin adds directly are "approved" straight away.
    status: { type: String, enum: ["pending", "approved"], default: "approved" },
    // The player's login account, once linked (self-join, or matched by email).
    userId: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
  },
  { timestamps: true }
);

RoundRobinMemberSchema.index({ email: 1, adminId: 1 }, { unique: true });
RoundRobinMemberSchema.index({ userId: 1 });

module.exports = mongoose.model("RoundRobinMember", RoundRobinMemberSchema);
