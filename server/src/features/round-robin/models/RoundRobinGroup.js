const mongoose = require("mongoose");
const { Schema } = mongoose;

const StandingSchema = new Schema(
  {
    playerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer" },
    name: { type: String },
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    pointsFor: { type: Number, default: 0 },
    pointsAgainst: { type: Number, default: 0 },
    pointsDiff: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
  },
  { _id: false }
);

const RoundRobinGroupSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "RoundRobinTournament",
      required: true,
    },
    groupName: { type: String, required: true },
    players: [
      {
        playerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer" },
        name: { type: String },
        _id: false,
      },
    ],
    standings: [StandingSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinGroup", RoundRobinGroupSchema);
