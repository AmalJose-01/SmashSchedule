const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoundRobinTournamentSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    tournamentName: { type: String, required: true },
    status: {
      type: String,
      enum: ["Draft", "Active", "Scheduled", "Ongoing", "Completed"],
      default: "Draft",
    },
    matchType: { type: String, enum: ["Singles", "Doubles"], required: true },
    description: { type: String, default: "" },
    numberOfCourts: { type: Number, required: true },
    numberOfGroups: { type: Number, required: true },
    playersPerGroup: { type: Number, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    groupingStrategy: {
      type: String,
      enum: ["random", "by-grade", "balanced"],
      default: "random",
    },
    pointsForWin: { type: Number, default: 2 },
    pointsForLoss: { type: Number, default: 0 },
    groups: [{ type: Schema.Types.ObjectId, ref: "RoundRobinGroup" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinTournament", RoundRobinTournamentSchema);
