const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true
  },

  //  tournamentId: {type: String, required: true},
  groupName:{ type: String, required: true }, // "Group A"
  teams: [{
    teamId: {type: String, required: true},
    name: {type: String, required: true},
  }],
  standings: [{
    teamId: {type: String, required: false},
    matchesPlayed: {type: Number, required: false},
    wins: {type: Number, required: false},
    losses: {type: Number, required: false},
    pointsFor: {type: Number, required: false},
    pointsAgainst: {type: Number, required: false},
    pointsDiff: {type: Number, required: false},
    totalPoints: {type: Number, required: false , default: 0},
  }]
});
const Group = mongoose.model("Group", GroupSchema);

module.exports = Group;