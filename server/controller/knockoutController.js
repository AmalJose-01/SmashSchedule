const mongoose = require("mongoose");
const KnockoutTeam = require("../model/knockoutTeam");
const KnockoutMatch = require("../model/knockoutMatch.js");
// const Tournament = require("../model/Tournament");
const Group = require("../model/groupTournament");
const {
  determineKnockoutWinnerAndStatus,
} = require("../helpers/matchHelpers.js");

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

const knockoutController = {
  createTeamsForKnockout: async (req, res) => {
    // console.log("Creating teams for knockout with data:", req.body);

    try {
      const numberOfPlayersQualifiedToKnockout = 1; // You can modify this as needed or get from req.body
      const { tournamentId } = req.body;
      const groups = await Group.find({ tournamentId });

      // 2. Pick top teams based on totalPoints or pointsDiff
      let qualifiedTeams = [];
            let remainingTeams = []; // store non-qualified teams to fill odd slots

      groups.forEach((group) => {
        console.log("mergedStandings", group.teams);

        // 1. Merge standings with team names

        const mergedStandings = group.standings.map((standing) => {
          const team = group.teams.find(
            (t) => t.teamId.toString() === standing.teamId.toString()
          );
          return {
            ...standing,
            name: team ? team.name : "Unknown Team",
            teamId: team ? team.teamId : null,
            totalPoints: standing.totalPoints || 0, // ensure numeric value
            pointsDiff: standing.pointsDiff || 0,
          };
        });

        console.log("mergedStandings", mergedStandings);

        const sortedTeams = mergedStandings.slice().sort((a, b) => {
          console.log("A: b: ", a.totalPoints, b.totalPoints);

          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return b.pointsDiff - a.pointsDiff;
        });
        // Pick top N teams from each group
        const topTeams = sortedTeams
          .slice(0, numberOfPlayersQualifiedToKnockout)
          .map((team) => ({
            name: team.name,
            teamId: team.teamId,
          }));
        qualifiedTeams.push(...topTeams);

     // Take exactly the next top team from each group
  const nextTeam = sortedTeams[numberOfPlayersQualifiedToKnockout];
  if (nextTeam) {
    remainingTeams.push({
      name: nextTeam.name,
      teamId: nextTeam.teamId,
      totalPoints: nextTeam.totalPoints,
      pointsDiff: nextTeam.pointsDiff,
    });
  }



      });

      console.log("Qualified Team1", qualifiedTeams);
         console.log("remainingTeams", remainingTeams);

// 2. Ensure even number of teams

  //  if (qualifiedTeams.length % 2 !== 0 && remainingTeams.length > 0) {
  //    remainingTeams.sort((a, b) => {
  //       if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  //       return b.pointsDiff - a.pointsDiff;
  //     });
  //     qualifiedTeams.push({
  //       name: remainingTeams[0].name,
  //       teamId: remainingTeams[0].teamId,
  //     });
  //  }

  // Ensure Qualified Teams Are Even AND Minimum 8
while (
  (qualifiedTeams.length % 2 !== 0) ||      // odd count → must add 1
  (qualifiedTeams.length < 8)               // less than 8 → must add more
) {
  if (remainingTeams.length === 0) break;   // nothing left to add, stop safely

  // sort remaining best → worst
  remainingTeams.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.pointsDiff - a.pointsDiff;
  });

  const nextBest = remainingTeams.shift();  // take the BEST available

  qualifiedTeams.push({
    name: nextBest.name,
    teamId: nextBest.teamId,
  });
}




         
                  console.log("Qualified Team Final", qualifiedTeams);


      // 3. Create KnockoutTeam entries

      const roundNumber = getRoundNumber(qualifiedTeams.length);

      const knockoutTeamPromises = qualifiedTeams.map((team) =>
        KnockoutTeam.create({
          tournamentId,
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

      console.log("Knockout Teams Created:", knockoutTeams);

      //
      // 4. Generate first round matches (pair top teams)
      const shuffled = [...knockoutTeams].sort(() => Math.random() - 0.5);
      const knockoutMatches = [];
      let match = null;
      for (let i = 0; i < shuffled.length; i += 2) {
        match = await KnockoutMatch.create({
          tournamentId,
          round: roundNumber,
          teamsHome: {
            teamId: shuffled[i].teamId,
            teamName: shuffled[i].teamName,
          },
          teamsAway: {
            teamId: shuffled[i + 1].teamId,
            teamName: shuffled[i + 1].teamName,
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
        //    await knockoutMatches.create(match);
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

module.exports = knockoutController;
