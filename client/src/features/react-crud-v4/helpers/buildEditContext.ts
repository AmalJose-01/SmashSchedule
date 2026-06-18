// ============================================================================
// Pure helper: builds an ItemEditContext from an ItemDto for the edit modal.
// No React, no side effects. Easy to unit test.
//
// Since the list shows StudentSummary rows, the edit context is built from
// the student's last activity data. For a full edit, the individual page
// would fetch detailed activity data — this is a simplified template.
// ============================================================================

import type { ItemDto } from "../Services/crud.dtos";
import type { ItemEditContext } from "../Services/crud.types";

export const buildEditContext = (dto: ItemDto): ItemEditContext => ({
  mode: "update",
  studentActivityId: dto.LastActivityId,
  studentId: dto.StudentNumber,
  studentKey: dto.StudentKey,
  activityId: dto.LastActivityId,
  completedDate: dto.LastActivityDate ? new Date(dto.LastActivityDate) : new Date(),
  completedBy: 0,
  notes: "",
  restrictedNotes: false,
});
