const mongoose = require("mongoose");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const RoundRobinMatch = require("../models/RoundRobinMatch");

// Read-only round robin schedule for players (standings are admin-only). Only
// exposes names — no emails/contacts — since any signed-in player can open it.
const PlayerRoundRobinController = {
  getRoundRobinView: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid round robin" });
      }

      const tournament = await RoundRobinTournament.findById(id)
        .select("tournamentName matchType format status startDate endDate numberOfCourts numberOfSlots numberOfSets setWinningPoint winningPointGap description adminId")
        .lean();
      if (!tournament) return res.status(404).json({ message: "Round robin not found" });

      const matches = await RoundRobinMatch.find({ tournamentId: id })
          .select("matchName player1Id player1PartnerId player2Id player2PartnerId groupId gradeGroupLabel court slot status sets winner isDraw isBye createdAt")
          .populate("player1Id", "name")
          .populate("player1PartnerId", "name")
          .populate("player2Id", "name")
          .populate("player2PartnerId", "name")
          .populate("groupId", "groupName")
          .sort({ slot: 1, createdAt: 1 })
          .lean();

      const { adminId, ...safeTournament } = tournament;
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ tournament: safeTournament, matches });
    } catch (error) {
      console.error("getRoundRobinView error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = PlayerRoundRobinController;
