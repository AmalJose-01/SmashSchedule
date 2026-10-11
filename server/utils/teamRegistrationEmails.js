const Tournament = require("../model/tournamentModel.js");
const AdminUser = require("../model/adminUser.js");
const sendEmail = require("./sendEmail.js");
const buildPlayerMailBody = require("./playerMailTemplate.js");
const buildAdminMailBody = require("./adminMailTemplate.js");
const getMailContext = require("./mailContext.js");

// "Team registered" emails: one to each player, one to the tournament admin.
// Used by the normal registration and by the paid one (after Stripe confirms).
// sendEmail never throws and this try/catch keeps any other failure contained,
// so callers can fire it in the background.
const sendTeamRegistrationEmails = async ({
  tournamentId,
  teamName,
  playerOneName,
  playerOneEmail,
  playerTwoName,
  playerTwoEmail,
}) => {
  try {
    const tournamentDetail = await Tournament.findOne({ _id: tournamentId }).select(
      "tournamentName adminId uniqueKey date time location"
    );
    if (!tournamentDetail) return;

    const admin = await AdminUser.findOne({ _id: tournamentDetail.adminId }).select("emailID");
    const { clubName } = await getMailContext(tournamentId);
    const playerMailSubject = "✅ Team Registration Successful";
    const bodyFor = (playerName) =>
      buildPlayerMailBody({ teamName, playerName, tournamentDetail, clubName });

    await Promise.all([
      sendEmail({ to: playerOneEmail, subject: playerMailSubject, html: bodyFor(playerOneName) }),
      sendEmail({ to: playerTwoEmail, subject: playerMailSubject, html: bodyFor(playerTwoName) }),
    ]);

    if (admin?.emailID) {
      await sendEmail({
        to: admin.emailID,
        subject: "📢 New Team Registered",
        html: buildAdminMailBody({
          teamName,
          tournamentId,
          playerOneName,
          playerOneEmail,
          playerTwoName,
          playerTwoEmail,
        }),
      });
    }
  } catch (err) {
    console.error("Registration email error:", err.message);
  }
};

module.exports = sendTeamRegistrationEmails;
