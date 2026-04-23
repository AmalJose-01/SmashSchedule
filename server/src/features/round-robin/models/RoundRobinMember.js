const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoundRobinMemberSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    name: { type: String, required: true },
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "Unrated"],
      required: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contact: { type: String, default: "" },
    nationalMemberId: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true },
    isMember: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinMember", RoundRobinMemberSchema);
