const RoundRobinMember = require("../model/roundRobinMember");
const RoundRobinPlayer = require("../model/roundRobinPlayer");
const Team = require("../model/team");
const Tournament = require("../model/tournamentModel");

const roundRobinController = {
    // CREATE MEMBER
    createMember: async (req, res) => {
        try {
            const { name, grade, email, isMember, contact } = req.body;

            // Check for existing member by email only
            const existingMember = await RoundRobinMember.findOne({ email });

            if (existingMember) {
                return res
                    .status(400)
                    .json({ message: "Member with this email already exists" });
            }

            const newMember = new RoundRobinMember({
                name,
                grade,
                contact,
                email,
                isMember: isMember !== undefined ? isMember : true,
            });

            await newMember.save();
            res
                .status(201)
                .json({ message: "Member created successfully", member: newMember });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // BULK IMPORT MEMBERS
    bulkImportMembers: async (req, res) => {
        try {
            const { members } = req.body; // Expecting array of { name, grade, email, isMember, contact }
            console.log("bulkImportMembers received data:", members);

            if (!members || !Array.isArray(members) || members.length === 0) {
                return res.status(400).json({ message: "No members data provided" });
            }

            const results = {
                successCount: 0,
                errors: []
            };

            for (const memberData of members) {
                try {
                    let { name, grade, email, isMember, contact } = memberData;

                    if (name) name = name.trim();
                    if (email) email = email.trim();

                    // Basic validation
                    if (!name || !email) {
                        console.log(`Missing name or email for record:`, memberData);
                        results.errors.push({ email, error: "Missing name or email" });
                        continue;
                    }

                    // Check existence (Case Insensitive)
                    const existing = await RoundRobinMember.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
                    if (existing) {
                        console.log(`Member with email ${email} already exists. Skipping.`);
                        results.errors.push({ email, error: "Email already exists" });
                        continue;
                    }

                    await RoundRobinMember.create({
                        name,
                        grade: grade || "Unrated", // Default if missing
                        contact: contact || "",
                        email,
                        isMember: isMember !== undefined ? isMember : true
                    });
                    results.successCount++;

                } catch (err) {
                    console.error(`Error importing ${memberData.email}:`, err);
                    results.errors.push({ email: memberData.email, error: err.message });
                }
            }

            res.status(200).json({
                message: `Import processed. Success: ${results.successCount}, Failed: ${results.errors.length}`,
                results
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // GET ALL MEMBERS
    getMembers: async (req, res) => {
        try {
            const members = await RoundRobinMember.find({ isActive: { $ne: false } }).sort({
                createdAt: -1,
            });
            res.status(200).json({ members });
        } catch (error) {
            console.error("Get Members Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // UPDATE MEMBER
    updateMember: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, grade, email, isMember, contact } = req.body;

            const updatedMember = await RoundRobinMember.findByIdAndUpdate(
                id,
                { name, grade, email, isMember, contact },
                { new: true }
            );

            if (!updatedMember) {
                return res.status(404).json({ message: "Member not found" });
            }

            res.status(200).json({
                message: "Member updated successfully",
                member: updatedMember,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // DELETE MEMBER (Soft Delete or Hard Delete)
    deleteMember: async (req, res) => {
        try {
            const { id } = req.params;
            // We'll do a soft delete by setting isActive to false if you prefer, 
            // or hard delete. Based on user request "delete", hard delete is clearer for now
            // unless data integrity with past tournaments is strict. 
            // Let's do hard delete for now as per typical "create edit delete" requests.

            const member = await RoundRobinMember.findByIdAndDelete(id);

            if (!member) {
                return res.status(404).json({ message: "Member not found" });
            }

            res.status(200).json({ message: "Member deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Add members to Round Robin tournament as players
    addMembersToTournament: async (req, res) => {
        try {
            const { tournamentId, memberIds } = req.body;

            if (!tournamentId || !memberIds || !Array.isArray(memberIds)) {
                return res.status(400).json({ message: "Invalid data provided" });
            }

            const members = await RoundRobinMember.find({ _id: { $in: memberIds } });
            const tournament = await Tournament.findById(tournamentId);

            if (!tournament) {
                return res.status(404).json({ message: "Tournament not found" });
            }

            const registeredPlayers = [];

            for (const member of members) {
                // Check if already registered
                const existingPlayer = await RoundRobinPlayer.findOne({
                    tournamentId,
                    email: member.email
                });

                if (existingPlayer) {
                    console.log(`Player ${member.name} already registered`);
                    continue;
                }

                // Create new RoundRobinPlayer
                const newPlayer = new RoundRobinPlayer({
                    tournamentId,
                    name: member.name,
                    email: member.email,
                    contact: member.contact || "",
                    grade: member.grade || "",
                    dateOfBirth: member.dateOfBirth || ""
                });

                await newPlayer.save();
                registeredPlayers.push(newPlayer);
            }

            res.status(200).json({
                message: `Successfully registered ${registeredPlayers.length} players`,
                players: registeredPlayers
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Get all players registered for a specific tournament
    getTournamentPlayers: async (req, res) => {
        try {
            const { tournamentId } = req.params;
            if (!tournamentId) {
                return res.status(400).json({ message: "Tournament ID is required" });
            }

            const players = await RoundRobinPlayer.find({ tournamentId });

            // Map to a format compatible with the frontend Team list if needed, 
            // but for now we'll just return them as players.
            // SetupTournament expects an object with a 'teams' array.
            res.status(200).json({
                teams: players.map(p => ({
                    _id: p._id,
                    teamName: p.name, // SetupTournament uses teamName for display
                    email: p.email,
                    contact: p.contact,
                    grade: p.grade
                }))
            });
        } catch (error) {
            console.error("Get Tournament Players Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Remove a player from a specific tournament
    removePlayerFromTournament: async (req, res) => {
        try {
            const { tournamentId, playerId } = req.params;

            if (!tournamentId || !playerId) {
                return res.status(400).json({ message: "Tournament ID and Player ID are required" });
            }

            const deletedPlayer = await RoundRobinPlayer.findOneAndDelete({
                _id: playerId,
                tournamentId
            });

            if (!deletedPlayer) {
                return res.status(404).json({ message: "Player not found in this tournament" });
            }

            res.status(200).json({ message: "Player removed from tournament successfully" });
        } catch (error) {
            console.error("Remove Player Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // Bulk add players to a tournament (from Upload/Import)
    bulkAddPlayersToTournament: async (req, res) => {
        try {
            const { tournamentId, players } = req.body;

            if (!tournamentId || !players || !Array.isArray(players)) {
                return res.status(400).json({ message: "Tournament ID and Players array are required" });
            }

            const results = {
                successCount: 0,
                skippedCount: 0,
                errors: []
            };

            for (const playerData of players) {
                try {
                    let { name, email, contact, grade, dateOfBirth } = playerData;

                    if (!email) {
                        results.errors.push({ name, error: "Missing email" });
                        continue;
                    }

                    // 1. Ensure Member exists in global pool
                    let member = await RoundRobinMember.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
                    if (!member) {
                        member = await RoundRobinMember.create({
                            name: name || "Unknown",
                            email,
                            contact: contact || "",
                            grade: grade || "Unrated",
                            isMember: false // imported via tournament
                        });
                    }

                    // 2. Register for this specific tournament
                    const existingPlayer = await RoundRobinPlayer.findOne({ tournamentId, email: { $regex: new RegExp(`^${email}$`, 'i') } });
                    if (existingPlayer) {
                        results.skippedCount++;
                        continue;
                    }

                    await RoundRobinPlayer.create({
                        tournamentId,
                        name: member.name,
                        email: member.email,
                        contact: member.contact,
                        grade: member.grade,
                        dateOfBirth: dateOfBirth || member.dateOfBirth || ""
                    });

                    results.successCount++;
                } catch (err) {
                    results.errors.push({ email: playerData.email, error: err.message });
                }
            }

            res.status(200).json({
                message: `Processed ${players.length} players. Added: ${results.successCount}, Skipped: ${results.skippedCount}`,
                results
            });
        } catch (error) {
            console.error("Bulk Add Players Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
};

module.exports = roundRobinController;
