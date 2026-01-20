export const saveCourtUseCase = async (courtData, courtRepository) => {
  if (!courtData.courtName) {
    throw new Error("Court name is required");

  }
    if (!courtData.venueId) {
    throw new Error("Venue ID is required");
  }
    return await courtRepository.saveCourt(courtData);
};
