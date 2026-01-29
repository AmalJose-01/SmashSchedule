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

export const mapVenueList = (response) => ({
id: response._id,
venueName: response.venueName
});

export const mapCourtList = (response) => ({
id: response._id,
venueId: response.venueId,
courtName: response.name,

});