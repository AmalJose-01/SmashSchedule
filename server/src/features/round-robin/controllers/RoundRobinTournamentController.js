const mongoose = require("mongoose");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const RoundRobinGroup = require("../models/RoundRobinGroup");
const RoundRobinMatch = require("../models/RoundRobinMatch");
const RoundRobinPlayer = require("../models/RoundRobinPlayer");
const {
  generateSinglesMatches,
  generateDoublesMatches,
  generateMakeupMatches,
  generateByeMatches,
} = require("../services/matchGenerationService");
const { generateGradedRoundRobin, toFlatGradedMatchList } = require("../services/gradedRoundRobinEngine");
const { applyByeStanding } = require("../services/standingsService");
const { applyMatchPoints } = require("../services/memberPointsService");

const RoundRobinTournamentController = {
  createTournament: async (req, res) => {
    try {
      const {
        tournamentName,
        matchType,
        format,
        description,
        numberOfCourts,
        numberOfGroups,
        playersPerGroup,
        numberOfMatchesPerMember,
        startDate,
        endDate,
        groupingStrategy,
        gradeOrder,
        pointsForWin,
        pointsForLoss,
        entryFee,
        entryFeeMember,
        entryFeeNonMember,
        numberOfSets,
        setWinningPoint,
        winningPointGap,
      } = req.body;

      const isGraded = format === "Graded";

      if (!tournamentName || !matchType || !numberOfCourts) {
        return res.status(400).json({
          message: "tournamentName, matchType, and numberOfCourts are required",
        });
      }
      // Balanced format needs its groups sized up front; Graded groups
      // players by grade automatically at finalize time instead, so it
      // doesn't ask for these at all.
      if (!isGraded && (!numberOfGroups || !playersPerGroup)) {
        return res.status(400).json({
          message: "numberOfGroups and playersPerGroup are required for the Balanced format",
        });
      }

      const tournament = await RoundRobinTournament.create({
        adminId: req.userId,
        tournamentName,
        matchType,
        format: isGraded ? "Graded" : "Balanced",
        description,
        numberOfCourts,
        numberOfGroups: isGraded ? undefined : numberOfGroups,
        playersPerGroup: isGraded ? undefined : playersPerGroup,
        numberOfMatchesPerMember: numberOfMatchesPerMember ?? 3,
        startDate,
        endDate,
        groupingStrategy: groupingStrategy || "random",
        gradeOrder: isGraded && Array.isArray(gradeOrder) && gradeOrder.length ? gradeOrder : undefined,
        pointsForWin: pointsForWin ?? 2,
        pointsForLoss: pointsForLoss ?? 0,
        entryFee: entryFee ?? 0,
        entryFeeMember: entryFeeMember ?? 0,
        entryFeeNonMember: entryFeeNonMember ?? 0,
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
        "tournamentName", "matchType", "format", "description", "numberOfCourts",
        "numberOfGroups", "playersPerGroup", "numberOfMatchesPerMember", "startDate", "endDate",
        "groupingStrategy", "gradeOrder", "pointsForWin", "pointsForLoss", "status", "entryFee",
        "entryFeeMember", "entryFeeNonMember",
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

      if (tournament.format === "Graded") {
        return RoundRobinTournamentController._finalizeGradedTournament(req, res, tournament, id);
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
      let rawMatches = [];
      let makeupTarget = tournament.numberOfMatchesPerMember;

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
        rawMatches = matches;
      } else {
        // Singles matches are only ever played within a group FOR THIS
        // FIRST PASS, so a group's size is a hard ceiling on how many
        // distinct opponents generateSinglesMatches can find within it (n
        // players → at most n-1 matches each). Players don't divide evenly
        // across groups every time (e.g. 7 players / 2 groups = 4 + 3), and
        // generateSinglesMatches was previously called with the same
        // requested numberOfMatchesPerMember for every group regardless of
        // size — fine for the bigger group, but the smaller group would
        // silently fall back to its own (lower) full-round-robin ceiling,
        // leaving its players with fewer games than everyone else after
        // this pass. Capping every group's FIRST-PASS call to whatever the
        // SMALLEST group can support keeps that first pass balanced across
        // groups instead of lopsided. Groups that are all the same size are
        // unaffected — the cap just matches what they'd already get.
        //
        // BUG FIX: `makeupTarget` must stay the admin's actual requested
        // "Number of Matches per Member" (`requestedTarget`), NOT this
        // group-size cap. The cap only exists because generateSinglesMatches
        // is confined to one group's own players — the makeup pass right
        // below is NOT confined that way (its matches are cross-group,
        // groupId: null, by design), so it's fully able to top a small
        // group's players up past their own group's ceiling by pairing them
        // against shortfall players from OTHER groups. Reusing the capped
        // value here defeated that entirely: every player in a small group
        // (e.g. a 4-player group, ceiling 3) got stuck at the cap forever,
        // no matter how high the admin actually set the target — exactly
        // the "always 3, ignores my setting" bug this fixes.
        const groupSizes = groups.map((group) => group.players.length).filter((size) => size >= 2);
        const smallestGroupCap = groupSizes.length ? Math.min(...groupSizes) - 1 : 0;
        const requestedTarget = tournament.numberOfMatchesPerMember;
        const effectiveMatchesPerMember =
          smallestGroupCap > 0
            ? requestedTarget > 0
              ? Math.min(requestedTarget, smallestGroupCap)
              : smallestGroupCap
            : requestedTarget;
        // makeupTarget was already initialized to tournament.numberOfMatchesPerMember
        // above (shared with the Doubles branch) — intentionally left as the
        // real requested target here, not reassigned to effectiveMatchesPerMember.

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
            effectiveMatchesPerMember
          );
          courtIndex = nextCourtIndex;
          rawMatches.push(...matches);
        }
      }

      // Makeup pass: some players can still land short of the target after
      // the group/fixture-based generation above (an unavoidable structural
      // gap — see the comments in matchGenerationService). Schedule a
      // catch-up match for each of them against another shortfall player of
      // the SAME grade only, so no one gets a mismatched opponent just to
      // hit a number. Players with no same-grade shortfall partner are left
      // short and reported back in the response.
      const allPlayerDocs = await RoundRobinPlayer.find({ tournamentId: id }).select("name grade");
      const { matches: makeupMatches, stillShortPlayerIds } = generateMakeupMatches(
        allPlayerDocs.map((p) => ({ playerId: p._id, name: p.name, grade: p.grade })),
        rawMatches,
        makeupTarget,
        tournament.matchType,
        id,
        tournament.numberOfCourts,
        rawMatches.length
      );

      // BYE pass: anyone STILL short after the makeup pass (no same-grade
      // shortfall partner was available) is never just left short — they're
      // awarded an automatic bye instead, so their match count, personal
      // points, and group standings all come out even with everyone else's.
      // Attribute each bye to the player's own group (so it lands in that
      // group's standings, same as a real win would) via a playerId →
      // groupId lookup built from the groups fetched above.
      const playerGroupIdMap = new Map();
      groups.forEach((group) => {
        (group.players || []).forEach((p) => {
          if (p.playerId) playerGroupIdMap.set(String(p.playerId), String(group._id));
        });
      });

      const { matches: byeMatches } = generateByeMatches(
        allPlayerDocs.map((p) => ({ playerId: p._id, name: p.name })),
        [...rawMatches, ...makeupMatches],
        makeupTarget,
        tournament.matchType,
        id,
        playerGroupIdMap
      );

      const allMatches = await RoundRobinMatch.insertMany([...rawMatches, ...makeupMatches, ...byeMatches]);

      // Bye matches are pre-resolved (no live score to enter) — apply their
      // points + standings immediately, exactly as a real match would get on
      // score entry, instead of waiting for an admin action that will never
      // come.
      const insertedByeMatches = allMatches.filter((m) => m.isBye);
      for (const byeMatch of insertedByeMatches) {
        const populatedBye = await RoundRobinMatch.findById(byeMatch._id)
          .populate("player1Id", "name memberId")
          .populate("player1PartnerId", "name memberId");
        await applyMatchPoints(populatedBye, "home", 1);
        await applyByeStanding(populatedBye);
      }

      tournament.status = "Finalized";
      await tournament.save();

      const stillShortPlayers = stillShortPlayerIds.length
        ? allPlayerDocs
            .filter((p) => stillShortPlayerIds.includes(String(p._id)))
            .map((p) => ({ id: p._id, name: p.name, grade: p.grade }))
        : [];

      const messageParts = ["Tournament finalized — matches scheduled"];
      if (makeupMatches.length) {
        messageParts.push(
          `${makeupMatches.length} makeup match${makeupMatches.length === 1 ? "" : "es"} added to top up shortfall players`
        );
      }
      if (byeMatches.length) {
        messageParts.push(
          `${byeMatches.length} bye${byeMatches.length === 1 ? "" : "s"} awarded to players with no available opponent`
        );
      }

      return res.status(200).json({
        message:
          messageParts.length > 1
            ? `${messageParts[0]} (${messageParts.slice(1).join("; ")})`
            : messageParts[0],
        data: {
          tournament,
          matches: allMatches,
          // Kept for backward compatibility, but the bye pass above means
          // this should now always come back empty — every previously
          // "still short" player gets a bye instead.
          ...(stillShortPlayers.length ? { stillShortPlayers } : {}),
        },
      });
    } catch (error) {
      console.log("finalizeTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // Graded Round Robin finalize path — split out of finalizeTournament
  // above (which dispatches here when tournament.format === "Graded")
  // since the two formats don't share any of the group/makeup/bye
  // machinery: Graded auto-groups by grade at finalize time instead of
  // using pre-built RoundRobinGroup docs, and its own queue-based
  // scheduler (see gradedRoundRobinEngine.js) already gives every player a
  // fair, complete match count on its own — no separate makeup/bye pass
  // needed.
  //
  // Optional body fields:
  //   overridesByPlayerId: { [playerId]: "A".."G" } — per-night manual
  //     grade moves (spec: "Admin can manually move any player to a
  //     different grade group for that night only"); doesn't touch the
  //     player's stored profile grade.
  _finalizeGradedTournament: async (req, res, tournament, id) => {
    try {
      const players = await RoundRobinPlayer.find({ tournamentId: id }).select("name grade");
      if (players.length < 2) {
        return res.status(400).json({ message: "Add at least 2 players before finalizing" });
      }

      const { overridesByPlayerId = {} } = req.body || {};

      await RoundRobinMatch.deleteMany({ tournamentId: id });

      const result = generateGradedRoundRobin(
        players.map((p) => ({ id: p._id, name: p.name, grade: p.grade })),
        {
          gradeOrder: tournament.gradeOrder && tournament.gradeOrder.length ? tournament.gradeOrder : undefined,
          overridesByPlayerId,
          numberOfCourts: tournament.numberOfCourts,
          matchType: tournament.matchType,
          baseGamesPerPlayer: tournament.numberOfMatchesPerMember,
        }
      );

      const flatMatches = toFlatGradedMatchList(result, { tournamentId: id });
      const allMatches = flatMatches.length ? await RoundRobinMatch.insertMany(flatMatches) : [];

      tournament.status = "Finalized";
      await tournament.save();

      const gradeGroups = result.groups.map((g) => ({
        label: g.label,
        grades: g.grades,
        merged: g.merged,
        playerCount: g.players.length,
        courts: g.courts,
        wave: g.wave,
        rounds: g.schedule.rounds.length,
      }));

      const messageParts = [`Tournament finalized — ${result.groups.length} grade group(s) scheduled`];
      if (result.moveLog.length) {
        messageParts.push(`${result.moveLog.length} nightly grade adjustment${result.moveLog.length === 1 ? "" : "s"}`);
      }
      if (result.warnings.length) {
        messageParts.push(`${result.warnings.length} scheduling note${result.warnings.length === 1 ? "" : "s"} — see warnings`);
      }

      return res.status(200).json({
        message:
          messageParts.length > 1
            ? `${messageParts[0]} (${messageParts.slice(1).join("; ")})`
            : messageParts[0],
        data: {
          tournament,
          matches: allMatches,
          gradeGroups,
          moveLog: result.moveLog,
          warnings: result.warnings,
        },
      });
    } catch (error) {
      console.log("finalizeGradedTournament error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = RoundRobinTournamentController;
