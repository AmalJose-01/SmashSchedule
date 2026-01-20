const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    venueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: true
    },
    courtNumber: {
        type: Number,
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
     gameStatus: {
        type: Boolean,
        default: false
    },
    courtType: {
        type: String,
        enum: ['synthetic', 'wooden', 'clay', 'grass'],
        lowercase: true,
        uppercase: true,
        caseSensitive: true,
        required: true
    },
   
}, { timestamps: true });


const Court = mongoose.model("Court", courtSchema);

module.exports = Court;