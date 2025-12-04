const mongoose = require("mongoose");





// const KnockoutSchema = new mongoose.Schema({
//   tournamentId: String,
//   stage: String, // "Quarterfinal", "Semifinal", "Final"
//   matchName: String,
//   teamsHome: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team"
//     }],
//   teamsAway: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team"
//     }],
//   source: String, 
//   // e.g. "Winner Group A", "Runner Group B" 
//   scheduledTime: Date,
//   scores: [GameScoreSchema],
//   status: String
// });

const tournamentSchema = new mongoose.Schema({
  tournamentName: { type: String, required: true },
  playType: { type: String, enum: ["group", "knockout", "group-knockout"], default: "group-knockout" },
  teamsPerGroup: { type: Number, required: true },
  numberOfPlayersQualifiedToKnockout: { type: Number, required: true },
  numberOfCourts: { type: Number, required: true },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group"
  }],
   status: String // ongoing,groupStage,knockoutStage, completed
}, { timestamps: true });

const Tournament = mongoose.model("Tournament", tournamentSchema);

module.exports = Tournament;
  


