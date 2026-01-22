import { addCourtAPI, deleteCourtAPI } from "../../services/admin/courtServices";

export const courtRepository = {
  saveCourt: (courtData) => addCourtAPI(courtData),
  deleteCourt: (courtId) => deleteCourtAPI(courtId),
};
