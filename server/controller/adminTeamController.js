const mongoose = require("mongoose");

const Team = require("../model/team.js");
const Tournament = require("../model/tournamentModel.js");
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
const adminTeamController = {
createMultipleTeam: async (req, res) => {
  console.log("createMultipleTeam");

  try {
    const { teams } = req.body;

    if (!Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ message: "Teams array is required" });
    }

    const skippedTeams = [];

    // Collect all emails & contacts from request
    const emails = teams.flatMap((t) => [t.playerOneEmail, t.playerTwoEmail]);
    const contacts = teams.flatMap((t) => [t.playerOneContact, t.playerTwoContact]);

    // Fetch all existing emails & contacts from DB in one query
    const existingTeams = await Team.find({
      $or: [
        { playerOneEmail: { $in: emails } },
        { playerTwoEmail: { $in: emails } },
        { playerOneContact: { $in: contacts } },
        { playerTwoContact: { $in: contacts } },
      ],
    });

    const existingEmails = new Set(
      existingTeams.flatMap((t) => [t.playerOneEmail, t.playerTwoEmail])
    );
    const existingContacts = new Set(
      existingTeams.flatMap((t) => [t.playerOneContact, t.playerTwoContact])
    );

    // Filter teams that can be inserted
    const teamsToInsert = teams.filter((team) => {
      const duplicate =
        existingEmails.has(team.playerOneEmail) ||
        existingEmails.has(team.playerTwoEmail) ||
        existingContacts.has(team.playerOneContact) ||
        existingContacts.has(team.playerTwoContact);

      if (duplicate) skippedTeams.push(team);
      return !duplicate;
    });

    // Insert remaining teams
    const savedTeams =
      teamsToInsert.length > 0
        ? await Team.insertMany(teamsToInsert, { ordered: false })
        : [];

        console.log("savedTeams",savedTeams);
        

    res.status(201).json({
      message: "Teams processed successfully",
      insertedCount: savedTeams.length,
      skippedCount: skippedTeams.length,
      insertedTeams: savedTeams,
      skippedTeams,
    });
  } catch (error) {
    console.error("Create multiple team error", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
},

 deleteTeam: async (req, res) => {
    console.log("Admin Delete");

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





  getTeams: async (req, res) => {
    try {
      const { tournamentId } = req.params;

      const teams = await Team.find({ tournamentId: tournamentId });
      res
        .status(200)
        .json({ message: "Teams retrieved successfully", teams: teams });
    } catch (error) {
      console.log("Get teams error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  // done

  createTournament: async (req, res) => {
    console.log("createTournament called  ", req.body);

    try {
      const {
        tournamentName,
        playType,
        teamsPerGroup,
        numberOfPlayersQualifiedToKnockout,
        numberOfCourts,
        date,
        time,
        location,
        maximumParticipants,
        matchType,
        description,
        registrationFee,
      } = req.body;

      if (
        !req.userId ||
        !tournamentName ||
        !playType ||
        !teamsPerGroup ||
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
        adminId: req.userId,
        date,
        time,
        location,
        maximumParticipants,
        matchType,
        description,
        status: "Create",
        registrationFee,
      });

      if (!createTournament) {
        return res.status(500).json({ message: "Failed to create tournament" });
      }

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

  createMatches: async (req, res) => {
    console.log("createMatches called  ", req.body);

    try {
      const { tournamentName, groups, tournamentID, numberOfCourts } = req.body;

      if (
        !req.userId ||
        !tournamentName ||
        !groups ||
        !tournamentID ||
        !numberOfCourts
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingTournament = await Tournament.findOne({
        _id: tournamentID,
      });
      if (!existingTournament) {
        return res.status(400).json({ message: "Tournament not found" });
      }

      let savedGroups = [];

      // COURT LIST
      const courts = Array.from(
        { length: numberOfCourts },
        (_, idx) => `Court ${idx + 1}`
      );
      const totalGroups = groups.length;
      const baseCourts = Math.floor(numberOfCourts / totalGroups);
      let extraCourts = numberOfCourts % totalGroups;

      const groupCourts = []; // courts assigned per group

      let courtIndex = 0;

      for (let i = 0; i < totalGroups; i++) {
        let courtCount = baseCourts;

        if (extraCourts > 0) {
          courtCount++;
          extraCourts--;
        }

        const courtsForThisGroup = courts.slice(
          courtIndex,
          courtIndex + courtCount
        );

        groupCourts.push(courtsForThisGroup);
        courtIndex += courtCount;
      }

      // ----------------------------------------
      // 2. CREATE GROUPS + MATCHES
      // ----------------------------------------
      for (let i = 0; i < groups.length; i++) {
        const groupInfo = groups[i];
        const groupName = `Group ${alphabet[i]}`;
        const tournamentId = existingTournament._id;
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

        const courtsAssigned = groupCourts[i];

        // 2b. Generate matches for this group
        let matchIndex = 0;
        const groupMatches = formattedTeams.flatMap((homeTeam, i) =>
          formattedTeams.slice(i + 1).map((awayTeam) => {
            const court = courtsAssigned[matchIndex % courtsAssigned.length];
            matchIndex++;
            return {
              matchName: `${homeTeam.name}-vs-${awayTeam.name}`,
              tournamentId: existingTournament._id,
              group: saveGroup._id,
              teamsHome: [homeTeam.teamId],
              teamsAway: [awayTeam.teamId],
              scheduledTime: null,
              court: court,
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
            };
          })
        );

        // 2c. Save all matches for this group
        await GroupMatch.insertMany(groupMatches);
      }

      // 3. Link all groups to tournament
      existingTournament.groups = savedGroups;
      existingTournament.status = "Scheduled";
      await existingTournament.save();

      console.log("scheduled ", existingTournament);
      res.status(201).json({
        message: "Match scheduled successfully",
        tournament: existingTournament,
      });
    } catch (error) {
      console.log("Match scheduled  error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  // done
  getTournaments: async (req, res) => {
    console.log("eq.userId", req.userId);

    try {
      if (!req.userId) {
        return res.status(400).json({ message: "Unable to retrieve data" });
      }
      const tournaments = await Tournament.find({ adminId: req.userId }).select(
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

  // done
  getTournamentInformation: async (req, res) => {
    console.log("eq.userId", req.userId);

    try {
      if (!req.userId) {
        return res.status(400).json({ message: "Unable to retrieve data" });
      }
      const { tournamentId } = req.params;

      const tournament = await Tournament.findOne({
        _id: tournamentId,
        adminId: req.userId, // only allow access if the admin owns it
      });

      console.log(
        "Tournaments fetched===========================================================================:",
        tournament
      );
      res.status(200).json({
        message: "Tournaments retrieved successfully",
        tournaments: tournament,
      });
    } catch (error) {
      console.log("Get tournaments error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  // Done
  getTournamentDetails: async (req, res) => {
    console.log("Call Admin");

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

  // Done
  saveMatchScore: async (req, res) => {
    console.log("Call Admin Save");

    try {
      const { scores, status, matchId, group } = req.body;

      const scoreObject = scores[0];

      let { winner, matchStatus } = determineWinner(scoreObject.sets);
      console.log("Match Winner:", winner);
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
  saveMultipleMatchScore: async (req, res) => {
    try {
      const { matches } = req.body;

      if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return res.status(400).json({ message: "No matches provided" });
      }

      console.log("Call Admin Save", matches);

      for (const match of matches) {
        const { matchId, scores } = match;
        if (!matchId || !scores || scores.length === 0) continue;
        const scoreObject = scores[0];
        let { winner, matchStatus } = determineWinner(scoreObject.sets);
        // Save/update match scores
        await GroupMatch.findByIdAndUpdate(
          matchId,
          {
            $set: {
              "scores.0.sets": scoreObject.sets,
              status: matchStatus,
            },
          },
          { new: true }
        );
        /* --------------------------------------------------
       2️⃣ Collect UNIQUE group IDs
    -------------------------------------------------- */
        const groupIds = [...new Set(matches.map((m) => m.group))];

        const updatedGroups = [];

        for (const groupId of groupIds) {
          const groupDoc = await Group.findById(groupId);
          if (!groupDoc) continue;

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
          const groupMatches = await GroupMatch.find({ group: groupId });
          for (const match of groupMatches) {
            if (!match.scores || match.scores.length === 0) continue;

            const sets = match.scores[0].sets;
            const isPlayed = sets.some((set) => set.home > 0 || set.away > 0);
            if (!isPlayed) continue;

            const { winner } = determineWinner(sets);
            const points = getTotalPoints(sets);

            const homeId = match.teamsHome.toString();
            const awayId = match.teamsAway.toString();

            const homeStanding = groupDoc.standings.find(
              (s) => s.teamId === homeId
            );
            const awayStanding = groupDoc.standings.find(
              (s) => s.teamId === awayId
            );

            if (!homeStanding || !awayStanding) continue;

            homeStanding.matchesPlayed += 1;
            awayStanding.matchesPlayed += 1;

            if (winner === "home") {
              homeStanding.wins += 1;
              awayStanding.losses += 1;
              homeStanding.totalPoints += 3;
              groupDoc.status = "finished";
            } else if (winner === "away") {
              awayStanding.wins += 1;
              homeStanding.losses += 1;
              awayStanding.totalPoints += 3;
              groupDoc.status = "finished";
            }

            homeStanding.pointsFor += points.homeTotal;
            homeStanding.pointsAgainst += points.awayTotal;
            homeStanding.pointsDiff =
              homeStanding.pointsFor - homeStanding.pointsAgainst;

            awayStanding.pointsFor += points.awayTotal;
            awayStanding.pointsAgainst += points.homeTotal;
            awayStanding.pointsDiff =
              awayStanding.pointsFor - awayStanding.pointsAgainst;
          }

          const savedGroup = await groupDoc.save();
          updatedGroups.push(savedGroup);
        }
      }

      return res.status(200).json({
        message: "Multiple match scores saved successfully",
        totalMatchesUpdated: matches.length,
        groupsUpdated: updatedGroups.length,
        groups: updatedGroups,
      });
    } catch (error) {
      console.log("Save match score error", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
  deleteTournament: async (req, res) => {
    console.log("Admin Delete");

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

module.exports = adminTeamController;
