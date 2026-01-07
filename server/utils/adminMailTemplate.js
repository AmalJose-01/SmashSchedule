const buildAdminMailBody = ({
  teamName,
  tournamentId,
  tournamentDetail,
  playerOneName,
  playerOneEmail,
  playerTwoName,
  playerTwoEmail,
}) => {
  return `
    <h3>📢 New Team Registered</h3>
  <p><strong>Team Name:</strong> ${teamName}</p>
  <p><strong>Tournament ID:</strong> ${tournamentId}</p>

  <ul>
    <li>${playerOneName} (${playerOneEmail})</li>
    <li>${playerTwoName} (${playerTwoEmail})</li>
  </ul>
  `;
};

module.exports = buildAdminMailBody;