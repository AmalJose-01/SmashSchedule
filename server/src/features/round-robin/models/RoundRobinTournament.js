const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoundRobinTournamentSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    tournamentName: { type: String, required: true },
    status: {
      type: String,
      enum: ["Draft", "Active", "Scheduled", "Finalized", "Ongoing", "Completed"],
      default: "Draft",
    },
    matchType: { type: String, enum: ["Singles", "Doubles"], required: true },
    // "Balanced" is the original grouped-round-robin format (fixed groups,
    // full round robin per group via the circle method — matchGenerationService.js).
    // "Graded" auto-groups players by their profile grade every night
    // (cascading odd-count borrow + merge, one court allocation across
    // grade groups) and schedules each group with the slot-based queue
    // engine (queueRoundRobinEngine.js / gradedRoundRobinEngine.js) instead
    // of manually-created groups. numberOfGroups/playersPerGroup/
    // groupingStrategy below only apply to "Balanced"; gradeOrder only
    // applies to "Graded".
    format: { type: String, enum: ["Balanced", "Graded"], default: "Balanced" },
    description: { type: String, default: "" },
    numberOfCourts: { type: Number, required: true },
    numberOfGroups: { type: Number, required: function () { return this.format !== "Graded"; } },
    playersPerGroup: { type: Number, required: function () { return this.format !== "Graded"; } },
    numberOfMatchesPerMember: { type: Number, default: 3 },
    startDate: { type: Date },
    endDate: { type: Date },
    groupingStrategy: {
      type: String,
      enum: ["random", "by-grade", "balanced"],
      default: "random",
    },
    // Graded format only: override the app-wide ranked grade ladder
    // (constants/grades.js RANKED_GRADES) for this tournament, best -> worst.
    // Leave unset to use the app default.
    gradeOrder: { type: [String], default: undefined },
    pointsForWin: { type: Number, default: 2 },
    pointsForLoss: { type: Number, default: 0 },
    entryFee: { type: Number, default: 0 }, // legacy single fee, kept for old records; superseded by the two fields below
    entryFeeMember: { type: Number, default: 0 }, // in dollars; 0 = no payment required
    entryFeeNonMember: { type: Number, default: 0 }, // in dollars; 0 = no payment required
    numberOfSets: { type: Number, default: 3 },
    setWinningPoint: { type: Number, default: 21 },
    winningPointGap: { type: Number, default: 2 },
    groups: [{ type: Schema.Types.ObjectId, ref: "RoundRobinGroup" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinTournament", RoundRobinTournamentSchema);
