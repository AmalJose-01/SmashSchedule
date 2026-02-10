const Tournament = require("../model/tournamentModel");
const RoundRobinPlayer = require("../model/roundRobinPlayer");
const RoundRobinGroup = require("../model/roundRobinGroup");
const RoundRobinTeam = require("../model/roundRobinTeam");
const RoundRobinMatch = require("../model/roundRobinMatch");

const roundRobinGroupMatchController = {
    // Generate groups based on tournament configuration
    generateGroups: async (req, res) => {
        try {
            const { tournamentId } = req.body;
            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) return res.status(404).json({ message: "Tournament not found" });

            // Fetch all players registered for this tournament
            const players = await RoundRobinPlayer.find({ tournamentId });

            if (players.length === 0) {
                return res.status(400).json({ message: "No players registered for this tournament" });
            }

            // Delete existing groups to regenerate
            await RoundRobinGroup.deleteMany({ tournamentId });
            await RoundRobinTeam.deleteMany({ tournamentId });
            await RoundRobinMatch.deleteMany({ tournamentId });

            let groupsData = [];
            const groupingStrategy = tournament.roundRobinConfig?.groupingStrategy || "random";

            if (groupingStrategy === "by-grade") {
                // Group by Grade
                const grouped = players.reduce((acc, player) => {
                    const grade = player.grade || "Unrated";
                    if (!acc[grade]) acc[grade] = [];
                    acc[grade].push(player);
                    return acc;
                }, {});

                for (const [grade, groupPlayers] of Object.entries(grouped)) {
                    const targetSize = tournament.teamsPerGroup || 5;
                    const numGroups = Math.max(1, Math.floor(groupPlayers.length / targetSize));

                    const gradeGroups = Array.from({ length: numGroups }, (_, i) => ({
                        groupName: `Grade ${grade} - Group ${i + 1}`,
                        players: []
                    }));

                    groupPlayers.forEach((player, i) => {
                        const groupIndex = i % numGroups;
                        gradeGroups[groupIndex].players.push({ playerId: player._id, name: player.name });
                    });

                    groupsData.push(...gradeGroups.filter(g => g.players.length > 0));
                }

            } else if (groupingStrategy === "balanced") {
                // Balanced Grouping: Snake draft by grade
                const gradeOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'Unrated': 6 };
                const sortedPlayers = players.sort((a, b) => (gradeOrder[a.grade] || 99) - (gradeOrder[b.grade] || 99));

                const targetSize = tournament.teamsPerGroup || 4;
                const numGroups = Math.max(1, Math.ceil(sortedPlayers.length / targetSize));

                groupsData = Array.from({ length: numGroups }, (_, i) => ({
                    groupName: `Group ${String.fromCharCode(65 + i)}`,
                    players: []
                }));

                // Snake draft
                let direction = 1;
                let groupIndex = 0;

                sortedPlayers.forEach((player) => {
                    groupsData[groupIndex].players.push({ playerId: player._id, name: player.name });

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
                const shuffled = players.sort(() => 0.5 - Math.random());
                const targetSize = tournament.teamsPerGroup || 4;
                const numGroups = Math.max(1, Math.floor(shuffled.length / targetSize));

                groupsData = Array.from({ length: numGroups }, (_, i) => ({
                    groupName: `Group ${String.fromCharCode(65 + i)}`,
                    players: []
                }));

                shuffled.forEach((player, i) => {
                    const groupIndex = i % numGroups;
                    groupsData[groupIndex].players.push({ playerId: player._id, name: player.name });
                });
            }

            // Save Groups
            const savedGroups = await RoundRobinGroup.insertMany(
                groupsData.map(g => ({
                    ...g,
                    tournamentId,
                    standings: g.players.map(p => ({
                        playerId: p.playerId,
                        matchesPlayed: 0,
                        wins: 0,
                        losses: 0,
                        pointsFor: 0,
                        pointsAgainst: 0,
                        pointsDiff: 0,
                        totalPoints: 0
                    }))
                }))
            );

            res.status(200).json({ message: "Groups generated successfully", groups: savedGroups });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Save manually adjusted groups and generate matches
    saveGroupsAndGenerateMatches: async (req, res) => {
        try {
            const { tournamentId, groups } = req.body;

            const tournament = await Tournament.findById(tournamentId);
            if (!tournament) return res.status(404).json({ message: "Tournament not found" });

            const isDoubles = tournament.matchType === "Doubles";
            const crossGroupMatches = tournament.roundRobinConfig?.crossGroupMatches;

            // Delete existing data
            await RoundRobinGroup.deleteMany({ tournamentId });
            await RoundRobinTeam.deleteMany({ tournamentId });
            await RoundRobinMatch.deleteMany({ tournamentId });

            const savedGroupsData = [];
            const validGroupKeys = Object.keys(groups).filter(k => k !== 'unassigned' && groups[k].length > 0);

            // Process each group
            for (const groupKey of validGroupKeys) {
                const playerIds = groups[groupKey].map(p => p._id || p.id);
                const players = await RoundRobinPlayer.find({ _id: { $in: playerIds } });

                if (players.length === 0) continue;

                const groupName = groupKey.replace('group', 'Group ');

                // Create group
                const newGroup = await RoundRobinGroup.create({
                    tournamentId,
                    groupName,
                    players: players.map(p => ({ playerId: p._id, name: p.name })),
                    standings: players.map(p => ({
                        playerId: p._id,
                        matchesPlayed: 0,
                        wins: 0,
                        losses: 0,
                        pointsFor: 0,
                        pointsAgainst: 0,
                        pointsDiff: 0,
                        totalPoints: 0
                    }))
                });

                savedGroupsData.push({
                    groupId: newGroup._id,
                    groupName,
                    players
                });
            }

            // Generate Matches
            const numberOfCourts = tournament.numberOfCourts || 1;
            const courtsList = Array.from({ length: numberOfCourts }, (_, idx) => `Court ${idx + 1}`);

            if (isDoubles) {
                // Create Doubles teams
                for (const groupData of savedGroupsData) {
                    const { groupId, players } = groupData;

                    if (crossGroupMatches) {
                        // Generate ALL possible pairs
                        for (let i = 0; i < players.length; i++) {
                            for (let j = i + 1; j < players.length; j++) {
                                await RoundRobinTeam.create({
                                    tournamentId,
                                    groupId,
                                    teamName: `${players[i].name} & ${players[j].name}`,
                                    player1: { playerId: players[i]._id, name: players[i].name },
                                    player2: { playerId: players[j]._id, name: players[j].name }
                                });
                            }
                        }
                    } else {
                        // Random pairing
                        const shuffled = players.sort(() => 0.5 - Math.random());
                        for (let i = 0; i < shuffled.length; i += 2) {
                            if (i + 1 < shuffled.length) {
                                await RoundRobinTeam.create({
                                    tournamentId,
                                    groupId,
                                    teamName: `${shuffled[i].name} & ${shuffled[i + 1].name}`,
                                    player1: { playerId: shuffled[i]._id, name: shuffled[i].name },
                                    player2: { playerId: shuffled[i + 1]._id, name: shuffled[i + 1].name }
                                });
                            }
                        }
                    }
                }

                // Generate Doubles matches
                if (crossGroupMatches && savedGroupsData.length > 1) {
                    // Cross-group matches
                    let matchIndex = 0;
                    for (let i = 0; i < savedGroupsData.length; i++) {
                        for (let j = i + 1; j < savedGroupsData.length; j++) {
                            const groupATeams = await RoundRobinTeam.find({ groupId: savedGroupsData[i].groupId });
                            const groupBTeams = await RoundRobinTeam.find({ groupId: savedGroupsData[j].groupId });

                            const maxTeams = Math.min(groupATeams.length, groupBTeams.length);

                            for (let k = 0; k < maxTeams; k++) {
                                await RoundRobinMatch.create({
                                    tournamentId,
                                    groupId: savedGroupsData[i].groupId,
                                    matchName: `${groupATeams[k].teamName} vs ${groupBTeams[k].teamName}`,
                                    matchType: "Doubles",
                                    team1: groupATeams[k]._id,
                                    team2: groupBTeams[k]._id,
                                    court: courtsList[matchIndex % courtsList.length],
                                    scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                    status: "scheduled"
                                });
                                matchIndex++;
                            }
                        }
                    }
                } else {
                    // Within-group matches
                    let matchIndex = 0;
                    for (const groupData of savedGroupsData) {
                        const teams = await RoundRobinTeam.find({ groupId: groupData.groupId });

                        for (let i = 0; i < teams.length; i++) {
                            for (let j = i + 1; j < teams.length; j++) {
                                await RoundRobinMatch.create({
                                    tournamentId,
                                    groupId: groupData.groupId,
                                    matchName: `${teams[i].teamName} vs ${teams[j].teamName}`,
                                    matchType: "Doubles",
                                    team1: teams[i]._id,
                                    team2: teams[j]._id,
                                    court: courtsList[matchIndex % courtsList.length],
                                    scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                    status: "scheduled"
                                });
                                matchIndex++;
                            }
                        }
                    }
                }
            } else {
                // Singles matches
                let matchIndex = 0;
                for (const groupData of savedGroupsData) {
                    const players = groupData.players;

                    for (let i = 0; i < players.length; i++) {
                        for (let j = i + 1; j < players.length; j++) {
                            await RoundRobinMatch.create({
                                tournamentId,
                                groupId: groupData.groupId,
                                matchName: `${players[i].name} vs ${players[j].name}`,
                                matchType: "Singles",
                                player1: players[i]._id,
                                player2: players[j]._id,
                                court: courtsList[matchIndex % courtsList.length],
                                scores: [{ sets: [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }] }],
                                status: "scheduled"
                            });
                            matchIndex++;
                        }
                    }
                }
            }

            res.status(200).json({ message: "Groups saved and matches generated successfully" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Get groups for a tournament
    getGroups: async (req, res) => {
        try {
            const { tournamentId } = req.params;
            const groups = await RoundRobinGroup.find({ tournamentId }).populate('players.playerId');
            res.status(200).json({ groups });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Get matches for a tournament
    getMatches: async (req, res) => {
        try {
            const { tournamentId } = req.params;
            const matches = await RoundRobinMatch.find({ tournamentId })
                .populate('player1 player2')
                .populate({
                    path: 'team1 team2',
                    populate: { path: 'player1.playerId player2.playerId' }
                });
            res.status(200).json({ matches });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
};

module.exports = roundRobinGroupMatchController;
