const buildAdminMailBody = require("../../utils/adminMailTemplate");
const buildPlayerMailBody = require("../../utils/playerMailTemplate");
const sendEmail = require("../../utils/sendEmail");
const getMailContext = require("../../utils/mailContext");


const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendRegistrationEmails({
  teams,
  playerMailSubject,
  adminMailSubject,
  tournamentDetail,
  AdminUserDetail,
}) {
  // Fresh tournament details + club name from the database (the request body
  // only carries a partial tournament object).
  const ctx = await getMailContext(tournamentDetail?._id || tournamentDetail?.id);
  const mailTournament = { ...tournamentDetail, ...ctx.tournamentDetail };

  for (const team of teams) {


    const bodyFor = (playerName) =>
      buildPlayerMailBody({
        teamName: team.teamName,
        playerName,
        tournamentDetail: mailTournament,
        clubName: ctx.clubName,
      });

    if (team.playerOneEmail) {
      await sendEmail({
        to: team.playerOneEmail,
        subject: playerMailSubject,
        html: bodyFor(team.playerOneName),
      });
      await delay(1200);
    }

    if (team.playerTwoEmail) {
      await sendEmail({
        to: team.playerTwoEmail,
        subject: playerMailSubject,
        html: bodyFor(team.playerTwoName),
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

}

module.exports = sendRegistrationEmails;
