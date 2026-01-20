export const saveCourtUseCase = async (courtData, courtRepository) => {


 console.log("courtData:", courtData);
// Check court data is array
if (Array.isArray(courtData.courts)) {
    for (const court of courtData.courts) {
        if (!court.courtName) {
            throw new Error("Court name is required for all courts");
        }
        if (!court.venueId) {
            throw new Error("Venue ID is required for all courts");
        }
    }
    return await courtRepository.saveCourt(courtData);
} else {
    if (!courtData.courtName) {
    throw new Error("Court name is required");

  }
    if (!courtData.venueId) {
    throw new Error("Venue ID is required");
  }
    return await courtRepository.saveCourt(courtData);
}

};
