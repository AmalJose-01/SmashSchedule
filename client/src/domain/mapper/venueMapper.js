export const mapVenueResponse = (apiData) => ({
  id: apiData._id,
  venueName: apiData.venueName,
  location: apiData.location,

});

export const mapVenueDetailResponse = (apiData) => ({
  id: apiData._id,
  venueName: apiData.venueName,
  location: apiData.location,
  courts: apiData.courts || [],
});