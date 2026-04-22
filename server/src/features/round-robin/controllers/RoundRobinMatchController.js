const mongoose = require("mongoose");
const RoundRobinMatch = require("../models/RoundRobinMatch");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const { determineWinner, isValidScore } = require("../../../../helpers/matchHelpers");
const { updateStandings } = require("../services/standingsService");

const RoundRobinMatchController = {
  getMatches: async (req, res) => {
    try {
      const { id: tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const matches = await RoundRobinMatch.find({ tournamentId })
        .populate("player1Id", "name grade email")
        .populate("player2Id", "name grade email")
        .populate("groupId", "groupName")
        .sort({ createdAt: 1 });

      return res.status(200).json({ message: "Matches fetched", data: matches });
    } catch (error) {
      console.log("getMatches error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  recordScore: async (req, res) => {
    try {
      const { matchId } = req.params;
      const { sets } = req.body;

      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        return res.status(400).json({ message: "Invalid match id" });
      }
      if (!Array.isArray(sets) || sets.length === 0) {
        return res.status(400).json({ message: "sets array is required" });
      }

      if (!isValidScore(sets)) {
        return res.status(400).json({ message: "Invalid score — check set values (min 21, no ties)" });
      }

      const match = await RoundRobinMatch.findById(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const { winner, matchStatus } = determineWinner(sets);

      match.sets = sets;
      match.status = matchStatus === "finished" ? "completed" : "ongoing";

      if (matchStatus === "finished" && winner) {
        match.winner = winner === "home" ? match.player1Id : match.player2Id;
        match.loser = winner === "home" ? match.player2Id : match.player1Id;
      }

      await match.save();

      let updatedStandings = null;
      if (matchStatus === "finished" && match.groupId) {
        updatedStandings = await updateStandings(match, sets);
      }

      return res.status(200).json({
        message: "Score recorded",
        data: { match, standings: updatedStandings },
      });
    } catch (error) {
      console.log("recordScore error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  updateMatch: async (req, res) => {
    try {
      const { matchId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        return res.status(400).json({ message: "Invalid match id" });
      }

      const match = await RoundRobinMatch.findById(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const { court, scheduledTime, status } = req.body;
      if (court !== undefined) match.court = court;
      if (scheduledTime !== undefined) match.scheduledTime = scheduledTime;
      if (status !== undefined) match.status = status;

      await match.save();
      return res.status(200).json({ message: "Match updated", data: match });
    } catch (error) {
      console.log("updateMatch error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getStandings: async (req, res) => {
    try {
      const { id: tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const RoundRobinGroup = require("../models/RoundRobinGroup");
      const groups = await RoundRobinGroup.find({ tournamentId }).select("groupName standings");

      return res.status(200).json({ message: "Standings fetched", data: groups });
    } catch (error) {
      console.log("getStandings error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = RoundRobinMatchController;
