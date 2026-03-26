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

    // Save manually adjusted groups from DnD and generate matches per PDF format
    saveGroups: async (req, res) => {
        try {
            const { tournamentId, groups } = req.body;

            console.log("groups received in controller:", groups);

            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) return res.status(404).json({ message: "Tournament not found" });

            const numberOfCourts = tournament.numberOfCourts || 1;
            const courtsList = Array.from({ length: numberOfCourts }, (_, i) => `Court ${i + 1}`);
            const matchType = tournament.matchType || "Singles"; // Singles or Doubles
            const crossGroupMatches = tournament.roundRobinConfig?.crossGroupMatches || false;

            // Reset existing data
            await Group.deleteMany({ tournamentId });
            await GroupMatch.deleteMany({ tournamentId });
            await Team.deleteMany({ tournamentId });

            const validGroupKeys = Object.keys(groups)
                .filter(k => k !== 'unassigned' && groups[k].length > 0)
                .sort();

            const savedGroups = [];
            const allTeamCombinations = []; // Store combinations for inter-group matches
            let matchIndex = 0;

            // --- STEP 1: Create Groups and Intra-group Matches ---
            for (let idx = 0; idx < validGroupKeys.length; idx++) {
                const groupKey = validGroupKeys[idx];
                const members = groups[groupKey];

                let groupName = groupKey.replace('group', 'Group ');
                if (!groupName.includes('Group')) groupName = `Group ${String.fromCharCode(65 + idx)}`;

                const groupTeams = members.map(m => ({ teamId: String(m._id || m.id), name: m.name }));

                const newGroup = await Group.create({
                    tournamentId,
                    groupName,
                    teams: groupTeams,
                    standings: groupTeams.map(t => ({
                        teamId: t.teamId,
                        matchesPlayed: 0, wins: 0, losses: 0,
                        pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, totalPoints: 0,
                    })),
                });

                savedGroups.push({ groupId: newGroup._id, groupName });

                // --- Handle Different Match Types ---
                if (matchType === "Doubles") {
                    // DOUBLES CASE: Create team combinations (pairs) and matches between combinations
                    const teamCombinations = [];

                    // Generate all 2-player combinations from group members
                    for (let i = 0; i < members.length; i++) {
                        for (let j = i + 1; j < members.length; j++) {
                            const combination = {
                                groupId: newGroup._id,
                                groupName: groupName,
                                pair: [
                                    { teamId: String(members[i]._id || members[i].id), name: members[i].name },
                                    { teamId: String(members[j]._id || members[j].id), name: members[j].name }
                                ],
                                combinationName: `${members[i].name} & ${members[j].name}`
                            };
                            teamCombinations.push(combination);
                        }
                    }

                    allTeamCombinations.push(...teamCombinations);

                    // Create matches between all combinations in the same group
                    for (let i = 0; i < teamCombinations.length; i++) {
                        for (let j = i + 1; j < teamCombinations.length; j++) {
                            await GroupMatch.create({
                                matchName: `${teamCombinations[i].combinationName} vs ${teamCombinations[j].combinationName}`,
                                tournamentId,
                                group: newGroup._id,
                                teamsHome: teamCombinations[i].pair[0].teamId,
                                teamsAway: teamCombinations[j].pair[0].teamId,
                                player1Home: teamCombinations[i].pair[1].teamId, // Second player from home team
                                player1Away: teamCombinations[j].pair[1].teamId, // Second player from away team
                                scheduledTime: null,
                                court: courtsList[matchIndex % courtsList.length],
                                scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                status: 'scheduled',
                            });
                            matchIndex++;
                        }
                    }

                } else {
                    // SINGLES CASE: Keep original team-vs-team matches
                    for (let i = 0; i < members.length; i++) {
                        for (let j = i + 1; j < members.length; j++) {
                            await GroupMatch.create({
                                matchName: `${members[i].name} vs ${members[j].name}`,
                                tournamentId,
                                group: newGroup._id,
                                teamsHome: members[i]._id || members[i].id,
                                teamsAway: members[j]._id || members[j].id,
                                scheduledTime: null,
                                court: courtsList[matchIndex % courtsList.length],
                                scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                status: 'scheduled',
                            });
                            matchIndex++;
                        }
                    }
                }
            }

            // --- STEP 2: Create Inter-group Matches (if enabled) ---
            if (crossGroupMatches && matchType === "Doubles" && allTeamCombinations.length > 0) {
                // Create matches between pairs from different groups
                const combinationsByGroup = {};

                allTeamCombinations.forEach(combo => {
                    const gName = combo.groupName;
                    if (!combinationsByGroup[gName]) {
                        combinationsByGroup[gName] = [];
                    }
                    combinationsByGroup[gName].push(combo);
                });

                const groupNames = Object.keys(combinationsByGroup).sort();

                // Match each group with next group (Group A vs Group B, Group C vs Group D, etc.)
                for (let g = 0; g < groupNames.length - 1; g += 2) {
                    const group1Name = groupNames[g];
                    const group2Name = groupNames[g + 1];

                    const combosGroup1 = combinationsByGroup[group1Name];
                    const combosGroup2 = combinationsByGroup[group2Name];

                    // All combinations from group1 play all combinations from group2
                    for (let i = 0; i < combosGroup1.length; i++) {
                        for (let j = 0; j < combosGroup2.length; j++) {
                            await GroupMatch.create({
                                matchName: `${group1Name} (${combosGroup1[i].combinationName}) vs ${group2Name} (${combosGroup2[j].combinationName})`,
                                tournamentId,
                                teamsHome: combosGroup1[i].pair[0].teamId,
                                teamsAway: combosGroup2[j].pair[0].teamId,
                                player1Home: combosGroup1[i].pair[1].teamId,
                                player1Away: combosGroup2[j].pair[1].teamId,
                                scheduledTime: null,
                                court: courtsList[matchIndex % courtsList.length],
                                scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                status: 'scheduled',
                                isInterGroup: true,
                            });
                            matchIndex++;
                        }
                    }
                }
            }

            await Tournament.findByIdAndUpdate(tournamentId, {
                groups: savedGroups.map(g => g.groupId),
                'roundRobinConfig.generated': true,
                status: 'Scheduled',
            });

            res.status(200).json({ message: 'Groups saved and schedule generated', groups: savedGroups.map(g => g.groupId) });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
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
