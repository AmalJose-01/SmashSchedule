const mongoose = require("mongoose");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const RoundRobinPlayer = require("../models/RoundRobinPlayer");
const RoundRobinGroup = require("../models/RoundRobinGroup");
const RoundRobinMatch = require("../models/RoundRobinMatch");
const { groupPlayers, generateSinglesMatches } = require("../services/matchGenerationService");

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const RoundRobinGroupController = {
  generateGroups: async (req, res) => {
    try {
      const { id: tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: tournamentId, adminId: req.userId });
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      const players = await RoundRobinPlayer.find({ tournamentId });
      if (players.length < 2) {
        return res.status(400).json({ message: "At least 2 players are required to generate groups" });
      }

      // Delete existing groups and matches for this tournament before regenerating
      await RoundRobinGroup.deleteMany({ tournamentId });
      await RoundRobinMatch.deleteMany({ tournamentId });

      const strategy = tournament.groupingStrategy || "random";
      const numberOfGroups = tournament.numberOfGroups;
      const grouped = groupPlayers(players, numberOfGroups, strategy);

      const createdGroups = [];
      const allMatches = [];
      let courtIndex = 0;

      for (let i = 0; i < grouped.length; i++) {
        const groupPlayers_ = grouped[i];
        if (groupPlayers_.length === 0) continue;

        const groupName = `Group ${alphabet[i]}`;

        const group = await RoundRobinGroup.create({
          tournamentId,
          groupName,
          players: groupPlayers_.map((p) => ({ playerId: p._id, name: p.name })),
          standings: groupPlayers_.map((p) => ({
            playerId: p._id,
            name: p.name,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointsDiff: 0,
            totalPoints: 0,
            rank: 0,
          })),
        });

        const playerRefs = groupPlayers_.map((p) => ({ playerId: p._id, name: p.name }));
        const { matches, nextCourtIndex } = generateSinglesMatches(
          playerRefs,
          tournamentId,
          group._id,
          groupName,
          tournament.numberOfCourts,
          courtIndex
        );
        courtIndex = nextCourtIndex;

        const savedMatches = await RoundRobinMatch.insertMany(matches);
        allMatches.push(...savedMatches);
        createdGroups.push(group);
      }

      // Update tournament with group references and status
      tournament.groups = createdGroups.map((g) => g._id);
      tournament.status = "Scheduled";
      await tournament.save();

      return res.status(201).json({
        message: "Groups and matches generated",
        data: { groups: createdGroups, matches: allMatches },
      });
    } catch (error) {
      console.log("generateGroups error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  saveGroups: async (req, res) => {
    try {
      const { id: tournamentId } = req.params;
      const { groups } = req.body;

      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }
      if (!Array.isArray(groups) || groups.length === 0) {
        return res.status(400).json({ message: "groups array is required" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: tournamentId, adminId: req.userId });
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      // Delete existing groups and matches
      await RoundRobinGroup.deleteMany({ tournamentId });
      await RoundRobinMatch.deleteMany({ tournamentId });

      const createdGroups = [];
      const allMatches = [];
      let courtIndex = 0;

      for (let i = 0; i < groups.length; i++) {
        const { groupName, players: playerRefs } = groups[i];

        const group = await RoundRobinGroup.create({
          tournamentId,
          groupName: groupName || `Group ${alphabet[i]}`,
          players: playerRefs,
          standings: playerRefs.map((p) => ({
            playerId: p.playerId,
            name: p.name,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointsDiff: 0,
            totalPoints: 0,
            rank: 0,
          })),
        });

        const { matches, nextCourtIndex } = generateSinglesMatches(
          playerRefs,
          tournamentId,
          group._id,
          group.groupName,
          tournament.numberOfCourts,
          courtIndex
        );
        courtIndex = nextCourtIndex;

        const savedMatches = await RoundRobinMatch.insertMany(matches);
        allMatches.push(...savedMatches);
        createdGroups.push(group);
      }

      tournament.groups = createdGroups.map((g) => g._id);
      tournament.status = "Scheduled";
      await tournament.save();

      return res.status(201).json({
        message: "Groups saved and matches generated",
        data: { groups: createdGroups, matches: allMatches },
      });
    } catch (error) {
      console.log("saveGroups error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getGroups: async (req, res) => {
    try {
      const { id: tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const groups = await RoundRobinGroup.find({ tournamentId })
        .populate("players.playerId")
        .populate("standings.playerId");

      return res.status(200).json({ message: "Groups fetched", data: groups });
    } catch (error) {
      console.log("getGroups error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = RoundRobinGroupController;
