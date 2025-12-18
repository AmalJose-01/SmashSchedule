import { formatDate } from "../formatters/formatDate";
import { TEAM_HEADER_MAP } from "../mappers/teamHeaderMap";
import { getMappedValue } from "../mappers/getMappedValue";

export const convertToTeamsPayload = (rows, tournamentId) => {
  return {
    teams: rows.map((row) => {
      const playerOneName = getMappedValue(row, TEAM_HEADER_MAP.playerOneName);
      const playerTwoName = getMappedValue(row, TEAM_HEADER_MAP.playerTwoName);

      return {
        tournamentId,

        teamName:
          getMappedValue(row, TEAM_HEADER_MAP.teamName) ||
          `${playerOneName} & ${playerTwoName}`,

        playerOneName,
        playerTwoName,

        playerOneEmail: getMappedValue(row, TEAM_HEADER_MAP.playerOneEmail),
        playerTwoEmail: getMappedValue(row, TEAM_HEADER_MAP.playerTwoEmail),

        playerOneContact: getMappedValue(row, TEAM_HEADER_MAP.playerOneContact),
        playerTwoContact: getMappedValue(row, TEAM_HEADER_MAP.playerTwoContact),

        playerOneDOB: formatDate(
          getMappedValue(row, TEAM_HEADER_MAP.playerOneDOB)
        ),
        playerTwoDOB: formatDate(
          getMappedValue(row, TEAM_HEADER_MAP.playerTwoDOB)
        ),
      };
    }),
  };
};
