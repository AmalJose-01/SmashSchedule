const mongoose = require("mongoose");

const roundRobinMatchSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoundRobinGroup",
        },
        matchName: { type: String, required: true },
        matchType: {
            type: String,
            enum: ["Singles", "Doubles"],
            required: true,
        },

        // For Singles matches
        player1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoundRobinPlayer",
        },
        player2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoundRobinPlayer",
        },

        // For Doubles matches
        team1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoundRobinTeam",
        },
        team2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoundRobinTeam",
        },

        court: { type: String },
        scheduledTime: { type: Date },
        scores: [
            {
                sets: [
                    {
                        home: { type: Number, default: 0 },
                        away: { type: Number, default: 0 },
                    },
                ],
            },
        ],
        status: {
            type: String,
            enum: ["scheduled", "ongoing", "completed", "cancelled"],
            default: "scheduled",
        },
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "matchType",
        },
    },
    { timestamps: true }
);

const RoundRobinMatch = mongoose.model("RoundRobinMatch", roundRobinMatchSchema);

module.exports = RoundRobinMatch;
