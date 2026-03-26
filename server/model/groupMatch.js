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
  awayGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null,
  },
  teamsHome:
    { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },

  teamsAway:
    { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },

  player1Home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null, // For doubles matches
  },

  player1Away: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null, // For doubles matches
  },

  isInterGroup: {
    type: Boolean,
    default: false, // True for inter-group matches
  },

  scheduledTime: Date,
  scores: [GameScoreSchema],
  status: { type: String, enum: ["scheduled","ongoing", "finished"], default: "scheduled" },
  court: {type: String}
});

const GroupMatch = mongoose.model("GroupMatch", GroupMatchSchema);
module.exports = GroupMatch;
