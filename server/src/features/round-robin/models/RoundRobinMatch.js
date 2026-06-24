const mongoose = require("mongoose");
const { Schema } = mongoose;

const SetSchema = new Schema({ home: Number, away: Number }, { _id: false });

const RoundRobinMatchSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "RoundRobinTournament",
      required: true,
    },
    groupId: { type: Schema.Types.ObjectId, ref: "RoundRobinGroup" },
    matchName: { type: String, required: true },
    player1Id: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer" },
    player1PartnerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    player2Id: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer" },
    player2PartnerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    court: { type: String, default: "" },
    scheduledTime: { type: Date },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    sets: [SetSchema],
    winner: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    loser: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    // True when a completed match ended in a draw (only possible for an
    // even-numbered "Best of N" format, e.g. Best of 2, tied on sets and
    // total points). Distinguishes a draw from a not-yet-decided match,
    // since `winner`/`loser` are both null in either case.
    isDraw: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinMatch", RoundRobinMatchSchema);
