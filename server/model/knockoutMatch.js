// models/KnockoutMatch.js
const mongoose = require("mongoose");

const SetSchema = new mongoose.Schema({
  home: { type: Number, default: 0 },
  away: { type: Number, default: 0 }
});

const KnockoutMatchSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
  round: { type: Number, required: true },
  teamsHome: {
    teamId: { type: String, required: true },
    teamName: { type: String, required: true }
  },
  teamsAway: {
    teamId: { type: String, required: true },
    teamName: { type: String, required: true }
  },
  scores: { type: [SetSchema], default: [] },
  status: { type: String, enum: ["scheduled","Ongoing", "finished"], default: "scheduled" },
  winner: { type: String, default: null }
});

const KnockoutMatch = mongoose.model("KnockoutMatch", KnockoutMatchSchema);
module.exports = KnockoutMatch;
