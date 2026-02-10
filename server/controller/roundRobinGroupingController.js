const Tournament = require("../model/tournamentModel");
const RoundRobinMember = require("../model/roundRobinMember");
const Group = require("../model/groupTournament");
const Team = require("../model/team");
const GroupMatch = require("../model/groupMatch");

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
            const teams = await Team.find({ tournamentId });

            if (teams.length === 0) {
                return res.status(400).json({ message: "No teams/players registered for this tournament" });
            }

            // Check existing groups and delete them to regenerate
            await Group.deleteMany({ tournamentId });

            let groupsData = [];
            const groupByGrade = tournament.roundRobinConfig?.groupByGrade;

            if (groupByGrade) {
                // Group by Grade
                // We need to fetch grade info. 
                // If players are registered as Teams, we might need to look up player details.
                // Assuming Team model might not have Grade directly if it was created from RR Members pool.
                // Let's assume for now we look up by player email or name if possible, or if Grade was saved in Team.
                // Wait, Team model has playerOneEmail. We can lookup RoundRobinMember.

                const teamsWithGrade = await Promise.all(teams.map(async (team) => {
                    // Find member by email to get Grade
                    const member = await RoundRobinMember.findOne({ email: team.playerOneEmail });
                    return {
                        ...team.toObject(),
                        grade: member ? member.grade : "Unrated"
                    };
                }));

                const grouped = teamsWithGrade.reduce((acc, team) => {
                    const grade = team.grade;
                    if (!acc[grade]) acc[grade] = [];
                    acc[grade].push(team);
                    return acc;
                }, {});

                // Create Group documents
                for (const [grade, groupTeams] of Object.entries(grouped)) {
                    const targetSize = tournament.teamsPerGroup || 5;
                    const numGroups = Math.max(1, Math.floor(groupTeams.length / targetSize));

                    const gradeGroups = Array.from({ length: numGroups }, (_, i) => ({
                        groupName: `Grade ${grade} - Group ${i + 1}`,
                        teams: []
                    }));

                    groupTeams.forEach((team, i) => {
                        const groupIndex = i % numGroups;
                        gradeGroups[groupIndex].teams.push({ teamId: team._id, name: team.teamName });
                    });

                    groupsData.push(...gradeGroups.filter(g => g.teams.length > 0));
                }

            } else if (tournament.roundRobinConfig?.balancedGrouping) {
                // Balanced Grouping: Snake draft by grade
                const gradeOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'Unrated': 6 };

                const teamsWithGrade = await Promise.all(teams.map(async (team) => {
                    const member = await RoundRobinMember.findOne({ email: team.playerOneEmail });
                    return {
                        ...team.toObject(),
                        grade: member ? member.grade : "Unrated"
                    };
                }));

                // Sort by grade (highest first)
                teamsWithGrade.sort((a, b) => (gradeOrder[a.grade] || 99) - (gradeOrder[b.grade] || 99));

                const targetSize = tournament.teamsPerGroup || 4;
                const numGroups = Math.max(1, Math.ceil(teamsWithGrade.length / targetSize));

                groupsData = Array.from({ length: numGroups }, (_, i) => ({
                    groupName: `Group ${String.fromCharCode(65 + i)}`,
                    teams: []
                }));

                // Snake draft
                let direction = 1; // 1 = forward, -1 = backward
                let groupIndex = 0;

                teamsWithGrade.forEach((team) => {
                    groupsData[groupIndex].teams.push({ teamId: team._id, name: team.teamName });

                    groupIndex += direction;

                    // Reverse direction at boundaries
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
                const shuffled = teams.sort(() => 0.5 - Math.random());
                const targetSize = tournament.teamsPerGroup || 4;
                const numGroups = Math.max(1, Math.floor(shuffled.length / targetSize));

                groupsData = Array.from({ length: numGroups }, (_, i) => ({
                    groupName: `Group ${String.fromCharCode(64 + (i + 1))}`, // Group A, B, C...
                    teams: []
                }));

                shuffled.forEach((team, i) => {
                    const groupIndex = i % numGroups;
                    groupsData[groupIndex].teams.push({ teamId: team._id, name: team.teamName });
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
                const members = groups[groupKey]; // List of { _id, name, ... } which are mostly Singles Teams/Members

                let finalTeamsForGroup = [];

                if (isDoubles && tournament.roundRobinConfig?.crossGroupMatches) {
                    // CROSS-GROUP MODE: Generate ALL possible Doubles pairs within the group
                    const pairs = [];
                    for (let i = 0; i < members.length; i++) {
                        for (let j = i + 1; j < members.length; j++) {
                            const p1 = members[i];
                            const p2 = members[j];

                            const uniqueId = `${Date.now()}_${groupCounter}_${i}_${j}`;
                            const newTeam = new Team({
                                teamName: `${p1.name} & ${p2.name}`,
                                playerOneName: p1.name,
                                playerOneEmail: p1.email || `p1_${uniqueId}@temp.com`,
                                playerOneContact: p1.contact || `000000${uniqueId.slice(-4)}`,
                                playerOneDOB: "N/A",
                                playerTwoName: p2.name,
                                playerTwoEmail: p2.email || `p2_${uniqueId}@temp.com`,
                                playerTwoContact: p2.contact || `000001${uniqueId.slice(-4)}`,
                                playerTwoDOB: "N/A",
                                tournamentId,
                            });
                            await newTeam.save();
                            pairs.push({ teamId: newTeam._id, name: newTeam.teamName });
                        }
                    }
                    finalTeamsForGroup = pairs;
                } else if (isDoubles) {
                    // STANDARD DOUBLES: Random pairing within group
                    const shuffledMembers = members.sort(() => 0.5 - Math.random());

                    for (let i = 0; i < shuffledMembers.length; i += 2) {
                        if (i + 1 < shuffledMembers.length) {
                            const p1 = shuffledMembers[i];
                            const p2 = shuffledMembers[i + 1];

                            const uniqueId = `${Date.now()}_${groupCounter}_${i}`;
                            const newTeam = new Team({
                                teamName: `${p1.name} & ${p2.name}`,
                                playerOneName: p1.name,
                                playerOneEmail: p1.email || `p1_${uniqueId}@temp.com`,
                                playerOneContact: p1.contact || `000000${uniqueId.slice(-4)}`,
                                playerOneDOB: "N/A",
                                playerTwoName: p2.name,
                                playerTwoEmail: p2.email || `p2_${uniqueId}@temp.com`,
                                playerTwoContact: p2.contact || `000001${uniqueId.slice(-4)}`,
                                playerTwoDOB: "N/A",
                                tournamentId,
                            });
                            await newTeam.save();
                            finalTeamsForGroup.push({ teamId: newTeam._id, name: newTeam.teamName });
                        }
                    }
                } else {
                    // Singles: Use existing teams
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
                    teams: finalTeamsForGroup
                });
                savedGroupIds.push(newGroup._id);
                groupCounter++;
            }

            // Generate Matches
            if (tournament.roundRobinConfig?.crossGroupMatches && newGroupsData.length > 1) {
                // CROSS-GROUP MATCHES: Matches between groups, not within
                const allMatches = [];
                let matchIndex = 0;

                for (let i = 0; i < newGroupsData.length; i++) {
                    for (let j = i + 1; j < newGroupsData.length; j++) {
                        const groupA = newGroupsData[i];
                        const groupB = newGroupsData[j];

                        // Parallel pairing: Team index 0 from A vs Team index 0 from B, etc.
                        const maxTeams = Math.min(groupA.teams.length, groupB.teams.length);

                        for (let k = 0; k < maxTeams; k++) {
                            const homeTeam = groupA.teams[k];
                            const awayTeam = groupB.teams[k];

                            const court = courtsList[matchIndex % courtsList.length];
                            matchIndex++;

                            allMatches.push({
                                matchName: `${homeTeam.name} vs ${awayTeam.name}`,
                                tournamentId,
                                group: groupA.groupId, // Assign to first group for display
                                teamsHome: homeTeam.teamId,
                                teamsAway: awayTeam.teamId,
                                scheduledTime: null,
                                court,
                                scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                status: "scheduled"
                            });
                        }
                    }
                }

                await GroupMatch.insertMany(allMatches);
            } else {
                // STANDARD WITHIN-GROUP MATCHES
                for (let idx = 0; idx < newGroupsData.length; idx++) {
                    const groupData = newGroupsData[idx];
                    const courtsForGroup = courtMap[idx] || [`Court 1`];
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
