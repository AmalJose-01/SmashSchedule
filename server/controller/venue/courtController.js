const Court = require("../../model/venue/courtModel");
const Venue = require("../../model/venue/venueModel");

const courtController = {
  createCourt: async (req, res) => {
    try {
      console.log("req", req.body);

      // court may be multiple per venue
      const { courts } = req.body;

      // Validate that court is an array
      if (!Array.isArray(courts)) {
        return res.status(400).json({ error: "Court data must be an array" });
      }

      let savedCourts = [];
      let duplicateCourts = [];
      for (const court of courts) {
        console.log("Court Data:", court);
        const { courtName, userId, venueId, courtType } = court;

        // Validate required fields
        if (!courtName || !venueId || !userId || !courtType) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Check court is available for the same venue
        const existingCourt = await Court.findOne({
          venueId: venueId,
          userId: userId,
          name: courtName,
          courtType,
        });

        if (existingCourt) {
          duplicateCourts.push(courtName);
        } else {
          // Assuming you have a Court model
          const savedCourt = await Court.create({
            name: court.courtName,
            venueId: court.venueId,
            userId: court.userId,
            courtType,
          });

          // update the venue to include this court
          await Venue.findByIdAndUpdate(venueId, {
            $push: { courts: savedCourt._id },
          });
          savedCourts.push(savedCourt);
        }
      }

      res.status(201).json({
        message: "Court saved successfully",
        court: savedCourts,
        duplicates: duplicateCourts,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCourtsByVenueId: async (req, res) => {
    try {
      const { venueId } = req.params;
      if (!venueId) {
        return res.status(400).json({ error: "Venue ID is required" });
      }
      const courts = await Court.find({ venueId });
      if (courts.length === 0) {
        return res
          .status(404)
          .json({ error: "No courts found for this venue" });
      }

      res.status(200).json({ courts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteCourt: async (req, res) => {
    try {
console.log("deleteCourt",req);


      const { courtId } = req.params;
      if (!courtId) {
        return res.status(400).json({ error: "Court ID is required" });
      }

      const deletedCourt = await Court.findByIdAndDelete(courtId);
      if (!deletedCourt) {
        return res.status(404).json({ error: "Court not found" });
      }

      // Also remove the court reference from the Venue
      await Venue.findByIdAndUpdate(deletedCourt.venueId, {
        $pull: { courts: courtId },
      });

      res.status(200).json({ message: "Court deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = courtController;
