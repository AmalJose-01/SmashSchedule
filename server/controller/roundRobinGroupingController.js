const Tournament = require("../model/tournamentModel");
const RoundRobinMember = require("../model/roundRobinMember");
const Group = require("../model/groupTournament");
const Team = require("../model/team");
const GroupMatch = require("../model/groupMatch");
const RoundRobinPlayer = require("../model/roundRobinPlayer");

// Helper to check if a string is a valid ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const roundRobinGroupingController = {
    // Generate groups based on configuration (Grade or Random)
    generateGroups: async (req, res) => {
        try {
            const { tournamentId } = req.body;
            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) return res.status(404).json({ message: "Tournament not found" });

            // Fetch all teams registered for this tournament
            const teams = await RoundRobinPlayer.find({ tournamentId });

            if (teams.length === 0) {
                return res.status(400).json({ message: "No teams/players registered for this tournament" });
            }

            // Check existing groups and delete them to regenerate
            await Group.deleteMany({ tournamentId });

            let groupsData = [];
            const groupingStrategy = tournament.roundRobinConfig?.groupingStrategy || "random";
            const targetSize = tournament.teamsPerGroup || 4;
            const numGroups = Math.max(1, Math.ceil(teams.length / targetSize));

            // RoundRobinPlayer already has grade field directly
            const gradeOrder = ['A', 'B', 'C', 'D', 'E', 'Unrated'];
            const getGradeIdx = (grade) => {
                const idx = gradeOrder.indexOf(grade || 'Unrated');
                return idx === -1 ? gradeOrder.length : idx;
            };

            if (groupingStrategy === "by-grade") {
                // Group by Grade: same grade players together, fill with next highest grade if not enough
                const sorted = [...teams].sort((a, b) => getGradeIdx(a.grade) - getGradeIdx(b.grade));

                groupsData = Array.from({ length: numGroups }, (_, i) => ({
                    groupName: `Group ${String.fromCharCode(65 + i)}`,
                    teams: []
                }));

                let currentGroupIdx = 0;
                sorted.forEach((team) => {
                    groupsData[currentGroupIdx].teams.push({ teamId: team._id, name: team.name });
                    if (groupsData[currentGroupIdx].teams.length >= targetSize && currentGroupIdx < numGroups - 1) {
                        currentGroupIdx++;
                    }
                });

            } else if (groupingStrategy === "balanced") {
                // Balanced: Snake draft by grade so each group gets a mix
                const sorted = [...teams].sort((a, b) => getGradeIdx(a.grade) - getGradeIdx(b.grade));

                groupsData = Array.from({ length: numGroups }, (_, i) => ({
                    groupName: `Group ${String.fromCharCode(65 + i)}`,
                    teams: []
                }));

                // Snake draft: A->B->C->C->B->A->A->B->C...
                let direction = 1;
                let groupIndex = 0;

                sorted.forEach((team) => {
                    groupsData[groupIndex].teams.push({ teamId: team._id, name: team.name });
                    groupIndex += direction;

                    if (groupIndex >= numGroups) {
                        direction = -1;
                        groupIndex = numGroups - 1;
                    } else if (groupIndex < 0) {
                        direction = 1;
                        groupIndex = 0;
                    }
                });

            } else {
                // Random distribution
                const shuffled = [...teams].sort(() => 0.5 - Math.random());

                groupsData = Array.from({ length: numGroups }, (_, i) => ({
                    groupName: `Group ${String.fromCharCode(65 + i)}`,
                    teams: []
                }));

                shuffled.forEach((team, i) => {
                    const groupIndex = i % numGroups;
                    groupsData[groupIndex].teams.push({ teamId: team._id, name: team.name });
                });
            }

            // Save Groups
            const savedGroups = await Group.insertMany(
                groupsData.map(g => ({ ...g, tournamentId }))
            );

            // Update Tournament
            tournament.groups = savedGroups.map(g => g._id);
            tournament.roundRobinConfig.generated = true;
            await tournament.save();

            res.status(200).json({ message: "Groups generated successfully", groups: savedGroups });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Save manually adjusted groups from DnD
    saveGroups: async (req, res) => {
        try {
            const { tournamentId, groups } = req.body;

            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) return res.status(404).json({ message: "Tournament not found" });

            // 1. Prepare Teams based on Match Type
            const isDoubles = tournament.matchType === "Doubles";

            await Group.deleteMany({ tournamentId });
            await GroupMatch.deleteMany({ tournamentId }); // Reset matches too

            const newGroupsData = [];
            const savedGroupIds = [];

            // Courts logic
            const numberOfCourts = tournament.numberOfCourts || 1;

            let validGroupKeys = Object.keys(groups).filter(k => k !== 'unassigned' && groups[k].length > 0);
            const totalGroups = validGroupKeys.length;
            const courtsList = Array.from({ length: numberOfCourts }, (_, idx) => `Court ${idx + 1}`);

            const baseCourts = Math.floor(numberOfCourts / totalGroups);
            let extraCourts = numberOfCourts % totalGroups;

            let courtMap = {};
            let courtIdx = 0;

            validGroupKeys.forEach((key, i) => {
                let count = baseCourts;
                if (extraCourts > 0) {
                    count++;
                    extraCourts--;
                }

                if (count === 0 && numberOfCourts > 0) {
                    courtMap[i] = [courtsList[i % numberOfCourts]];
                } else {
                    courtMap[i] = courtsList.slice(courtIdx, courtIdx + count);
                    courtIdx += count;
                }
            });

            // Process each group
            let groupCounter = 0;
            for (const groupKey of validGroupKeys) {
                const members = groups[groupKey]; // List of { _id, name, email, contact, ... }

                let finalTeamsForGroup = [];
                let precomputedMatches = [];

                if (isDoubles) {
                    // DOUBLES / MIXED DOUBLES
                    // Generate match rounds: each round splits players into 2 teams of 2
                    // 4 players → 3 rounds, 5 players → enough rounds for min 3 matches each
                    const n = members.length;

                    // Generate all possible match rounds (pick 4 players, split into 2 pairs)
                    const allRounds = [];
                    for (let i = 0; i < n; i++) {
                        for (let j = i + 1; j < n; j++) {
                            for (let k = j + 1; k < n; k++) {
                                for (let l = k + 1; l < n; l++) {
                                    // 3 ways to split 4 players into 2 pairs
                                    allRounds.push({ team1: [i, j], team2: [k, l] });
                                    allRounds.push({ team1: [i, k], team2: [j, l] });
                                    allRounds.push({ team1: [i, l], team2: [j, k] });
                                }
                            }
                        }
                    }

                    // Greedy selection: pick rounds until every player has >= 3 matches
                    const matchCounts = new Array(n).fill(0);
                    const minRequired = 3;
                    const selectedRounds = [];
                    const remaining = [...allRounds];

                    while (!matchCounts.every(c => c >= minRequired) && remaining.length > 0) {
                        let bestIdx = 0;
                        let bestScore = -1;
                        for (let m = 0; m < remaining.length; m++) {
                            const players = [...remaining[m].team1, ...remaining[m].team2];
                            const score = players.reduce((s, idx) => s + Math.max(0, minRequired - matchCounts[idx]), 0);
                            if (score > bestScore) { bestScore = score; bestIdx = m; }
                        }
                        if (bestScore <= 0) break;
                        const selected = remaining.splice(bestIdx, 1)[0];
                        selectedRounds.push(selected);
                        [...selected.team1, ...selected.team2].forEach(idx => matchCounts[idx]++);
                    }

                    // Clean old generated teams for this tournament
                    await Team.deleteMany({ tournamentId });

                    // Create Team docs for each selected round
                    for (let r = 0; r < selectedRounds.length; r++) {
                        const round = selectedRounds[r];
                        const p1 = members[round.team1[0]], p2 = members[round.team1[1]];
                        const p3 = members[round.team2[0]], p4 = members[round.team2[1]];

                        const uid = `${Date.now()}_${groupCounter}_${r}`;

                        const homeTeam = new Team({
                            teamName: `${p1.name} & ${p2.name}`,
                            playerOneName: p1.name,
                            playerOneEmail: `rr_${uid}_h1@temp.com`,
                            playerOneContact: `rr_${uid}_h1`,
                            playerOneDOB: p1.dateOfBirth || "N/A",
                            playerTwoName: p2.name,
                            playerTwoEmail: `rr_${uid}_h2@temp.com`,
                            playerTwoContact: `rr_${uid}_h2`,
                            playerTwoDOB: p2.dateOfBirth || "N/A",
                            tournamentId,
                        });
                        await homeTeam.save();

                        const awayTeam = new Team({
                            teamName: `${p3.name} & ${p4.name}`,
                            playerOneName: p3.name,
                            playerOneEmail: `rr_${uid}_a1@temp.com`,
                            playerOneContact: `rr_${uid}_a1`,
                            playerOneDOB: p3.dateOfBirth || "N/A",
                            playerTwoName: p4.name,
                            playerTwoEmail: `rr_${uid}_a2@temp.com`,
                            playerTwoContact: `rr_${uid}_a2`,
                            playerTwoDOB: p4.dateOfBirth || "N/A",
                            tournamentId,
                        });
                        await awayTeam.save();

                        finalTeamsForGroup.push(
                            { teamId: homeTeam._id, name: homeTeam.teamName },
                            { teamId: awayTeam._id, name: awayTeam.teamName }
                        );

                        precomputedMatches.push({
                            homeTeamId: homeTeam._id,
                            homeTeamName: homeTeam.teamName,
                            awayTeamId: awayTeam._id,
                            awayTeamName: awayTeam.teamName,
                        });
                    }
                } else {
                    // Singles: Use existing players directly
                    finalTeamsForGroup = members.map(m => ({
                        teamId: m._id || m.id,
                        name: m.name
                    }));
                }

                if (finalTeamsForGroup.length < 1) continue;

                // Create Group Doc
                let realGroupName = groupKey.replace('group', 'Group ');
                if (!realGroupName.includes("Group")) realGroupName = `Group ${String.fromCharCode(65 + groupCounter)}`;

                const newGroup = await Group.create({
                    tournamentId,
                    groupName: realGroupName,
                    teams: finalTeamsForGroup,
                    standings: finalTeamsForGroup.map(t => ({
                        teamId: t.teamId,
                        matchesPlayed: 0,
                        wins: 0,
                        losses: 0,
                        pointsFor: 0,
                        pointsAgainst: 0,
                        pointsDiff: 0,
                        totalPoints: 0,
                    }))
                });

                newGroupsData.push({
                    groupId: newGroup._id,
                    groupName: realGroupName,
                    teams: finalTeamsForGroup,
                    precomputedMatches
                });
                savedGroupIds.push(newGroup._id);
                groupCounter++;
            }

            // Generate Matches
            for (let idx = 0; idx < newGroupsData.length; idx++) {
                const groupData = newGroupsData[idx];
                const courtsForGroup = courtMap[idx] || [`Court 1`];

                if (groupData.precomputedMatches && groupData.precomputedMatches.length > 0) {
                    // Doubles: matches were determined during team creation
                    const groupMatches = groupData.precomputedMatches.map((match, mIdx) => ({
                        matchName: `${match.homeTeamName} vs ${match.awayTeamName}`,
                        tournamentId,
                        group: groupData.groupId,
                        teamsHome: match.homeTeamId,
                        teamsAway: match.awayTeamId,
                        scheduledTime: null,
                        court: courtsForGroup[mIdx % courtsForGroup.length],
                        scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                        status: "scheduled"
                    }));
                    await GroupMatch.insertMany(groupMatches);
                } else {
                    // Singles: standard round-robin (each player vs every other)
                    let matchIndex = 0;
                    const groupMatches = groupData.teams.flatMap((homeTeam, i) =>
                        groupData.teams.slice(i + 1).map((awayTeam) => {
                            const court = courtsForGroup[matchIndex % courtsForGroup.length];
                            matchIndex++;
                            return {
                                matchName: `${homeTeam.name} vs ${awayTeam.name}`,
                                tournamentId,
                                group: groupData.groupId,
                                teamsHome: homeTeam.teamId,
                                teamsAway: awayTeam.teamId,
                                scheduledTime: null,
                                court,
                                scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                status: "scheduled"
                            };
                        })
                    );
                    await GroupMatch.insertMany(groupMatches);
                }
            }

            // Update Tournament
            await Tournament.findByIdAndUpdate(tournamentId, {
                groups: savedGroupIds,
                'roundRobinConfig.generated': true,
                status: "Scheduled"
            });

            res.status(200).json({ message: "Groups saved and schedule generated", groups: savedGroupIds });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Basic getter
    getGroups: async (req, res) => {
        try {
            const { tournamentId } = req.params;
            const groups = await Group.find({ tournamentId });
            res.status(200).json({ groups });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Finalize and Generate Schedule (Placeholder for now)
    finalizeAndSchedule: async (req, res) => {
        // This would trigger the scheduling logic currently in matchController or similar
        // For now just return success
        res.status(200).json({ message: "Schedule generation not yet implemented fully" });
    }
};

module.exports = roundRobinGroupingController;
