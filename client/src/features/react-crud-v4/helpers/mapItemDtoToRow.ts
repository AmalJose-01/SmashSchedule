// ============================================================================
// Pure mapper: API DTO → UI row
// No side effects. Easy to unit test.
//
// Maps the StudentSummary DTO (v3 NZAMP shape) to a flat ItemRow for the table.
// ============================================================================

import dayjs from "dayjs";
import type { ItemDto } from "../Services/crud.dtos";

/** A single item displayed in the table (maps from StudentSummary DTO). */
export type ItemRow = {
  id: number;            // StudentNumber
  studentKey: string;
  name: string;          // StudentName
  year: string;          // CurrentYear
  nsn: string;
  homeClass: string;
  coreClass: string;
  house: string;
  homeRoom: string;
  homeTeacher: string;
  dean: string;
  deputy: string;
  previousTermStatusId: number;
  currentTermStatusId: number;
  currentTermStatus: string;
  currentTermStatusColor: string;
  previousTermStatus: string;
  previousTermStatusColor: string;
  currentSummary: string;
  currentSummaryDetail: string;
  thresholdCrossed: string | null;
  daysAbsentT1: number;
  daysAbsentT2: number;
  daysAbsentT3: number;
  daysAbsentT4: number;
  daysAbsentYtd: number;
  lastActivityDate: string | null;
  lastActivity: string;
};

export const mapItemDtoToRow = (dto: ItemDto): ItemRow => ({
  id: dto.StudentNumber,
  studentKey: dto.StudentKey,
  name: dto.StudentName,
  year: dto.CurrentYear,
  nsn: dto.NSN,
  homeClass: dto.HomeClass,
  coreClass: dto.CoreClass,
  house: dto.House,
  homeRoom: dto.HomeRoom,
  homeTeacher: dto.HomeTeacher,
  dean: dto.Dean,
  deputy: dto.Deputy,
  previousTermStatusId: dto.PreviousTermStatusId,
  currentTermStatusId: dto.CurrentTermStatusId,
  currentTermStatus: dto.CurrentTermStatusName,
  currentTermStatusColor: dto.CurrentTermStatusColor,
  previousTermStatus: dto.PreviousTermStatusName,
  previousTermStatusColor: dto.PreviousTermStatusColor,
  currentSummary: "",
  currentSummaryDetail: "",
  thresholdCrossed: dto.LastThresholdCrossedDate
    ? dayjs(dto.LastThresholdCrossedDate).format("DD/MM/YYYY")
    : null,
  daysAbsentT1: dto.DaysAbsentT1,
  daysAbsentT2: dto.DaysAbsentT2,
  daysAbsentT3: dto.DaysAbsentT3,
  daysAbsentT4: dto.DaysAbsentT4,
  daysAbsentYtd: dto.DaysAbsentYtd,
  lastActivityDate: dto.LastActivityDate
    ? dayjs(dto.LastActivityDate).format("DD/MM/YYYY")
    : null,
  lastActivity: dto.LastActivityName ?? "",
});
