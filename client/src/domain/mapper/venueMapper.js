export const mapVenueResponse = (apiData) => ({
  id: apiData._id,
  venueName: apiData.venueName,
  location: apiData.location,

});

export const mapVenueDetailResponse = (apiData) => ({
  id: apiData.venueDetail._id,
  venueName: apiData.venueDetail.venueName,
  location: apiData.venueDetail.location,
  courts: (apiData.courtList || []).map(court => ({
    id: court._id,
    courtName: court.name,
    courtType: court.courtType,
    courtStatus: court.isActive,
  })),
});