const mongoose = require("mongoose");
const KnockoutTeam = require("../model/knockoutTeam");
const KnockoutMatch = require("../model/knockoutMatch.js");
// const Tournament = require("../model/Tournament");
const Group = require("../model/groupTournament");
const {
  determineKnockoutWinnerAndStatus,
  buildCrossGroupKnockoutPairs,
} = require("../helpers/matchHelpers.js");
const { selectKnockoutQualifiers, roundNumberForSize } = require("../helpers/knockoutQualifiers.js");

function getRoundNumber(numTeams) {
  switch (numTeams) {
    case 16:
      return 1; // Round of 16
    case 8:
      return 2; // Quarterfinals
    case 4:
      return 3; // Semifinals
    case 2:
      return 4; // Final
    default:
      return 1; // fallback
  }
}

const getKnockoutSize = (count) => {
  console.log("getKnockoutSize",count);
  
  if (count >= 9) return 16;
  if (count >= 7) return 8;
  if (count >= 5) return 6;
  if (count >= 3) return 4;
  if (count >= 2) return 2;


  return 0; // invalid
};

async function generateNextRound(tournamentId, round) {
  const currentMatches = await KnockoutMatch.find({ tournamentId, round });

  let winners = [];

  currentMatches.forEach((match) => {
    if (match.winner) {
      if (match.winner === "home") {
        winners.push(match.teamsHome); // { teamId, teamName }
      } else if (match.winner === "away") {
        winners.push(match.teamsAway); // { teamId, teamName }
      }
    }
  });

  console.log("currentMatches", round - 1, ":", currentMatches);

  console.log("Winners for round", round - 1, ":", winners);

  if (winners.length % 2 !== 0) return; // cannot form next round yet

  const nextRound = round + 1;

  for (let i = 0; i < winners.length; i += 2) {
    await KnockoutMatch.create({
      tournamentId,
      round: nextRound,
      teamsHome: winners[i],
      teamsAway: winners[i + 1],
      scores: [
        { home: 0, away: 0 },
        { home: 0, away: 0 },
        { home: 0, away: 0 },
      ],
      status: "scheduled",
    });
  }
}

const adminKnockoutController = {
  createTeamsForKnockout: async (req, res) => {
    console.log("Creating teams for knockout with data:", req.body);

    try {
      // const numberOfPlayersQualifiedToKnockout = 1; // You can modify this as needed or get from req.body
      const { _id, numberOfPlayersQualifiedToKnockout } = req.body;
      const groups = await Group.find({ tournamentId: _id });

      // Don't create a second bracket if one already exists.
      if (await KnockoutMatch.exists({ tournamentId: _id })) {
        return res.status(409).json({ message: "Knockout fixtures already created" });
      }

      // 2. Top N per group, then fill up to a full bracket (16, 8, 4...)
      //    with the next-best teams — see helpers/knockoutQualifiers.js.
      const { qualified: qualifiedTeams, size } = selectKnockoutQualifiers(
        groups,
        numberOfPlayersQualifiedToKnockout
      );
      if (size < 2) {
        return res.status(400).json({ message: "Not enough teams for a knockout stage" });
      }

      console.log("Qualified Team Final", qualifiedTeams);

      // 3. Create KnockoutTeam entries

      const roundNumber = roundNumberForSize(qualifiedTeams.length);

      const knockoutTeamPromises = qualifiedTeams.map((team) =>
        KnockoutTeam.create({
          tournamentId: _id,
          teamId: team.teamId,
          teamName: team.name,
          round: roundNumber,
          status: "active",
        })
      );

      if (!knockoutTeamPromises.length) {
        return res
          .status(400)
          .json({ message: "No teams qualified for knockout stage" });
      }

      const knockoutTeams = await Promise.all(knockoutTeamPromises);

      // 4. Generate first round matches — cross-group seeding instead of a
      // random draw: Group A winner vs Group B runner-up, Group B winner vs
      // Group A runner-up (and so on for further groups). See
      // buildCrossGroupKnockoutPairs in helpers/matchHelpers.js.
      const qualifiedById = new Map(qualifiedTeams.map((t) => [String(t.teamId), t]));
      const seedingInput = knockoutTeams.map((kt) => {
        const meta = qualifiedById.get(String(kt.teamId)) || {};
        return {
          teamId: kt.teamId,
          teamName: kt.teamName,
          groupName: meta.groupName,
          rank: meta.rank || 1,
          totalPoints: meta.totalPoints,
          pointsDiff: meta.pointsDiff,
        };
      });
      const pairs = buildCrossGroupKnockoutPairs(seedingInput);

      let match = null;
      for (const [home, away] of pairs) {
        if (!home || !away) {
          // One truly unpaired leftover (see buildCrossGroupKnockoutPairs) —
          // shouldn't normally happen since bracket sizes are kept even;
          // skip rather than create a match with a missing side.
          continue;
        }
        match = await KnockoutMatch.create({
          tournamentId: _id,
          round: roundNumber,
          teamsHome: {
            teamId: home.teamId,
            teamName: home.teamName ?? home.name,
          },
          teamsAway: {
            teamId: away.teamId,
            teamName: away.teamName ?? away.name,
          },
          scores: [
            {
              home: 0,
              away: 0,
            },
            { home: 0, away: 0 },
            { home: 0, away: 0 },
          ],
          status: "scheduled",
        });
      }

      if (!match) {
        return res
          .status(400)
          .json({ message: "No matches created for knockout stage" });
      }

      res.status(200).json({
        message: "Top teams picked for knockout stage",
        teams: knockoutTeams,
        matches: match,
      });
    } catch (error) {
      console.error("Error picking top teams for knockout:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getKnockoutMatches: async (req, res) => {
    try {
      const { tournamentId } = req.params;
      console.log("Fetching matches for tournament:", tournamentId);

      const matches = await KnockoutMatch.find({ tournamentId }).sort({
        round: 1,
      });

      console.log("Matches fetched for tournament:", tournamentId, matches);

      res.status(200).json({
        message: "Knockout matches retrieved successfully",
        matches: matches,
      });
    } catch (error) {
      console.error("Error fetching knockout matches:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  saveKnockoutScore: async (req, res) => {
    try {
      const { matchId } = req.params;
      const { scores } = req.body;

      const match = await KnockoutMatch.findById(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      match.scores = scores;

      // Determine winner using helper function
      const { winner, status } = determineKnockoutWinnerAndStatus(
        scores,
        match.teamsHome,
        match.teamsAway
      );
      match.winner = winner
        ? winner === match.teamsHome
          ? "home"
          : "away"
        : null;
      match.status = status;

      await match.save();
      // Generate next round if applicable
      // Check if all matches in this round are finished
      const unfinishedMatches = await KnockoutMatch.find({
        tournamentId: match.tournamentId,
        round: match.round,
        status: { $ne: "finished" }, // or "completed" depending on your enum
      });

      console.log("Unfinished matches:", unfinishedMatches);

      if (unfinishedMatches.length === 0) {
        // All matches in this round are finished, generate next round
        await generateNextRound(match.tournamentId, match.round);
      }
      res
        .status(200)
        .json({ message: "Knockout score saved successfully", match });
    } catch (error) {
      console.error("Error saving knockout score:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = adminKnockoutController;
