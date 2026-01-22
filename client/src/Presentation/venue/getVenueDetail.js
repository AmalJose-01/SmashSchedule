export const getVenueDetailUseCase = async (venueId, userId, venueRepository) => {
  if (!venueId) {
    throw new Error("Venue ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  console.log("getVenueDetailUseCase called with venueId:", venueId, "userId:", userId);
  

  return await venueRepository.getVenueById(venueId, userId);
};