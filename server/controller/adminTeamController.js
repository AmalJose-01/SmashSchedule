const mongoose = require("mongoose");

const Team = require("../model/team.js");
const TournamentPlayer = require("../model/tournamentPlayer.js");
const { getRemainingSlots, fullMessage } = require("../helpers/participantLimit.js");
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
// Same court scoresheet PDF layout as round robin
const { buildScoreSheetPdf } = require("../src/features/round-robin/utils/matchSchedulePdf.js");
const buildPlayerMailBody = require("../utils/playerMailTemplate.js");
const buildAdminMailBody = require("../utils/adminMailTemplate.js");
const sendRegistrationEmails = require("../routes/admin/sendRegistrationEmails.js");

const generateUnique4DigitKey = () => {
  return ((Date.now() % 9000) + 1000).toString();
};
const normalizePhone = (value) => value?.replace(/[^\d]/g, "");

// Singles player from request/CSV data. Empty values become undefined so they
// are not stored (the unique email/contact indexes only apply when present).
const PLAYER_FIELDS = ["name", "email", "contact", "dob", "grade", "memberNo"];
const buildPlayer = (p = {}, tournamentId) => {
  const text = (v) => (v === undefined || v === null ? "" : String(v).trim());
  const player = {
    name: text(p.name),
    email: text(p.email).toLowerCase(),
    contact: normalizePhone(text(p.contact)),
    dob: text(p.dob),
    grade: text(p.grade).toUpperCase(),
    memberNo: text(p.memberNo),
  };
  for (const f of PLAYER_FIELDS) if (!player[f]) player[f] = undefined;
  if (player.name === undefined) player.name = "";
  return tournamentId ? { ...player, tournamentId } : player;
};


