const mongoose = require("mongoose");
const { Schema } = mongoose;
const { clampMemberPoints } = require("../constants/grades");

const RoundRobinMemberSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    name: { type: String, required: true },
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F", "G", "H", "Unrated"],
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
  },
  { timestamps: true }
);

RoundRobinMemberSchema.index({ email: 1, adminId: 1 }, { unique: true });

module.exports = mongoose.model("RoundRobinMember", RoundRobinMemberSchema);
