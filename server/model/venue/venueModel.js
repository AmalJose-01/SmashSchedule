const mongoose = require("mongoose");
const venueSchema = new mongoose.Schema(
  {
    venueName: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Venue location is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      
    },
      
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  
  },
  { timestamps: true }
);

const Venue = mongoose.model("Venue", venueSchema);

module.exports = Venue;