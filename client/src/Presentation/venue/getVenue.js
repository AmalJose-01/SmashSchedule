export const getVenueUseCase = async (userId, venueRepository) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    return await venueRepository.getVenues(userId);
};
