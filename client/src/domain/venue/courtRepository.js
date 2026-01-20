import { addCourtAPI } from "../../services/admin/courtServices";

export const courtRepository = {
  saveCourt: (courtData) => addCourtAPI(courtData),
};