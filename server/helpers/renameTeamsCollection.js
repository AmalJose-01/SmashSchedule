const mongoose = require("mongoose");

// One-off: rename the old "teams" collection to "tournamentteams".
// Safe to run on every start — does nothing once "teams" is gone.
// If "tournamentteams" already exists but is empty (Mongoose may create it
// while building indexes), it is replaced. If BOTH have data, nothing is
// touched and a warning is logged so it can be merged by hand.
const renameTeamsCollection = async () => {
  try {
    const db = mongoose.connection.db;
    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
    if (!names.includes("teams")) return;

    let dropTarget = false;
    if (names.includes("tournamentteams")) {
      const count = await db.collection("tournamentteams").countDocuments();
      if (count > 0) {
        console.warn('⚠️  Both "teams" and "tournamentteams" have data — not renaming. Merge them manually.');
        return;
      }
      dropTarget = true;
    }

    await db.renameCollection("teams", "tournamentteams", { dropTarget });
    console.log('Renamed collection "teams" → "tournamentteams"');

    // Make sure the Team model's indexes exist on the renamed collection.
    await require("../model/team.js").createIndexes();
  } catch (error) {
    console.error("teams → tournamentteams rename failed:", error.message);
  }
};

module.exports = renameTeamsCollection;
