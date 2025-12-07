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
        !playerTwoDOB
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
  getTeams: async (req, res) => {
    try {
      const teams = await Team.find();
      res
        .status(200)
        .json({ message: "Teams retrieved successfully", teams: teams });
    } catch (error) {
      console.log("Get teams error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  createTournament: async (req, res) => {
    console.log("createTournament called  ", req.body);

    try {
      const {
        tournamentName,
        playType,
        teamsPerGroup,
        groups: groupData,
        numberOfPlayersQualifiedToKnockout,
        numberOfCourts,
      } = req.body;

      if (
        !tournamentName ||
        !playType ||
        !teamsPerGroup ||
        !groupData ||
        !numberOfPlayersQualifiedToKnockout ||
        !numberOfCourts
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingTournament = await Tournament.findOne({ tournamentName });
      if (existingTournament) {
        return res
          .status(400)
          .json({ message: "Tournament with this name already exists" });
      }

      // 1. Create Tournament
      const createTournament = await Tournament.create({
        tournamentName,
        playType,
        teamsPerGroup,
        numberOfPlayersQualifiedToKnockout,
        numberOfCourts,
      });

      if (!createTournament) {
        return res.status(500).json({ message: "Failed to create tournament" });
      }

      let savedGroups = [];

      // 2. Loop through each group
      for (let i = 0; i < groupData.length; i++) {
        const groupInfo = groupData[i];
        const groupName = `Group ${alphabet[i]}`;
        const tournamentId = createTournament._id;
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

        // 2b. Generate matches for this group
        const groupMatches = formattedTeams.flatMap((homeTeam, i) =>
          formattedTeams.slice(i + 1).map((awayTeam) => ({
            matchName: `${homeTeam.name}-vs-${awayTeam.name}`,
            tournamentId: createTournament._id, // correct field name
            group: saveGroup._id, // correct field name
            teamsHome: [homeTeam.teamId],
            teamsAway: [awayTeam.teamId],
            scheduledTime: null,
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
          }))
        );

        // 2c. Save all matches for this group
        await GroupMatch.insertMany(groupMatches);
      }

      // 3. Link all groups to tournament
      createTournament.groups = savedGroups;
      await createTournament.save();

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

  getTournaments: async (req, res) => {
    try {
      const tournaments = await Tournament.find().select(
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
  getTournamentWithGroups: async (req, res) => {
    try {
      const tournaments = await Tournament.find().populate("groups");
      res.status(200).json({
        message: "Tournaments retrieved successfully",
        tournaments: tournaments,
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

  saveMatchScore: async (req, res) => {
    try {
      const {
        scores,
        status,
        matchName,
        matchId,
        group,
        teamsHome,
        teamsAway,
      } = req.body;

      const scoreObject = scores[0];

      let { winner, matchStatus } = determineWinner(scoreObject.sets);
      console.log("Match Winner:", winner);
      let totalPoints = getTotalPoints(scoreObject.sets);
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
  deleteTournament: async (req, res) => {
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

module.exports = teamController;
