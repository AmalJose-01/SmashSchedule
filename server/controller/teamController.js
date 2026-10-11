const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Team = require("../model/team.js");
const TournamentPlayer = require("../model/tournamentPlayer.js");
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
const TournamentPayment = require("../model/tournamentPayment.js");
const sendTeamRegistrationEmails = require("../utils/teamRegistrationEmails.js");
const {
  tournamentFee,
  createRegistrationCheckout,
  refreshTournamentPayment,
} = require("../src/features/payments/stripe/tournamentCheckoutService.js");


// Create a new team
// The tournament page is public, but when a player is logged in we tell the
// page whether they're already registered (matched by their account email).
// Case-insensitive exact match for an email (used on Team / TournamentPlayer).
const emailRegex = (email) => new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

// Email of the signed-in player (optional Bearer token), or "" if not signed in.
const getViewerEmail = async (req) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return "";
    const decoded = jwt.verify(header.split(" ")[1], process.env.SECURITY_KEY_JWT);
    const account = await AdminUser.findById(decoded.id).select("emailID").lean();
    return String(account?.emailID || "").trim().toLowerCase();
  } catch {
    return ""; // missing/expired token etc. → just treat as not registered
  }
};

const isAlreadyRegistered = async (req, tournamentId) => {
  const email = await getViewerEmail(req);
  if (!email) return false;
  const exact = emailRegex(email);
  const [team, player] = await Promise.all([
    Team.exists({ tournamentId, $or: [{ playerOneEmail: exact }, { playerTwoEmail: exact }] }),
    TournamentPlayer.exists({ tournamentId, email: exact }),
  ]);
  return !!(team || player);
};

const teamController = {
  createTeam: async (req, res) => {
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
      const openTournament = await Tournament.findById(tournamentId).select(
        "status matchType tournamentName adminId registrationFee acceptOnlinePayment"
      );
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

      // "Accept online payment": the team is only registered after the card
      // payment succeeds (see tournamentCheckoutService.finalizeRegistration).
      if (tournamentFee(openTournament) > 0) {
        const payment = await createRegistrationCheckout({
          tournament: openTournament,
          kind: "team",
          registration: req.body,
        });
        return res.status(200).json({
          message: "Payment required",
          requiresPayment: true,
          checkoutUrl: payment.checkoutUrl,
          paymentId: payment._id,
          amount: payment.amount,
        });
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

      // Reply right away — the player shouldn't wait on the mail server.
      res
        .status(201)
        .json({ message: "Team created successfully", team: newTeam });

      // 📧 Confirmation emails run in the background (never throws).
      sendTeamRegistrationEmails({
        tournamentId,
        teamName,
        playerOneName,
        playerOneEmail,
        playerTwoName,
        playerTwoEmail,
      });
    } catch (error) {
      if (error?.status) return res.status(error.status).json({ message: error.message });
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
      const tournament = await Tournament.findById(tournamentId).select(
        "status matchType tournamentName adminId registrationFee acceptOnlinePayment"
      );
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      if (tournament.status !== "Create") {
        return res.status(400).json({ message: "Registration for this tournament is closed" });
      }

      // "Accept online payment": the player is only registered after the card
      // payment succeeds (see tournamentCheckoutService.finalizeRegistration).
      if (tournamentFee(tournament) > 0) {
        if (!name || !email || !contact) {
          return res.status(400).json({ message: "Name, email and contact number are required" });
        }
        const payment = await createRegistrationCheckout({
          tournament,
          kind: "player",
          registration: { name, email, contact, dob },
        });
        return res.status(200).json({
          message: "Payment required",
          requiresPayment: true,
          checkoutUrl: payment.checkoutUrl,
          paymentId: payment._id,
          amount: payment.amount,
        });
      }
      // Delegate to the shared player logic with exactly one player.
      req.body = { tournamentId, players: [{ name, email, contact, dob }] };
      return adminTeamController.createPlayers(req, res);
    } catch (error) {
      if (error?.status) return res.status(error.status).json({ message: error.message });
      console.error("joinAsPlayer error", error);
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // GET /tournament/payments/:paymentId/status
  // The payment result page polls this after Stripe redirects back. It asks
  // Stripe directly, so the registration completes even if the webhook is late.
  getPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) return res.status(400).json({ message: "Invalid payment" });
      const payment = await TournamentPayment.findById(paymentId);
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      try {
        await refreshTournamentPayment(payment);
      } catch (err) {
        console.log("tournament payment refresh warning:", err?.message || err);
      }
      return res.status(200).json({
        data: {
          status: payment.status,
          registered: !!(payment.teamId || payment.playerId),
          refunded: payment.status === "REFUNDED",
          reason: payment.status === "REFUNDED" ? payment.failureReason : undefined,
        },
      });
    } catch (error) {
      console.error("getPaymentStatus error", error);
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

      // Tell the list which tournaments the signed-in player is already in.
      const email = await getViewerEmail(req);
      if (email && tournaments.length) {
        const exact = emailRegex(email);
        const ids = tournaments.map((t) => t._id);
        const [teams, players] = await Promise.all([
          Team.find({ tournamentId: { $in: ids }, $or: [{ playerOneEmail: exact }, { playerTwoEmail: exact }] }).select("tournamentId").lean(),
          TournamentPlayer.find({ tournamentId: { $in: ids }, email: exact }).select("tournamentId").lean(),
        ]);
        const mine = new Set([...teams, ...players].map((r) => String(r.tournamentId)));
        tournaments.forEach((t) => {
          t.alreadyRegistered = mine.has(String(t._id));
        });
      }

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
    try {
      const { tournamentId } = req.params;

      const tournament = await Tournament.findOne({
        _id: tournamentId,
      }).select("-adminId -createdAt -updatedAt -groups -uniqueKey");

      // Places taken (teams + singles players) so the player app knows if it's full.
      const registeredCount = tournament ? (await getRemainingSlots(tournamentId)).current : 0;
      const alreadyRegistered = tournament ? await isAlreadyRegistered(req, tournamentId) : false;
      res.status(200).json({
        message: "Tournaments retrieved successfully",
        tournaments: tournament ? { ...tournament.toObject(), registeredCount, alreadyRegistered } : tournament,
      });
    } catch (error) {
      console.log("Get tournaments error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  getTournamentDetails: async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const tournamentGroup = await Group.find({ tournamentId: tournamentId });
      let tournamentMatches = await GroupMatch.find({
        tournamentId: tournamentId,
      });

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
