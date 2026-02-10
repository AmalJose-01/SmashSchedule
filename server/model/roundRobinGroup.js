const mongoose = require("mongoose");

const roundRobinGroupSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
        },
        groupName: { type: String, required: true },
        players: [
            {
                playerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "RoundRobinPlayer",
                },
                name: String,
            },
        ],
        standings: [
            {
                playerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "RoundRobinPlayer",
                },
                matchesPlayed: { type: Number, default: 0 },
                wins: { type: Number, default: 0 },
                losses: { type: Number, default: 0 },
                pointsFor: { type: Number, default: 0 },
                pointsAgainst: { type: Number, default: 0 },
                pointsDiff: { type: Number, default: 0 },
                totalPoints: { type: Number, default: 0 },
            },
        ],
    },
    { timestamps: true }
);

const RoundRobinGroup = mongoose.model("RoundRobinGroup", roundRobinGroupSchema);

module.exports = RoundRobinGroup;
