export const mapVenueResponse = (apiData) => ({
  id: apiData._id,
  venueName: apiData.venueName,
  location: apiData.location,

});