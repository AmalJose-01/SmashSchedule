const Court = require("../../model/venue/courtModel");
const Venue = require("../../model/venue/venueModel");

const tournamentController = {

getVenuesByUserId: async (req, res) => {
    try {
      console.log("getVenuesByUserId called with params:", req.params);

      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const venues = await Venue.find({ userId }).select(_id,venueName);
      if (venues.length === 0) {
        return res.status(404).json({ error: "No venues found for this user" });
      }

      res.status(200).json({venueList: venues });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCourtByVenueId: async (req,res) => {
    try{
              const { userId , venueId} = req.params;

          if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      if (!venueId) {
        return res.status(400).json({ error: "Venue ID is required" });
      }    
            const court = await Court.find({ userId }).select(_id,venueName);
if(Court.length === 0){
        return res.status(404).json({ error: "No Court found for this user" });
}
 res.status(200).json({courtList: court})

    }catch(error){
        res.status(500).json({error: error.message})
    }

  },


    getReferential: async(req,res) => {

    }

}
module.exports = tournamentController;
