const mongoose = require("mongoose");
const RoundRobinTournament = require("../models/RoundRobinTournament");

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
        startDate,
        endDate,
        groupingStrategy,
        pointsForWin,
        pointsForLoss,
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
        startDate,
        endDate,
        groupingStrategy: groupingStrategy || "random",
        pointsForWin: pointsForWin ?? 2,
        pointsForLoss: pointsForLoss ?? 0,
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
        "numberOfGroups", "playersPerGroup", "startDate", "endDate",
        "groupingStrategy", "pointsForWin", "pointsForLoss", "status",
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

      const tournament = await RoundRobinTournament.findOneAndUpdate(
        { _id: id, adminId: req.userId },
        { status: "Scheduled" },
        { new: true }
      );

      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      return res.status(200).json({ message: "Tournament finalized", data: tournament });
    } catch (error) {
      console.log("finalizeTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = RoundRobinTournamentController;
