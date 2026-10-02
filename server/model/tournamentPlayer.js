const mongoose = require("mongoose");

// A player registered in a Singles tournament (knockout / group tournaments).
// Doubles tournaments keep using teams (collection "tournamentteams").
// Stored in the "tournamentplayers" collection.
//
// Name, email and contact number are required. Date of birth, grade and
// member no. are optional — empty values are not stored.
const tournamentPlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    contact: { type: String, required: true, trim: true },
    dob: { type: String },
    grade: { type: String, trim: true },
    memberNo: { type: String, trim: true }, // e.g. Badminton Victoria member no.
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// One registration per email / phone number IN A TOURNAMENT (not globally).
// Partial: players without an email/phone don't clash with each other.
tournamentPlayerSchema.index(
  { tournamentId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true } } }
);
tournamentPlayerSchema.index(
  { tournamentId: 1, contact: 1 },
  { unique: true, partialFilterExpression: { contact: { $exists: true } } }
);

module.exports = mongoose.model("TournamentPlayer", tournamentPlayerSchema, "tournamentplayers");
