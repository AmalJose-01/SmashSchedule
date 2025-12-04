// models/KnockoutTeam.js
const mongoose = require("mongoose");

const KnockoutTeamSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  round: { type: Number, default: 1 },  // current knockout round
  status: { type: String, enum: ["active", "eliminated"], default: "active" }
});

const KnockoutTeam = mongoose.model("KnockoutTeam", KnockoutTeamSchema);
module.exports = KnockoutTeam;