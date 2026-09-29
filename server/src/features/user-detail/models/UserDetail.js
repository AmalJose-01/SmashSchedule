const mongoose = require("mongoose");
const { Schema } = mongoose;

// A player's own profile details, one document per user account (AdminUser
// with accountType "user"). Same personal fields an admin records for a
// member in the Round Robin member bank — minus grade/points, which stay
// admin-managed.
const UserDetailSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true, unique: true },
    name: { type: String, trim: true, default: "" },
    contact: { type: String, trim: true, default: "" },
    gender: { type: String, trim: true, default: "" },
    dateOfBirth: { type: Date, default: null },
    nationalMemberId: { type: String, trim: true, default: "" },
    // "My Clubs": clubs the player added from Find a Club. Starred ones
    // (isFavourite) show on their dashboard.
    clubs: [
      {
        _id: false,
        club: { type: Schema.Types.ObjectId, ref: "Club", required: true },
        isFavourite: { type: Boolean, default: false },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserDetail", UserDetailSchema, "userdetails");
