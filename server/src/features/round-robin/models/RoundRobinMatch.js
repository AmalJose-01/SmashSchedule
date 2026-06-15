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
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinMatch", RoundRobinMatchSchema);