const adminTeamController = {
 
  updateTeams: async (req, res) => {
    try {
      console.log("team====", req.body);

      const {
        _id,
        teamName,
        tournamentId,
        playerOneName,
        playerTwoName,
        playerOneEmail,
        playerTwoEmail,
        playerOneContact,
        playerTwoContact,
        playerOneDOB,
        playerTwoDOB,
      } = req.body;
      if (!_id || !tournamentId) {
        return res
          .status(400)
          .json({ message: "team and tournamentId are required" });
      }
      const existingTeam = await Team.findOne({
        _id: _id,
        tournamentId: tournamentId,
      });
      if (!existingTeam) {
        return res.status(404).json({ message: "Team not found" });
      }

      const updatedTeam = await Team.findByIdAndUpdate(
        _id,
        {
          $set: {
            playerOneName,
            playerTwoName,
            playerOneEmail,
            playerTwoEmail,
            playerOneContact,
            playerTwoContact,
            playerOneDOB,
            playerTwoDOB,
            teamName,
          },
        },
        { new: true }
      );

      if (!updatedTeam) {
        return res.status(404).json({ message: "Team not found" });
      }

      res.status(200).json({
        message: "Team updated successfully",
        updatedTeam,
      });
    } catch (error) {
      console.error("Update team error", error);
      res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  },

  createMultipleTeam: async (req, res) => {
    try {
      const { teams, tournamentId } = req.body;
      // Basic validation
      if (!tournamentId) {
        return res.status(400).json({ message: "tournamentId is required" });
      }
      if (!Array.isArray(teams) || teams.length === 0) {
        return res.status(400).json({ message: "Teams list is required" });
      }

      let skippedTeams = [];
            let sameBothMembers = [];


      // Normalize and validate contacts
      const cleanedTeams = teams.map((team) => ({
        ...team,
        tournamentId,
        playerOneContact: normalizePhone(team.playerOneContact),
        playerTwoContact: normalizePhone(team.playerTwoContact),
      }));

      // Filter out teams with same email/contact for both players
      const validTeams = cleanedTeams.filter((team) => {
        if (team.playerOneEmail === team.playerTwoEmail) {
          sameBothMembers.push({ ...team, reason: "Same email for both players" });       
          return false;
        }
        if (team.playerOneContact === team.playerTwoContact) {
          sameBothMembers.push({
            ...team,
            reason: "Same contact for both players",
          });
          return false;
        }
        return true;
      });

      // Check existing emails and contacts in the same tournament
      const emails = validTeams.flatMap((t) => [
        t.playerOneEmail,
        t.playerTwoEmail,
      ]);
      const contacts = validTeams.flatMap((t) => [
        t.playerOneContact,
        t.playerTwoContact,
      ]);

      const existingTeams = await Team.find({
        tournamentId,
        $or: [
          { playerOneEmail: { $in: emails } },
          { playerTwoEmail: { $in: emails } },
          { playerOneContact: { $in: contacts } },
          { playerTwoContact: { $in: contacts } },
        ],
      });

      const existingEmails = new Set(
        existingTeams.flatMap((t) => [t.playerOneEmail, t.playerTwoEmail])
      );
      const existingContacts = new Set(
        existingTeams.flatMap((t) => [t.playerOneContact, t.playerTwoContact])
      );

      // Filter out duplicates in the database
      const teamsToInsert = validTeams.filter((team) => {
        const duplicate =
          existingEmails.has(team.playerOneEmail) ||
          existingEmails.has(team.playerTwoEmail) ||
          existingContacts.has(team.playerOneContact) ||
          existingContacts.has(team.playerTwoContact);

        if (duplicate) {
          skippedTeams.push({
            ...team,
            reason: "Already exists in tournament",
          });
        }
        return !duplicate;
      });
      
              if (teamsToInsert.length === 0 && sameBothMembers.length > 0) {
        return res.status(409).json({
          message: "Team members cannot be the same",
          sameBothMembers,
        });
      }
      if (teamsToInsert.length === 0 && skippedTeams.length > 0) {
        return res.status(409).json({
          message: "No new teams to insert",
          skippedTeams,
        });
      }




      console.log("Teams to insert", teamsToInsert);
      

      /* -------------------- INSERT (DB LEVEL SAFE) -------------------- */
      let savedTeams = [];
      skippedTeams = [];

      // 1️⃣ Optional: Pre-filter duplicates in payload to reduce DB errors
      const seenKeys = new Set();
      const teamsToInsertFiltered = teamsToInsert.filter((team) => {
        const key = team.teamName.toLowerCase(); // adjust key if needed
        if (seenKeys.has(key)) {
          skippedTeams.push({ ...team, reason: "Duplicate in payload" });
          return false;
        }
        seenKeys.add(key);
        return true;
      });

      // Never go over "Max Participants": extra teams are skipped.
      const { max, remaining } = await getRemainingSlots(tournamentId);
      if (remaining <= 0) {
        return res.status(409).json({
          message: fullMessage(max),
          skippedTeams: teamsToInsertFiltered.map((t) => ({ ...t, reason: fullMessage(max) })),
        });
      }
      const overLimitTeams = teamsToInsertFiltered.splice(remaining);

      try {
        // 2️⃣ Bulk insert (fast) with ordered: false → insert all non-duplicates
        savedTeams = await Team.insertMany(teamsToInsertFiltered, {
          ordered: false,
        });
      } catch (err) {
        if (err.name === "BulkWriteError" || err.code === 11000) {
          console.warn("Bulk insert completed with duplicates");

          // 3️⃣ Capture DB-level duplicates
          err.writeErrors?.forEach((e) => {
            skippedTeams.push({
              ...e.err.op,
              reason: "Duplicate detected at DB level",
              mongoError: e.errmsg,
            });
          });

          // 4️⃣ Get the successfully inserted documents
          const insertedIds = Object.values(err.insertedIds || {});
          if (insertedIds.length > 0) {
            savedTeams = await Team.find({ _id: { $in: insertedIds } });
          } else {
            savedTeams = [];
          }
        } else {
          throw err; // real server error
        }
      }

      // Merge DB duplicates into skipped list
      overLimitTeams.forEach((t) => skippedTeams.push({ ...t, reason: fullMessage(max) }));

      if (
        teamsToInsert.length === skippedTeams.length &&
        skippedTeams.length > 0
      ) {
        return res.status(409).json({
          message: "No new teams to insert",
          skippedTeams,
        });
      }

      // // Insert new teams
      // const savedTeams =
      //   teamsToInsert.length > 0
      //     ? await Team.insertMany(teamsToInsert, { ordered: false })
      //     : [];

      if (!savedTeams || savedTeams.length === 0) {
        return res.status(500).json({ message: "Failed to import team" });
      }

      // Fetch tournament and admin details
      const tournamentDetail = await Tournament.findById(tournamentId).select(
        "adminId uniqueKey date time location"
      );
      const AdminUserDetail = await AdminUser.findById(
        tournamentDetail.adminId
      ).select("emailID");

      const playerMailSubject = "✅ Team Registration Successful";
      const adminMailSubject = "📢 New Team Registered";

      // Send emails
      // await Promise.allSettled(
      //   savedTeams.flatMap((team) => {
      //     const playerMailBody = buildPlayerMailBody({
      //       teamName: team.teamName,
      //       playerOneName: team.playerOneName,
      //       playerTwoName: team.playerTwoName,
      //       tournamentDetail,
      //     });

      //     const tasks = [
      //       sendEmail({
      //         to: team.playerOneEmail,
      //         subject: playerMailSubject,
      //         html: playerMailBody,
      //       }),
      //       sendEmail({
      //         to: team.playerTwoEmail,
      //         subject: playerMailSubject,
      //         html: playerMailBody,
      //       }),
      //     ];

      //     if (AdminUserDetail?.emailID) {
      //       const adminMailBody = buildAdminMailBody({
      //         teamName: team.teamName,
      //         tournamentId,
      //         playerOneName: team.playerOneName,
      //         playerOneEmail: team.playerOneEmail,
      //         playerTwoName: team.playerTwoName,
      //         playerTwoEmail: team.playerTwoEmail,
      //       });
      //       tasks.push(
      //         sendEmail({
      //           to: AdminUserDetail.emailID,
      //           subject: adminMailSubject,
      //           html: adminMailBody,
      //         })
      //       );
      //     }

      //     return tasks;
      //   })
      // );


      /* -------------------- FINAL RESPONSE -------------------- */
      if (savedTeams.length > 0) {
         res.status(201).json({
          message: "Teams import completed",
          insertedCount: savedTeams.length,
          skippedCount: skippedTeams.length,
          insertedTeams: savedTeams,
          skippedTeams,
        });

            // 3️⃣ Fire-and-forget email sending 🔥


        (async () => {
          try {
            await sendRegistrationEmails({
              teams: savedTeams,
              playerMailSubject: "✅ Team Registration Successful",
              adminMailSubject: "📋 New Team Registration",
              tournamentDetail: req.body.tournamentDetail,
              AdminUserDetail: req.admin,
            });
          } catch (err) {
            console.error("❌ Background email error:", err);
          }
        })();
        
  return;
      }

      return res.status(409).json({
        message: "All teams already exist",
        insertedCount: 0,
        skippedCount: skippedTeams.length,
        skippedTeams,
      });
    } catch (error) {
      console.error("Create multiple team error", error);
      res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  },

  deleteTeam: async (req, res) => {
    console.log("Admin deleteTeam Delete");

    try {
      const { teamId } = req.params;
      console.log("Deleting team:", teamId);

      // 1️⃣ Validate ID format (prevents CastError)
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({ message: "Invalid teamId" });
      }

      // 2️⃣ Team (doubles) or player (singles)
      const deletedTeam = await Team.findByIdAndDelete(teamId);
      if (deletedTeam) {
        return res.status(200).json({ message: "Team deleted successfully" });
      }

      const deletedPlayer = await TournamentPlayer.findByIdAndDelete(teamId);
      if (deletedPlayer) {
        return res.status(200).json({ message: "Player deleted successfully" });
      }

      return res.status(404).json({ message: "Team or player not found" });
    } catch (error) {
      console.error("deleteTeam error:", error);
      return res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  },

  getTeams: async (req, res) => {
    try {
      console.log("Import Team");

      const { tournamentId } = req.params;

      const teams = await Team.find({ tournamentId: tournamentId });

      // Singles: players live in "tournamentplayers". They are returned in the
      // same shape as teams (teamName = player name) so scheduling, groups and
      // matches keep working unchanged. entryType tells the UI which is which.
      const tournament = await Tournament.findById(tournamentId).select("matchType");
      let entries = teams;
      if (tournament && tournament.matchType !== "Doubles") {
        const players = await TournamentPlayer.find({ tournamentId }).sort({ createdAt: 1 });
        entries = [
          ...players.map((p) => ({
            _id: p._id,
            entryType: "player",
            teamName: p.name,
            name: p.name,
            email: p.email,
            contact: p.contact,
            dob: p.dob,
            grade: p.grade,
            memberNo: p.memberNo,
            playerOneName: p.name,
            playerOneEmail: p.email,
            playerOneContact: p.contact,
            playerOneDOB: p.dob,
            tournamentId: p.tournamentId,
          })),
          ...teams, // older singles tournaments registered through the team form
        ];
      }

      res
        .status(200)
        .json({ message: "Teams retrieved successfully", teams: entries });
    } catch (error) {
      console.log("Get teams error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  // done

  // GET /admin/score-sheet-pdf/:tournamentId
  // Group-stage match schedule + fillable court scoresheets — same layout as
  // the round robin "Download PDF".
  downloadScoreSheetPdf: async (req, res) => {
    try {
      const { tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }
      const tournament = await Tournament.findOne({ _id: tournamentId, adminId: req.userId }).select("tournamentName");
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });

      const groups = await Group.find({ tournamentId }).select("groupName teams");
      const matches = await GroupMatch.find({ tournamentId }).select("teamsHome teamsAway court group matchName");
      if (matches.length === 0) {
        return res.status(400).json({ message: "No matches yet — start the tournament first" });
      }

      // teamId → name, from the groups (works for teams and singles players)
      const nameById = new Map();
      groups.forEach((g) => (g.teams || []).forEach((t) => nameById.set(String(t.teamId), t.name)));
      const nameOf = (id, fallback) => nameById.get(String(id)) || fallback || "—";

      const groupOrder = new Map(groups.map((g, i) => [String(g._id), i]));
      const rows = matches
        .slice()
        .sort((a, b) => (groupOrder.get(String(a.group)) ?? 0) - (groupOrder.get(String(b.group)) ?? 0))
        .map((m) => {
          const [homeFromName, awayFromName] = String(m.matchName || "").split("-vs-");
          return {
            home: nameOf(m.teamsHome, homeFromName?.trim()),
            away: nameOf(m.teamsAway, awayFromName?.trim()),
            court: m.court,
          };
        });

      const doc = buildScoreSheetPdf({
        title: tournament.tournamentName,
        subtitle: "Group Stage · Match Schedule",
        numberOfSets: 3,
        rows,
      });
      const safeName = tournament.tournamentName.replace(/[^a-z0-9]+/gi, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}_Match_Schedule.pdf"`);
      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error("downloadScoreSheetPdf error", error);
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // ── Singles players (collection "tournamentplayers") ──────────────────────
  // POST /admin/players  { tournamentId, players: [{ name, email, contact, dob }] }
  // Used by "Register Player" (one player) and the Singles import (many).
  createPlayers: async (req, res) => {
    try {
      const { players } = req.body;
      if (!req.body.tournamentId || !mongoose.Types.ObjectId.isValid(req.body.tournamentId)) {
        return res.status(400).json({ message: "tournamentId is required" });
      }
      // Every duplicate check below is scoped to THIS tournament only — the
      // same person can play in any number of the admin's tournaments.
      const tournamentId = new mongoose.Types.ObjectId(String(req.body.tournamentId));
      if (!Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ message: "Players list is required" });
      }

      const tournament = await Tournament.findById(tournamentId).select("matchType");
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      if (tournament.matchType === "Doubles") {
        return res.status(400).json({ message: "This is a Doubles tournament — register teams instead" });
      }

      const skippedPlayers = [];
      const seen = new Set();
      const cleaned = [];
      for (const p of players) {
        const player = buildPlayer(p, tournamentId);
        const label = { ...player, teamName: player.name || "(no name)" };
        // Name, email and contact number are mandatory.
        const missing = [
          !player.name && "name",
          !player.email && "email",
          !player.contact && "contact number",
        ].filter(Boolean);
        if (missing.length) {
          skippedPlayers.push({ ...label, reason: `Missing ${missing.join(" & ")}` });
          continue;
        }
        // Identify by email / phone; players with neither are matched by name.
        const keys = [player.email && `e:${player.email}`, player.contact && `c:${player.contact}`].filter(Boolean);
        if (!keys.length) keys.push(`n:${player.name.toLowerCase()}`);
        if (keys.some((k) => seen.has(k))) {
          skippedPlayers.push({ ...label, reason: "Listed twice in the file" });
          continue;
        }
        keys.forEach((k) => seen.add(k));
        cleaned.push(player);
      }

      // Already registered in THIS tournament? (only players that have an email/phone)
      const emails = cleaned.map((p) => p.email).filter(Boolean);
      const contacts = cleaned.map((p) => p.contact).filter(Boolean);
      const or = [];
      if (emails.length) or.push({ email: { $in: emails } });
      if (contacts.length) or.push({ contact: { $in: contacts } });
      const nameOnly = cleaned.filter((p) => !p.email && !p.contact).map((p) => p.name);
      if (nameOnly.length) {
        const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        or.push({ name: { $in: nameOnly.map((n) => new RegExp(`^${esc(n)}$`, "i")) } });
      }
      const existing = or.length
        ? await TournamentPlayer.find({ tournamentId, $or: or }).select("name email contact")
        : [];
      const takenEmails = new Set(existing.map((p) => p.email).filter(Boolean));
      const takenContacts = new Set(existing.map((p) => p.contact).filter(Boolean));
      const takenNames = new Set(existing.map((p) => p.name.toLowerCase()));

      const toInsert = cleaned.filter((p) => {
        const dup =
          (p.email && takenEmails.has(p.email)) ||
          (p.contact && takenContacts.has(p.contact)) ||
          (!p.email && !p.contact && takenNames.has(p.name.toLowerCase()));
        if (dup) skippedPlayers.push({ ...p, teamName: p.name, reason: "Already registered in this tournament" });
        return !dup;
      });

      if (toInsert.length === 0) {
        return res.status(409).json({
          message: "No new players to insert",
          skippedPlayers,
          skippedTeams: skippedPlayers, // same list, for older UI code
        });
      }

      // Never go over "Max Participants": extra rows are skipped.
      const { max, remaining } = await getRemainingSlots(tournamentId);
      if (remaining <= 0) {
        toInsert.forEach((p) => skippedPlayers.push({ ...p, teamName: p.name, reason: fullMessage(max) }));
        return res.status(409).json({
          message: fullMessage(max),
          skippedPlayers,
          skippedTeams: skippedPlayers,
        });
      }
      const overLimit = toInsert.splice(remaining);
      overLimit.forEach((p) => skippedPlayers.push({ ...p, teamName: p.name, reason: fullMessage(max) }));

      // Save one by one so each player gets a clear reason if it fails.
      const saved = [];
      for (const p of toInsert) {
        try {
          saved.push(await TournamentPlayer.create(p));
        } catch (err) {
          let reason = err.message;
          if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {}).find((k) => k !== "tournamentId") || "email/contact";
            reason = `${field === "contact" ? "Contact number" : "Email"} already registered in this tournament`;
            console.warn("createPlayers duplicate key", err.keyPattern, err.keyValue);
          } else if (err.name === "ValidationError") {
            reason = Object.values(err.errors).map((e) => e.message).join(", ");
          }
          skippedPlayers.push({ ...p, teamName: p.name, reason });
        }
      }

      if (saved.length === 0) {
        return res.status(409).json({ message: "No new players to insert", skippedPlayers, skippedTeams: skippedPlayers });
      }

      return res.status(201).json({
        message: "Players registered",
        insertedCount: saved.length,
        skippedCount: skippedPlayers.length,
        insertedPlayers: saved,
        skippedPlayers,
        skippedTeams: skippedPlayers,
      });
    } catch (error) {
      console.error("createPlayers error", error);
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // PUT /admin/update-player  { _id, tournamentId, name, email, contact, dob }
  updatePlayer: async (req, res) => {
    try {
      const { _id, tournamentId } = req.body;
      if (!_id || !tournamentId) {
        return res.status(400).json({ message: "Player and tournamentId are required" });
      }
      const player = buildPlayer(req.body, tournamentId);
      if (!player.name || !player.email || !player.contact) {
        return res.status(400).json({ message: "Name, email and contact number are required" });
      }

      const or = [];
      if (player.email) or.push({ email: player.email });
      if (player.contact) or.push({ contact: player.contact });
      const clash = or.length
        ? await TournamentPlayer.findOne({ tournamentId, _id: { $ne: _id }, $or: or }).select("_id")
        : null;
      if (clash) {
        return res.status(409).json({ message: "Another player in this tournament already uses that email or contact" });
      }

      // Set the filled fields, remove the ones that were cleared.
      const $set = {};
      const $unset = {};
      for (const f of PLAYER_FIELDS) {
        if (player[f] !== undefined) $set[f] = player[f];
        else $unset[f] = "";
      }
      const updatedPlayer = await TournamentPlayer.findOneAndUpdate(
        { _id, tournamentId },
        { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
        { new: true }
      );
      if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });

      return res.status(200).json({ message: "Player updated successfully", updatedPlayer });
    } catch (error) {
      console.error("updatePlayer error", error);
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  createTournament: async (req, res) => {
    console.log("createTournament called  ", req.body);

    try {
      const {
        tournamentName,
        playType,
        teamsPerGroup,
        numberOfPlayersQualifiedToKnockout,
        numberOfCourts,
        date,
        time,
        location,
        maximumParticipants,
        matchType,
        description,
        registrationFee,
      } = req.body;

      if (
        !req.userId ||
        !tournamentName ||
        !playType ||
        !teamsPerGroup ||
        !numberOfPlayersQualifiedToKnockout ||
        !numberOfCourts ||
        !registrationFee
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingTournament = await Tournament.findOne({
        tournamentName,
        adminId: req.userId,
      });
      if (existingTournament) {
        return res
          .status(400)
          .json({ message: "Tournament with this name already exists" });
      }

      let uniqueKey = generateUnique4DigitKey();
      // 1. Create Tournament
      const createTournament = await Tournament.create({
        tournamentName,
        playType,
        teamsPerGroup,
        numberOfPlayersQualifiedToKnockout,
        numberOfCourts,
        adminId: req.userId,
        date,
        time,
        location,
        maximumParticipants,
        matchType,
        description,
        status: "Create",
        registrationFee,
        uniqueKey,
      });

      if (!createTournament) {
        return res.status(500).json({ message: "Failed to create tournament" });
      }

      console.log("New Tournament Created: ", createTournament);
      res.status(201).json({
        message: "Tournament created successfully",
        tournament: createTournament,
      });
    } catch (error) {
      console.log("Create tournament error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  updateTournament: async (req, res) => {
    console.log("updateTournament called  ", req.body);

    try {
      const {
        _id,
        tournamentName,
        playType,
        teamsPerGroup,
        numberOfPlayersQualifiedToKnockout,
        numberOfCourts,
        date,
        time,
        location,
        maximumParticipants,
        matchType,
        description,
        registrationFee,
      } = req.body;

      if (
        !req.userId ||
        !_id ||
        !tournamentName ||
        !playType ||
        !teamsPerGroup ||
        !numberOfPlayersQualifiedToKnockout ||
        !numberOfCourts ||
        !registrationFee
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingTournament = await Tournament.findOne({
        _id: _id,
        adminId: req.userId,
      });
      if (!existingTournament) {
        return res
          .status(400)
          .json({ message: "Tournament with this ID not found" });
      }

      // Max Participants can't go below the number already registered.
      const { current } = await getRemainingSlots(_id);
      if (Number(maximumParticipants) < current) {
        return res.status(400).json({
          message: `Max Participants can't be less than the ${current} already registered`,
        });
      }

      console.log("existingTournament   ", existingTournament);

      // 1. Update Tournament
      existingTournament.tournamentName = tournamentName;
      existingTournament.playType = playType;
      existingTournament.teamsPerGroup = teamsPerGroup;
      existingTournament.numberOfPlayersQualifiedToKnockout =
        numberOfPlayersQualifiedToKnockout;
      existingTournament.numberOfCourts = numberOfCourts;
      existingTournament.date = date;
      existingTournament.time = time;
      existingTournament.location = location;
      existingTournament.maximumParticipants = maximumParticipants;
      existingTournament.matchType = matchType;
      existingTournament.description = description;
      existingTournament.registrationFee = registrationFee;

      const newTeam = await existingTournament.save();

      if (!newTeam) {
        return res.status(500).json({ message: "Failed to update tournament" });
      }

      console.log("Tournament Updated: ", newTeam);
      res.status(200).json({
        message: "Tournament updated successfully",
        tournament: newTeam,
      });
    } catch (error) {
      console.log("Update tournament error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  // done

  createMatches: async (req, res) => {
    console.log("createMatches called  ", req.body);

    try {
      const { tournamentName, groups, tournamentID, numberOfCourts } = req.body;

      if (
        !req.userId ||
        !tournamentName ||
        !groups ||
        !tournamentID ||
        !numberOfCourts
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingTournament = await Tournament.findOne({
        _id: tournamentID,
      });
      if (!existingTournament) {
        return res.status(400).json({ message: "Tournament not found" });
      }

      let savedGroups = [];

      // COURT LIST
      const courts = Array.from(
        { length: numberOfCourts },
        (_, idx) => `Court ${idx + 1}`
      );
      const totalGroups = groups.length;
      const baseCourts = Math.floor(numberOfCourts / totalGroups);
      let extraCourts = numberOfCourts % totalGroups;

      const groupCourts = []; // courts assigned per group

      let courtIndex = 0;

      for (let i = 0; i < totalGroups; i++) {
        let courtCount = baseCourts;

        if (extraCourts > 0) {
          courtCount++;
          extraCourts--;
        }

        const courtsForThisGroup = courts.slice(
          courtIndex,
          courtIndex + courtCount
        );

        groupCourts.push(courtsForThisGroup);
        courtIndex += courtCount;
      }

      // ----------------------------------------
      // 2. CREATE GROUPS + MATCHES
      // ----------------------------------------
      for (let i = 0; i < groups.length; i++) {
        const groupInfo = groups[i];
        const groupName = `Group ${alphabet[i]}`;
        const tournamentId = existingTournament._id;
        const formattedTeams = groupInfo.map((t) => ({
          teamId: t.teamId,
          name: t.name,
        }));

        const formattedStandings = groupInfo.map((t) => ({
          teamId: t.teamId,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointsDiff: 0,
          totalPoints: 0,
        }));

        // 2a. Save Group
        const saveGroup = await Group.create({
          tournamentId,
          groupName,
          teams: formattedTeams,
          standings: formattedStandings,
        });
        savedGroups.push(saveGroup._id);

        const courtsAssigned = groupCourts[i];

        // 2b. Generate matches for this group
        let matchIndex = 0;
        const groupMatches = formattedTeams.flatMap((homeTeam, i) =>
          formattedTeams.slice(i + 1).map((awayTeam) => {
            const court = courtsAssigned[matchIndex % courtsAssigned.length];
            matchIndex++;
            return {
              matchName: `${homeTeam.name}-vs-${awayTeam.name}`,
              tournamentId: existingTournament._id,
              group: saveGroup._id,
              teamsHome: [homeTeam.teamId],
              teamsAway: [awayTeam.teamId],
              scheduledTime: null,
              court: court,
              scores: [
                {
                  sets: [
                    { home: 0, away: 0 },
                    { home: 0, away: 0 },
                    { home: 0, away: 0 },
                  ],
                },
              ],
              status: "scheduled",
            };
          })
        );

        // 2c. Save all matches for this group
        await GroupMatch.insertMany(groupMatches);
      }

      // 3. Link all groups to tournament
      existingTournament.groups = savedGroups;
      existingTournament.status = "Scheduled";
      await existingTournament.save();

      console.log("scheduled ", existingTournament);
      res.status(201).json({
        message: "Match scheduled successfully",
        tournament: existingTournament,
      });
    } catch (error) {
      console.log("Match scheduled  error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  // done
  getTournaments: async (req, res) => {
    console.log("eq.userId", req.userId);

    try {
      if (!req.userId) {
        return res.status(400).json({ message: "Unable to retrieve data" });
      }
      const tournaments = await Tournament.find({ adminId: req.userId }).select(
        "_id tournamentName numberOfPlayersQualifiedToKnockout"
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

  // done
  getTournamentInformation: async (req, res) => {
    console.log("eq.userId", req.userId);

    try {
      if (!req.userId) {
        return res.status(400).json({ message: "Unable to retrieve data" });
      }
      const { tournamentId } = req.params;

      const tournament = await Tournament.findOne({
        _id: tournamentId,
        adminId: req.userId, // only allow access if the admin owns it
      });

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

  // Done
  getTournamentDetails: async (req, res) => {
    console.log("Call Admin");

    try {
      console.log("getTournamentDetails called with params:", req.params);

      const { tournamentId } = req.params;
      const tournamentGroup = await Group.find({ tournamentId: tournamentId });
      let tournamentMatches = await GroupMatch.find({
        tournamentId: tournamentId,
      });
      const knockoutMatch = await KnockoutMatch.find({
        tournamentId: tournamentId,
      }).select("status");

      let knockoutStatus = "";

      if (knockoutMatch.length > 0) {
        knockoutStatus = "scheduled";
      }

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




      

      // The score sheet PDF is now generated on demand
      // (GET /admin/score-sheet-pdf/:tournamentId) instead of on every load.
      res.status(200).json({
        message: "Tournament details retrieved successfully",
        groups: tournamentGroup,
        matches: tournamentMatches,
        knockoutStatus: knockoutStatus,
      });
    } catch (error) {
      console.log("Get tournament details error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // Done
  saveMatchScore: async (req, res) => {
    console.log("Call Admin Save");

    try {
      const { scores, status, matchId, group } = req.body;

      const scoreObject = scores[0];

      let { winner, matchStatus } = determineWinner(scoreObject.sets);
      console.log("Match Winner:", winner);
      console.log("matchStatus", matchStatus);

      // Save/update match scores
      const updatedMatch = await GroupMatch.findByIdAndUpdate(
        matchId,
        {
          $set: {
            "scores.0.sets": scoreObject.sets,
            status: matchStatus,
          },
        },
        { new: true }
      );

      if (!updatedMatch) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Recompute group standings
      const groupDoc = await Group.findOne({ _id: group });
      if (!groupDoc) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Reset standings
      groupDoc.standings.forEach((s) => {
        s.matchesPlayed = 0;
        s.wins = 0;
        s.losses = 0;
        s.pointsFor = 0;
        s.pointsAgainst = 0;
        s.pointsDiff = 0;
        s.totalPoints = 0;
      });

      const matches = await GroupMatch.find({ group: group });
      for (const match of matches) {
        if (!match.scores || match.scores.length === 0) continue;

        const matchScores = match.scores[0].sets;

        const isMatchPlayed = matchScores.some(
          (set) => set.home > 0 || set.away > 0
        );
        if (!isMatchPlayed) continue;

        // const matchWinner = determineWinner(matchScores);
        let { winner, matchStatus } = determineWinner(matchScores);
        const matchWinner = winner;

        const matchPoints = getTotalPoints(matchScores);
        const homeTeamId = match.teamsHome.toString();
        const awayTeamId = match.teamsAway.toString();

        const homeStanding = groupDoc.standings.find(
          (s) => s.teamId === homeTeamId
        );
        const awayStanding = groupDoc.standings.find(
          (s) => s.teamId === awayTeamId
        );

        if (homeStanding && awayStanding) {
          homeStanding.matchesPlayed += 1;
          awayStanding.matchesPlayed += 1;
          if (matchWinner === "home") {
            homeStanding.wins += 1;
            awayStanding.losses += 1;
            homeStanding.totalPoints += 3;
            groupDoc.status = "finished";
          } else if (matchWinner === "away") {
            awayStanding.wins += 1;
            homeStanding.losses += 1;
            awayStanding.totalPoints += 3;
            groupDoc.status = "finished";
          }
          homeStanding.pointsFor += matchPoints.homeTotal;
          homeStanding.pointsAgainst += matchPoints.awayTotal;
          homeStanding.pointsDiff =
            homeStanding.pointsFor - homeStanding.pointsAgainst;

          awayStanding.pointsFor += matchPoints.awayTotal;
          awayStanding.pointsAgainst += matchPoints.homeTotal;
          awayStanding.pointsDiff =
            awayStanding.pointsFor - awayStanding.pointsAgainst;
        }
      }

      const savedGroup = await groupDoc.save();

      res.status(200).json({
        message: "Match score and group standings updated successfully",
        match: updatedMatch,
        group: savedGroup,
      });
    } catch (error) {
      console.log("Save match score error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  saveMultipleMatchScore: async (req, res) => {
    try {
      const { matches } = req.body;

      if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return res.status(400).json({ message: "No matches provided" });
      }

      console.log("Call Admin Save", matches);

      const updatedGroups = [];

      for (const match of matches) {
        const { matchId, scores } = match;
        if (!matchId || !scores || scores.length === 0) continue;
        const scoreObject = scores[0];
        let { winner, matchStatus } = determineWinner(scoreObject.sets);
        // Save/update match scores
        await GroupMatch.findByIdAndUpdate(
          matchId,
          {
            $set: {
              "scores.0.sets": scoreObject.sets,
              status: matchStatus,
            },
          },
          { new: true }
        );
        /* --------------------------------------------------
       2️⃣ Collect UNIQUE group IDs
    -------------------------------------------------- */
        const groupIds = [...new Set(matches.map((m) => m.group))];

        for (const groupId of groupIds) {
          const groupDoc = await Group.findById(groupId);
          if (!groupDoc) continue;

          // Reset standings
          groupDoc.standings.forEach((s) => {
            s.matchesPlayed = 0;
            s.wins = 0;
            s.losses = 0;
            s.pointsFor = 0;
            s.pointsAgainst = 0;
            s.pointsDiff = 0;
            s.totalPoints = 0;
          });
          const groupMatches = await GroupMatch.find({ group: groupId });
          for (const match of groupMatches) {
            if (!match.scores || match.scores.length === 0) continue;

            const sets = match.scores[0].sets;
            const isPlayed = sets.some((set) => set.home > 0 || set.away > 0);
            if (!isPlayed) continue;

            const { winner } = determineWinner(sets);
            const points = getTotalPoints(sets);

            const homeId = match.teamsHome.toString();
            const awayId = match.teamsAway.toString();

            const homeStanding = groupDoc.standings.find(
              (s) => s.teamId === homeId
            );
            const awayStanding = groupDoc.standings.find(
              (s) => s.teamId === awayId
            );

            if (!homeStanding || !awayStanding) continue;

            homeStanding.matchesPlayed += 1;
            awayStanding.matchesPlayed += 1;

            if (winner === "home") {
              homeStanding.wins += 1;
              awayStanding.losses += 1;
              homeStanding.totalPoints += 3;
              groupDoc.status = "finished";
            } else if (winner === "away") {
              awayStanding.wins += 1;
              homeStanding.losses += 1;
              awayStanding.totalPoints += 3;
              groupDoc.status = "finished";
            }

            homeStanding.pointsFor += points.homeTotal;
            homeStanding.pointsAgainst += points.awayTotal;
            homeStanding.pointsDiff =
              homeStanding.pointsFor - homeStanding.pointsAgainst;

            awayStanding.pointsFor += points.awayTotal;
            awayStanding.pointsAgainst += points.homeTotal;
            awayStanding.pointsDiff =
              awayStanding.pointsFor - awayStanding.pointsAgainst;
          }

          const savedGroup = await groupDoc.save();
          updatedGroups.push(savedGroup);
        }
      }

      return res.status(200).json({
        message: "Multiple match scores saved successfully",
        totalMatchesUpdated: matches.length,
        groupsUpdated: updatedGroups.length,
        groups: updatedGroups,
      });
    } catch (error) {
      console.log("Save match score error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  deleteTournament: async (req, res) => {
    console.log("Admin Delete");

    try {
      const { tournamentId } = req.params;
      console.log("Deleting tournament:", tournamentId);

      // 1️⃣ Validate ID format (prevents CastError)
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournamentId" });
      }

      // 2️⃣ Check if tournament exists
      const existingTournament = await Tournament.findById(tournamentId);

      if (!existingTournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      console.log("existingTournament:", existingTournament);

      // 3️⃣ Get all groups under this tournament
      const groups = await Group.find({ tournamentId });

      console.log("Groups found:", groups.length);

      // 4️⃣ Extract groupIds safely
      const groupIds = groups.map((g) => g._id);

      // 5️⃣ Delete group matches (safe check if model exists)
      if (typeof GroupMatch !== "undefined") {
        await GroupMatch.deleteMany({ groupId: { $in: groupIds } });
        await GroupMatch.deleteMany({ tournamentId });
      }

      // 6️⃣ Delete knockout matches (safe)
      if (typeof KnockoutMatch !== "undefined") {
        await KnockoutMatch.deleteMany({ tournamentId });
      }

      // 7️⃣ Delete knockout teams (safe)
      if (typeof KnockoutTeam !== "undefined") {
        await KnockoutTeam.deleteMany({ tournamentId });
      }

      // 8️⃣ Delete groups
      await Group.deleteMany({ tournamentId });

      // Registered teams (doubles) and players (singles)
      await Team.deleteMany({ tournamentId });
      await TournamentPlayer.deleteMany({ tournamentId });

      // 9️⃣ Delete tournament
      await Tournament.findByIdAndDelete(tournamentId);

      return res.status(200).json({
        message: "Tournament and all related data deleted successfully",
      });
    } catch (error) {
      console.error("deleteTournament error:", error);
      return res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  },
};

module.exports = adminTeamController;
