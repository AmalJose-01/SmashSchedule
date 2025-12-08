const mongoose = require("mongoose");

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
  status: { type: String, enum: ["Scheduled","Ongoing","GroupStage","KnockoutStage", "finished"], default: "Scheduled" },
  adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    isPublic: { type: Boolean, default: false }



}, { timestamps: true });

const Tournament = mongoose.model("Tournament", tournamentSchema);

module.exports = Tournament;
  


