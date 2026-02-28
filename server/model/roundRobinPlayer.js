const mongoose = require("mongoose");

const roundRobinPlayerSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
        },
        name: { type: String, required: true },
        email: { type: String, required: true },
        contact: { type: String },
        grade: { type: String },
        dateOfBirth: { type: String },
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: "RoundRobinMember", required: true }, // Reference to the Member collection
    },
    { timestamps: true }
);

// Compound index for uniqueness per tournament
roundRobinPlayerSchema.index({ tournamentId: 1, email: 1 }, { unique: true });

const RoundRobinPlayer = mongoose.model("RoundRobinPlayer", roundRobinPlayerSchema);

module.exports = RoundRobinPlayer;
