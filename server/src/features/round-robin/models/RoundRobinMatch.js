const mongoose = require("mongoose");
const { Schema } = mongoose;

const SetSchema = new Schema({ home: Number, away: Number }, { _id: false });

const RoundRobinMatchSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "RoundRobinTournament",
      required: true,
    },
    groupId: { type: Schema.Types.ObjectId, ref: "RoundRobinGroup" },
    // Graded format only (tournament.format === "Graded"): which grade
    // group this match belongs to (e.g. "A", or "C+D" for a merged group).
    // Graded tournaments have no RoundRobinGroup docs at all — this label
    // is the grouping info instead, alongside groupId staying null.
    gradeGroupLabel: { type: String, default: null },
    // Graded format only: which "wave" this match's group ran in, when the
    // tournament had fewer courts than grade groups and groups had to take
    // turns on the available courts (0-based; 0 = ran first).
    wave: { type: Number, default: null },
    // Graded format only: this match's round number WITHIN its grade
    // group's own schedule (from queueRoundRobinEngine) — what the sit-out
    // rotation and immediate-rematch check (Rules 1 and 3) are tracked
    // against. Independent groups run their own slot sequence; this is not
    // a single tournament-wide round counter.
    slot: { type: Number, default: null },
    matchName: { type: String, required: true },
    player1Id: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer" },
    player1PartnerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    player2Id: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer" },
    player2PartnerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    court: { type: String, default: "" },
    scheduledTime: { type: Date },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    sets: [SetSchema],
    winner: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    loser: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", default: null },
    // True when a completed match ended in a draw (only possible for an
    // even-numbered "Best of N" format, e.g. Best of 2, tied on sets and
    // total points). Distinguishes a draw from a not-yet-decided match,
    // since `winner`/`loser` are both null in either case.
    isDraw: { type: Boolean, default: false },
    // True for an automatic BYE — awarded at finalize time to a player (or,
    // in Doubles, a same-group pair) who'd otherwise be left short of the
    // tournament's per-member match target with no valid opponent left to
    // pair against (e.g. an odd leftover after grouping/makeup matches). A
    // bye still shows up as a normal entry in the match list, but it's
    // pre-resolved — no live opponent (player2Id stays null) and no score to
    // enter — status is "completed" and winner is set the moment it's
    // created, so the player's match count, personal points, and group
    // standings all come out even with everyone else's.
    isBye: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinMatch", RoundRobinMatchSchema);
