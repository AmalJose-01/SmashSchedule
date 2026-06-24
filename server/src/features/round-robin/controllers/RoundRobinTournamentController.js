const mongoose = require("mongoose");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const RoundRobinGroup = require("../models/RoundRobinGroup");
const RoundRobinMatch = require("../models/RoundRobinMatch");
const { generateSinglesMatches, generateDoublesMatches } = require("../services/matchGenerationService");

const RoundRobinTournamentController = {
  createTournament: async (req, res) => {
    try {
      const {
        tournamentName,
        matchType,
        description,
        numberOfCourts,
        numberOfGroups,
        playersPerGroup,
        numberOfMatchesPerMember,
        startDate,
        endDate,
        groupingStrategy,
        pointsForWin,
        pointsForLoss,
        entryFee,
        numberOfSets,
        setWinningPoint,
        winningPointGap,
      } = req.body;

      if (!tournamentName || !matchType || !numberOfCourts || !numberOfGroups || !playersPerGroup) {
        return res.status(400).json({
          message: "tournamentName, matchType, numberOfCourts, numberOfGroups, and playersPerGroup are required",
        });
      }

      const tournament = await RoundRobinTournament.create({
        adminId: req.userId,
        tournamentName,
        matchType,
        description,
        numberOfCourts,
        numberOfGroups,
        playersPerGroup,
        numberOfMatchesPerMember: numberOfMatchesPerMember ?? 3,
        startDate,
        endDate,
        groupingStrategy: groupingStrategy || "random",
        pointsForWin: pointsForWin ?? 2,
        pointsForLoss: pointsForLoss ?? 0,
        entryFee: entryFee ?? 0,
        numberOfSets: numberOfSets ?? 3,
        setWinningPoint: setWinningPoint ?? 21,
        winningPointGap: winningPointGap ?? 2,
        status: "Draft",
      });

      return res.status(201).json({ message: "Tournament created", data: tournament });
    } catch (error) {
      console.log("createTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getTournaments: async (req, res) => {
    try {
      const tournaments = await RoundRobinTournament.find({ adminId: req.userId }).sort({ createdAt: -1 });
      return res.status(200).json({ message: "Tournaments fetched", data: tournaments });
    } catch (error) {
      console.log("getTournaments error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getTournamentById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: id, adminId: req.userId })
        .populate("groups");

      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      return res.status(200).json({ message: "Tournament fetched", data: tournament });
    } catch (error) {
      console.log("getTournamentById error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  updateTournament: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: id, adminId: req.userId });
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      const allowedFields = [
        "tournamentName", "matchType", "description", "numberOfCourts",
        "numberOfGroups", "playersPerGroup", "numberOfMatchesPerMember", "startDate", "endDate",
        "groupingStrategy", "pointsForWin", "pointsForLoss", "status", "entryFee",
        "numberOfSets", "setWinningPoint", "winningPointGap",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          tournament[field] = req.body[field];
        }
      });

      await tournament.save();
      return res.status(200).json({ message: "Tournament updated", data: tournament });
    } catch (error) {
      console.log("updateTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  deleteTournament: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const tournament = await RoundRobinTournament.findOneAndDelete({ _id: id, adminId: req.userId });
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      return res.status(200).json({ message: "Tournament deleted" });
    } catch (error) {
      console.log("deleteTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  finalizeTournament: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: id, adminId: req.userId });
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      if (["Finalized", "Ongoing", "Completed"].includes(tournament.status)) {
        return res.status(400).json({ message: "Tournament has already been finalized" });
      }

      const groups = await RoundRobinGroup.find({ tournamentId: id });
      if (groups.length === 0) {
        return res.status(400).json({ message: "Generate groups before finalizing the tournament" });
      }

      // Finalizing is what schedules the matches — it (re)generates the
      // match schedule from the current group arrangement, then locks the
      // groups against further rearrangement.
      await RoundRobinMatch.deleteMany({ tournamentId: id });

      const isDoubles = tournament.matchType === "Doubles";
      let allMatches = [];

      if (isDoubles) {
        const allGroupData = groups.map((group) => ({
          groupId: group._id,
          groupName: group.groupName,
          players: group.players.map((p) => ({ playerId: p.playerId, name: p.name })),
        }));
        const { matches } = generateDoublesMatches(
          allGroupData,
          id,
          tournament.numberOfCourts,
          tournament.numberOfMatchesPerMember
        );
        allMatches = await RoundRobinMatch.insertMany(matches);
      } else {
        let courtIndex = 0;
        for (const group of groups) {
          const playerRefs = group.players.map((p) => ({ playerId: p.playerId, name: p.name }));
          const { matches, nextCourtIndex } = generateSinglesMatches(
            playerRefs,
            id,
            group._id,
            group.groupName,
            tournament.numberOfCourts,
            courtIndex,
            tournament.numberOfMatchesPerMember
          );
          courtIndex = nextCourtIndex;
          const savedMatches = await RoundRobinMatch.insertMany(matches);
          allMatches.push(...savedMatches);
        }
      }

      tournament.status = "Finalized";
      await tournament.save();

      return res.status(200).json({
        message: "Tournament finalized — matches scheduled",
        data: { tournament, matches: allMatches },
      });
    } catch (error) {
      console.log("finalizeTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = RoundRobinTournamentController;
