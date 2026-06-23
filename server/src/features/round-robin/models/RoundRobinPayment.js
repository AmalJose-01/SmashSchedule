const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoundRobinPaymentSchema = new Schema(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "RoundRobinTournament", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    playerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer", required: true },
    playerName: { type: String },
    amount: { type: Number, required: true }, // dollars
    currency: { type: String, default: "AUD" },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "CANCEL_REQUESTED", "COMPLETED", "CANCELED", "FAILED"],
      default: "PENDING",
    },
    squareCheckoutId: { type: String, index: true },
    squareDeviceId: { type: String },
    squareLocationId: { type: String },
    squarePaymentId: { type: String },
    rawWebhookEvent: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinPayment", RoundRobinPaymentSchema);
