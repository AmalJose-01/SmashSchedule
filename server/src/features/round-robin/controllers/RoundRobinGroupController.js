const mongoose = require("mongoose");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const RoundRobinPlayer = require("../models/RoundRobinPlayer");
const RoundRobinGroup = require("../models/RoundRobinGroup");
const RoundRobinMatch = require("../models/RoundRobinMatch");
const { groupPlayers } = require("../services/matchGenerationService");

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
      const isDoubles = tournament.matchType === "Doubles";
      // Doubles needs at least 3 players per group to form C(3,2)=3 pair combinations
      const minPlayers = isDoubles ? tournament.numberOfGroups * 3 : 2;
      if (players.length < minPlayers) {
        return res.status(400).json({ message: `At least ${minPlayers} players are required to generate groups` });
      }

      // Delete existing groups and matches for this tournament before regenerating.
      // Matches are tied to a specific group composition, so any matches that
      // existed (e.g. from a previous finalize) are no longer valid once the
      // groups are regenerated — the admin will need to Finalize again to
      // re-create the match schedule.
      await RoundRobinGroup.deleteMany({ tournamentId });
      await RoundRobinMatch.deleteMany({ tournamentId });

      const strategy = tournament.groupingStrategy || "random";
      const numberOfGroups = tournament.numberOfGroups;
      const grouped = groupPlayers(players, numberOfGroups, strategy);

      const createdGroups = [];

      // ── Create group documents only — matches are generated separately at
      //    Finalize time, so groups can be freely rearranged until then. ─────
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
        createdGroups.push({ group, players: groupPlayers_ });
      }

      // Attach the new group references. Status is left untouched here —
      // it only moves to "Finalized" once the admin clicks Finalize, which
      // is also when the match schedule is generated.
      tournament.groups = createdGroups.map(({ group }) => group._id);
      await tournament.save();

      return res.status(201).json({
        message: "Groups generated",
        data: { groups: createdGroups.map(({ group }) => group) },
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

      // Delete existing groups and any matches (a previous match schedule, if
      // any, no longer matches this new arrangement and must be regenerated
      // via Finalize).
      await RoundRobinGroup.deleteMany({ tournamentId });
      await RoundRobinMatch.deleteMany({ tournamentId });

      const createdGroups = [];

      // ── Create group documents only — no match generation here. ─────────────
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
        createdGroups.push({ group, playerRefs });
      }

      tournament.groups = createdGroups.map(({ group }) => group._id);
      await tournament.save();

      return res.status(201).json({
        message: "Groups saved",
        data: { groups: createdGroups.map(({ group }) => group) },
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
