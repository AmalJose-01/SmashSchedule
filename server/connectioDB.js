const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.MONGODB_URI;

const connectToDatabase = async () => {
    try {
        // await mongoose.connect(uri, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // });
        await mongoose.connect(uri)
        console.log("Connected to MongoDB successfully");
        // Rename the old "teams" collection to "tournamentteams".
        await require("./helpers/renameTeamsCollection")();
        // Uniqueness of teams/players is per tournament — drop any old global indexes.
        await require("./helpers/syncTournamentIndexes")();
        // Store the "Accept online payment" value on older round robins.
        await require("./src/features/round-robin/migrations/backfillAcceptOnlinePayment")();

    }catch (error) {
        console.error("Error connecting to MongoDB:", error);
        // process.exit(1); // Exit the process with failure
    }
};

module.exports = connectToDatabase;