const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true,
    },
    playerOneName: {
        type: String,
        required: true,
    },
    playerTwoName: {
        type: String,
        required: true,
    },
    playerOneEmail: {
        type: String,
        required: true,
                  unique: true

    },
    playerTwoEmail: {
        type: String,
        required: true,
                  unique: true
    },
    playerOneContact: {
        type: String,
        required: true,
        unique: true
    },
    playerTwoContact: {
        type: String,
        required: true,
                  unique: true

    },
    playerOneDOB: {
        type: String,
        required: true,
    },
    playerTwoDOB: {
        type: String,
        required: true,
    },
},{ timestamps: true });

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
    
