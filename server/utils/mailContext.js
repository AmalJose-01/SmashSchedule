// Loads what the registration emails need: the tournament (name, date, time,
// venue, access code) and the club name of the admin who runs it.
const Tournament = require("../model/tournamentModel");
const Club = require("../model/club");

const getMailContext = async (tournamentId) => {
  const tournamentDetail = await Tournament.findById(tournamentId)
    .select("tournamentName adminId uniqueKey date time location")
    .lean();
  const club = tournamentDetail?.adminId
    ? await Club.findOne({ adminId: tournamentDetail.adminId }).select("name").lean()
    : null;
  return { tournamentDetail: tournamentDetail || {}, clubName: club?.name || "" };
};

module.exports = getMailContext;
