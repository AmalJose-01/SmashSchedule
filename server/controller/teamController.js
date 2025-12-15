const mongoose = require("mongoose");

const Team = require("../model/team.js");
const Tournament = require("../model/tournament.js");
const Group = require("../model/groupTournament.js");
const { get } = require("mongoose");
const GroupMatch = require("../model/groupMatch.js");
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const KnockoutMatch = require("../model/knockoutMatch.js"); 
const KnockoutTeam = require("../model/knockoutTeam.js"); 
const {
  getTotalPoints,
  determineWinner,
} = require("../helpers/matchHelpers.js");

// Create a new team
const teamController = {
  createTeam: async (req, res) => {
    console.log("dfghjkl", req.body);

    try {
      const {
        teamName,
        playerOneName,
        playerTwoName,
        playerOneEmail,
        playerTwoEmail,
        playerOneContact,
        playerTwoContact,
        playerOneDOB,
        playerTwoDOB,
                tournamentId,

      } = req.body;

      if (
        !teamName ||
        !playerOneName ||
        !playerTwoName ||
        !playerOneEmail ||
        !playerTwoEmail ||
        !playerOneContact ||
        !playerTwoContact ||
        !playerOneDOB ||
        !playerTwoDOB||
        !tournamentId
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }
      // Check for existing emails or contacts
      const existingTeam = await Team.findOne({
        $or: [
          { playerOneEmail },
          { playerTwoEmail },
          { playerOneContact },
          { playerTwoContact },
        ],
      });
      if (existingTeam) {
        return res
          .status(400)
          .json({ message: "Email or Contact already exists" });
      }
      const newTeam = await Team.create({
        teamName,
        playerOneName,
        playerTwoName,
        playerOneEmail,
        playerTwoEmail,
        playerOneContact,
        playerTwoContact,
        playerOneDOB,
        playerTwoDOB,
        tournamentId,

      });

      if (!newTeam) {
        return res.status(500).json({ message: "Failed to create team" });
      }

      res
        .status(201)
        .json({ message: "Team created successfully", team: newTeam });
    } catch (error) {
      console.log("Create module error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  

  getTournaments: async (req, res) => {
    try {
      const tournaments = await Tournament.find().select(
        "_id tournamentName numberOfPlayersQualifiedToKnockout date time status registrationFee"
      );
      console.log(
        "Tournaments fetched===========================================================================:",
        tournaments
      );
      res.status(200).json({
        message: "Tournaments retrieved successfully",
        tournaments: tournaments,
      });
    } catch (error) {
      console.log("Get tournaments error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  
  // getTournamentWithGroups: async (req, res) => {
  //   try {
  //     const tournaments = await Tournament.find().populate("groups");
  //     res.status(200).json({
  //       message: "Tournaments retrieved successfully",
  //       tournaments: tournaments,
  //     });
  //   } catch (error) {
  //     console.log("Get tournaments error", error);
  //     res.status(500).json({ message: "Server Error", error: error.message });
  //   }
  // },

  getTournamentDetails: async (req, res) => {
    try {
      console.log("getTournamentDetails called with params:", req.params);

      const { tournamentId } = req.params;
      const tournamentGroup = await Group.find({ tournamentId: tournamentId });
      const tournamentMatches = await GroupMatch.find({
        tournamentId: tournamentId,
      });

      console.log("tournamentGroup:", tournamentGroup);
      console.log("tournamentMatches:", tournamentMatches);
      if (!tournamentGroup) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      if (!tournamentMatches) {
        return res
          .status(404)
          .json({ message: "No matches found for this tournament" });
      }

      res.status(200).json({
        message: "Tournament details retrieved successfully",
        groups: tournamentGroup,
        matches: tournamentMatches,
      });
    } catch (error) {
      console.log("Get tournament details error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
};

module.exports = teamController;
