const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoundRobinPlayerSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "RoundRobinTournament",
      required: true,
    },
    memberId: { type: Schema.Types.ObjectId, ref: "RoundRobinMember" },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    contact: { type: String, default: "" },
    grade: { type: String, default: "Unrated" },
  },
  { timestamps: true }
);

RoundRobinPlayerSchema.index({ tournamentId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("RoundRobinPlayer", RoundRobinPlayerSchema);
