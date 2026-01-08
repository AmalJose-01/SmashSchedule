const buildAdminMailBody = require("../../utils/adminMailTemplate");
const buildPlayerMailBody = require("../../utils/playerMailTemplate");
const sendEmail = require("../../utils/sendEmail");


const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendRegistrationEmails({
  teams,
  playerMailSubject,
  adminMailSubject,
  tournamentDetail,
  AdminUserDetail,
}) {
  for (const team of teams) {

console.log("Sending email to team:", team.teamName);


    const playerMailBody = buildPlayerMailBody({
      teamName: team.teamName,
      playerOneName: team.playerOneName,
      playerTwoName: team.playerTwoName,
      tournamentDetail,
    });

    if (team.playerOneEmail) {
      await sendEmail({
        to: team.playerOneEmail,
        subject: playerMailSubject,
        html: playerMailBody,
      });
      await delay(1200); // ⏱ Gmail safe delay
    }

    if (team.playerTwoEmail) {
      await sendEmail({
        to: team.playerTwoEmail,
        subject: playerMailSubject,
        html: playerMailBody,
      });
      await delay(1200);
    }

    if (AdminUserDetail?.emailID) {
      const adminMailBody = buildAdminMailBody({
        teamName: team.teamName,
        tournamentId: tournamentDetail.id,
        playerOneName: team.playerOneName,
        playerOneEmail: team.playerOneEmail,
        playerTwoName: team.playerTwoName,
        playerTwoEmail: team.playerTwoEmail,
      });

      await sendEmail({
        to: AdminUserDetail.emailID,
        subject: adminMailSubject,
        html: adminMailBody,
      });

      await delay(1200);
    }
  }

  console.log("✅ All registration emails processed");
}

module.exports = sendRegistrationEmails;
