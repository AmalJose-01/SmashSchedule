const Court = require("../../model/venue/courtModel");
const Venue = require("../../model/venue/venueModel");

const venueController = {
  createVenue: async (req, res) => {
    try {
      const { venueName, location, userId } = req.body;

      // Validate required fields

      if (!venueName || !location || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      //   check if venue already exists combination of name , location and userId
      const existingVenue = await Venue.findOne({
        venueName,
        location,
        userId,
      });
      if (existingVenue) {
        console.log("Existing Venue:", existingVenue);
        return res
          .status(400)
          .json({
            error:
              "Venue with the same name and location already exists for this user",
          });
      }

      // Assuming you have a Court model
      const savedVenue = await Venue.create({
        venueName,
        location,
        userId,
      });

      res
        .status(201)
        .json({ message: "Venue saved successfully", venue: savedVenue });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getVenuesByUserId: async (req, res) => {
    try {
      console.log("getVenuesByUserId called with params:", req.params);

      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const venues = await Venue.find({ userId });
      if (venues.length === 0) {
        return res.status(404).json({ error: "No venues found for this user" });
      }

      res.status(200).json({ venues });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
getVenueDetailById: async (req, res) => {
    try {
      console.log("getVenueDetailById called with params:", req.params);

      const { venueId, userId } = req.params;
      if (!venueId || !userId) {
        return res.status(400).json({ error: "Venue ID and User ID are required" });
      }
      const venue = await Venue.findOne({ _id: venueId, userId });
      if (!venue) {
        return res.status(404).json({ error: "Venue not found for this user" });
      }
      // Get Court List corresponding to this venue
       const courts = await Court.find({ venueId: venueId });
      

      console.log("Venue detail fetched:", venue, courts);
      res.status(200).json({ venueDetail: venue, courtList: courts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },




  deleteVenue: async (req, res) => {
    try {
      const { venueId } = req.params;
      if (!venueId) {
        return res.status(400).json({ error: "Venue ID is required" });
      }

      const deletedVenue = await Venue.findByIdAndDelete(venueId);
      if (!deletedVenue) {
        return res.status(404).json({ error: "Venue not found" });
      }

      res.status(200).json({ message: "Venue deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  //   Additional methods like updateVenue can be added here
  updateVenue: async (req, res) => {
    try {
      const { venueId } = req.params;
      const { venueName, location } = req.body;

      if (!venueId) {
        return res.status(400).json({ error: "Venue ID is required" });
      }

      const updatedVenue = await Venue.findByIdAndUpdate(
        venueId,
        { venueName, location },
        { new: true }
      );

      if (!updatedVenue) {
        return res.status(404).json({ error: "Venue not found" });
      }

      res.status(200).json({ message: "Venue updated successfully", venue: updatedVenue });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = venueController;
