const RoundRobinTournament = require("../models/RoundRobinTournament");

// One-off backfill for round robins created before the "Accept online payment"
// switch existed. They have no `acceptOnlinePayment` stored, so the switch
// showed as off even when fees were set. Store the real value in the DB:
// true when a member or non-member fee is set, false otherwise.
// Safe to run on every start — it only touches documents missing the field.
const backfillAcceptOnlinePayment = async () => {
  try {
    const result = await RoundRobinTournament.collection.updateMany(
      { acceptOnlinePayment: { $exists: false } },
      [
        {
          $set: {
            acceptOnlinePayment: {
              $gt: [
                {
                  $add: [
                    { $ifNull: ["$entryFeeMember", 0] },
                    { $ifNull: ["$entryFeeNonMember", 0] },
                  ],
                },
                0,
              ],
            },
          },
        },
      ]
    );
    if (result.modifiedCount > 0) {
      console.log(`acceptOnlinePayment backfilled on ${result.modifiedCount} round robin(s)`);
    }
  } catch (error) {
    console.error("acceptOnlinePayment backfill failed:", error.message);
  }
};

module.exports = backfillAcceptOnlinePayment;
