export const deleteVenueUseCase = async (venueId, venueRepository) => {
  if (!venueId) {
    throw new Error("Venue ID is required");
  }

  return await venueRepository.deleteVenue(venueId);
}