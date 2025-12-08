const mongoose = require("mongoose");

const SetSchema = new mongoose.Schema({
  home: { type: Number, default: 0 },
  away: { type: Number, default: 0 },
});

const GameScoreSchema = new mongoose.Schema({
  sets: { type: [SetSchema], default: [] }, // e.g., 3 sets
});

const GroupMatchSchema = new mongoose.Schema({
  matchName: {type: String},
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  teamsHome: 
    { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  
  teamsAway: 
    { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  
  scheduledTime: Date,
  scores: [GameScoreSchema],
  status: { type: String, enum: ["scheduled","Ongoing", "finished"], default: "scheduled" },
});

const GroupMatch = mongoose.model("GroupMatch", GroupMatchSchema);
module.exports = GroupMatch;
