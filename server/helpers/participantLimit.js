const Tournament = require("../model/tournamentModel.js");
const Team = require("../model/team.js");
const TournamentPlayer = require("../model/tournamentPlayer.js");

// How many more teams/players a tournament can take.
// Registered = doubles teams + singles players. A tournament never accepts
// more than its "Max Participants".
const getRemainingSlots = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId).select("maximumParticipants");
  const max = Number(tournament?.maximumParticipants) || 0;
  const [teams, players] = await Promise.all([
    Team.countDocuments({ tournamentId }),
    TournamentPlayer.countDocuments({ tournamentId }),
  ]);
  const current = teams + players;
  // max 0 / not set → no limit
  const remaining = max > 0 ? Math.max(0, max - current) : Infinity;
  return { max, current, remaining };
};

const fullMessage = (max) => `Tournament is full (max ${max} participants)`;

module.exports = { getRemainingSlots, fullMessage };
