const mongoose = require("mongoose");

const roundRobinTeamSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoundRobinGroup",
            required: true,
        },
        teamName: { type: String, required: true },
        player1: {
            playerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "RoundRobinPlayer",
                required: true,
            },
            name: String,
        },
        player2: {
            playerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "RoundRobinPlayer",
                required: true,
            },
            name: String,
        },
    },
    { timestamps: true }
);

const RoundRobinTeam = mongoose.model("RoundRobinTeam", roundRobinTeamSchema);

module.exports = RoundRobinTeam;
