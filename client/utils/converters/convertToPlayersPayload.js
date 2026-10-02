import { formatDate } from "../formatters/formatDate";
import { PLAYER_HEADER_MAP } from "../mappers/playerHeaderMap";
import { getMappedValue } from "../mappers/getMappedValue";

// Spreadsheet rows → POST /admin/players payload (Singles tournaments).
export const convertToPlayersPayload = (rows, tournamentId) => ({
  tournamentId,
  players: rows.map((row) => ({
    name: getMappedValue(row, PLAYER_HEADER_MAP.name),
    email: getMappedValue(row, PLAYER_HEADER_MAP.email),
    contact: String(getMappedValue(row, PLAYER_HEADER_MAP.contact) ?? ""),
    dob: formatDate(getMappedValue(row, PLAYER_HEADER_MAP.dob)) || "",
    grade: getMappedValue(row, PLAYER_HEADER_MAP.grade),
    memberNo: String(getMappedValue(row, PLAYER_HEADER_MAP.memberNo) ?? ""),
  })),
});
