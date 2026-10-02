const mongoose = require("mongoose");

const Team = require("../model/team.js");
const { getRemainingSlots, fullMessage } = require("../helpers/participantLimit.js");
const adminTeamController = require("./adminTeamController.js");
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
      // Registration only while the tournament hasn't started.
      const openTournament = await Tournament.findById(tournamentId).select("status matchType");
      if (!openTournament) return res.status(404).json({ message: "Tournament not found" });
      if (openTournament.status !== "Create") {
        return res.status(400).json({ message: "Registration for this tournament is closed" });
      }
      if (openTournament.matchType !== "Doubles") {
        return res.status(400).json({ message: "This is a Singles tournament — register as a player" });
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

      // Never go over "Max Participants".
      const { max, remaining } = await getRemainingSlots(tournamentId);
      if (remaining <= 0) {
        return res.status(409).json({ message: fullMessage(max) });
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

  // POST /tournament/players  { tournamentId, name, email, contact, dob }
  // A player joins a Singles tournament (stored in "tournamentplayers").
  // Uses the same rules as the admin import: per-tournament duplicates and
  // Max Participants.
  joinAsPlayer: async (req, res) => {
    try {
      const { tournamentId, name, email, contact, dob } = req.body;
      if (!mongoose.Types.ObjectId.isValid(String(tournamentId || ""))) {
        return res.status(400).json({ message: "Invalid tournament" });
      }
      const tournament = await Tournament.findById(tournamentId).select("status");
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      if (tournament.status !== "Create") {
        return res.status(400).json({ message: "Registration for this tournament is closed" });
      }
      // Delegate to the shared player logic with exactly one player.
      req.body = { tournamentId, players: [{ name, email, contact, dob }] };
      return adminTeamController.createPlayers(req, res);
    } catch (error) {
      console.error("joinAsPlayer error", error);
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // POST /tournament/verify-key/:tournamentId  { key }
  // Checks the tournament's Secret Key on the server (the key itself is never
  // sent to the browser).
  verifyTournamentKey: async (req, res) => {
    try {
      const { tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament" });
      }
      const tournament = await Tournament.findById(tournamentId).select("uniqueKey");
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      const ok = String(req.body?.key || "").trim() === String(tournament.uniqueKey);
      // 400 (not 401): the app treats 401 as "session expired" and logs out.
      if (!ok) return res.status(400).json({ message: "Invalid code" });
      return res.status(200).json({ message: "Code verified", ok: true });
    } catch (error) {
      console.error("verifyTournamentKey error", error);
      return res.status(500).json({ message: "Server Error", error: error.message });
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
            matchType: 1,
          },
        },
        {
          $lookup: {
            from: "tournamentteams", // must be collection name (renamed from "teams")
            localField: "_id",
            foreignField: "tournamentId",
            as: "teams",
          },
        },
        {
          // Singles players are in their own collection
          $lookup: {
            from: "tournamentplayers",
            localField: "_id",
            foreignField: "tournamentId",
            as: "players",
          },
        },
        {
          $addFields: {
            registeredTeamsCount: { $add: [{ $size: "$teams" }, { $size: "$players" }] },
          },
        },
        {
          $project: {
            teams: 0, // remove arrays from response
            players: 0,
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
      }).select("-adminId -createdAt -updatedAt -groups -uniqueKey");

      console.log(
        "Tournaments fetched===========================================================================:",
        tournament
      );
      // Places taken (teams + singles players) so the player app knows if it's full.
      const registeredCount = tournament ? (await getRemainingSlots(tournamentId)).current : 0;
      res.status(200).json({
        message: "Tournaments retrieved successfully",
        tournaments: tournament ? { ...tournament.toObject(), registeredCount } : tournament,
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
