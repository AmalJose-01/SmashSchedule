
export const deleteCourtUseCase = async (courtId, courtRepository) => {
if (!courtId){
    throw new Error("Court ID is required");

}
return await courtRepository.deleteCourt(courtId);
}