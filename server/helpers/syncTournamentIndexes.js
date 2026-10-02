// Keep the database indexes for tournament teams / players exactly as the
// schemas define them. All uniqueness rules are PER TOURNAMENT
// ({ tournamentId, email } etc.). syncIndexes() drops any old index that is
// not in the schema — e.g. a leftover global unique index on an email field,
// which would wrongly block the same person from joining another tournament.
// Only indexes are changed; no documents are touched.
const syncTournamentIndexes = async () => {
  for (const [name, path] of [
    ["TournamentPlayer", "../model/tournamentPlayer.js"],
    ["Team", "../model/team.js"],
  ]) {
    try {
      const dropped = await require(path).syncIndexes();
      if (dropped?.length) console.log(`${name}: dropped old indexes ${dropped.join(", ")}`);
    } catch (error) {
      console.error(`${name} index sync failed:`, error.message);
    }
  }
};

module.exports = syncTournamentIndexes;
