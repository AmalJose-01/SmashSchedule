const mongoose = require("mongoose");

const Team = require("../model/team.js");
const Tournament = require("../model/tournamentModel.js");
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
const AdminUser = require("../model/adminUser.js");
const sendEmail = require("../utils/sendEmail.js");
const buildPlayerMailBody = require("../utils/playerMailTemplate.js");
const buildAdminMailBody = require("../utils/adminMailTemplate.js");



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
        !playerTwoDOB ||
        !tournamentId
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }
      // Check for existing emails or contacts
      const existingTeam = await Team.findOne({
        tournamentId,
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

      const tournamentDetail = await Tournament.findOne({
        _id: tournamentId,
      }).select("adminId uniqueKey date time location");
      console.log("tournamentDetail", tournamentDetail, tournamentId);

      const AdminUserDetail = await AdminUser.findOne({
        _id: tournamentDetail.adminId,
      }).select("emailID");

      // ==========================
      // 📧 SEND EMAILS
      // ==========================
      console.log("AdminUserDetail", AdminUserDetail);



      
      // 1️⃣ Email to Players
      const playerMailSubject = "✅ Team Registration Successful";
      const adminMailSubject = "📢 New Team Registered";

      const playerMailBody = buildPlayerMailBody({
        teamName,
        playerOneName,
        playerTwoName,
        tournamentDetail,
      });

      await Promise.all([
        sendEmail({
          to: playerOneEmail,
          subject: playerMailSubject,
          html: playerMailBody,
        }),
        sendEmail({
          to: playerTwoEmail,
          subject: playerMailSubject,
          html: playerMailBody,
        }),
      ]);

      if (AdminUserDetail?.emailID) {
        const adminMailSubject = "📢 New Team Registered";

        const adminMailBody = buildAdminMailBody({
          teamName,
          tournamentId,
          playerOneName,
          playerOneEmail,
          playerTwoName,
          playerTwoEmail
        });

        await sendEmail({
          to: AdminUserDetail.emailID,
          subject: adminMailSubject,
          html: adminMailBody
        });
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
      const tournaments = await Tournament.aggregate([
        {
          $project: {
            tournamentName: 1,
            numberOfPlayersQualifiedToKnockout: 1,
            date: 1,
            time: 1,
            status: 1,
            registrationFee: 1,
            maximumParticipants: 1,
            uniqueKey: 1,
          },
        },
        {
          $lookup: {
            from: "teams", // must be collection name
            localField: "_id",
            foreignField: "tournamentId",
            as: "teams",
          },
        },
        {
          $addFields: {
            registeredTeamsCount: { $size: "$teams" },
          },
        },
        {
          $project: {
            teams: 0, // remove teams array from response
          },
        },
      ]);

      res.status(200).json({
        message: "Tournaments retrieved successfully",
        tournaments,
      });
    } catch (error) {
      console.log("Get tournaments error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // done
  getTournamentInformation: async (req, res) => {
    console.log("eq.userId", req.userId);

    try {
      const { tournamentId } = req.params;

      const tournament = await Tournament.findOne({
        _id: tournamentId,
      }).select("-adminId -createdAt -updatedAt -groups");

      console.log(
        "Tournaments fetched===========================================================================:",
        tournament
      );
      res.status(200).json({
        message: "Tournaments retrieved successfully",
        tournaments: tournament,
      });
    } catch (error) {
      console.log("Get tournaments error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  getTournamentDetails: async (req, res) => {
    try {
      console.log("getTournamentDetails called with params:", req.params);

      const { tournamentId } = req.params;
      const tournamentGroup = await Group.find({ tournamentId: tournamentId });
      let tournamentMatches = await GroupMatch.find({
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




 // ===============================
    // 🔄 SORT BUT KEEP FLAT STRUCTURE
    // ===============================
    const grouped = {};

    tournamentMatches.forEach((m) => {
      const gid = m.group.toString();
      if (!grouped[gid]) grouped[gid] = [];
      grouped[gid].push(m);
    });

    const sortedFlatMatches = [];

    Object.keys(grouped).forEach((gid) => {
      const rounds = [];

      grouped[gid].forEach((match) => {
        let placed = false;

        for (const round of rounds) {
          if (round.length >= 2) continue;

          const teams = new Set();
          round.forEach((r) => {
            teams.add(r.teamsHome.toString());
            teams.add(r.teamsAway.toString());
          });

          if (
            !teams.has(match.teamsHome.toString()) &&
            !teams.has(match.teamsAway.toString())
          ) {
            round.push(match);
            placed = true;
            break;
          }
        }

        if (!placed) rounds.push([match]);
      });

      // 🔽 flatten rounds back to array (IMPORTANT)
      rounds.forEach((round) => {
        round.forEach((match) => {
          sortedFlatMatches.push(match);
        });
      });
    });

    // overwrite order ONLY
    tournamentMatches = sortedFlatMatches;








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
