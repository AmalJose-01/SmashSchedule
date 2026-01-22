export const saveVenueUseCase = async (venueData, venueRepository) => {
  if (!venueData.venueName) {
    throw new Error("Venue name is required");
  }

  if (!venueData.location) {
    throw new Error("Location is required");
  }

  return await venueRepository.saveVenue(venueData);
};
