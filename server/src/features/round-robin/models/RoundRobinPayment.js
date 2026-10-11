const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoundRobinPaymentSchema = new Schema(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "RoundRobinTournament", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    // Set once the player exists. A self-join payment has no player until the
    // payment succeeds — the registration is created only after payment.
    playerId: { type: Schema.Types.ObjectId, ref: "RoundRobinPlayer" },
    // "entry_fee" = paying for an existing registration (admin QR / Pay button)
    // "self_join" = player joining online; registration created after payment
    purpose: { type: String, enum: ["entry_fee", "self_join"], default: "entry_fee" },
    memberId: { type: Schema.Types.ObjectId, ref: "RoundRobinMember", index: true, sparse: true },
    failureReason: { type: String },
    playerName: { type: String },
    amount: { type: Number, required: true }, // dollars
    currency: { type: String, default: "AUD" },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "CANCEL_REQUESTED", "COMPLETED", "CANCELED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    // "stripe" (Checkout + Connect destination charge) or legacy "square" (Terminal)
    provider: { type: String, enum: ["square", "stripe"], default: "square" },
    // Who started it: the admin (QR at the desk) or the player (self-pay)
    initiatedBy: { type: String, enum: ["admin", "player"], default: "admin" },
    squareCheckoutId: { type: String, index: true },
    squareDeviceId: { type: String },
    squareLocationId: { type: String },
    squarePaymentId: { type: String },
    // ── Stripe (all money fields in cents) ──
    clubId: { type: Schema.Types.ObjectId, ref: "Club" },
    stripeAccountId: { type: String },
    stripeCheckoutSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    checkoutUrl: { type: String },
    amountCents: { type: Number },
    platformFeeCents: { type: Number },
    stripeFeeEstimateCents: { type: Number },
    applicationFeeCents: { type: Number },
    clubNetCents: { type: Number },
    platformFeeBps: { type: Number },
    refundedCents: { type: Number, default: 0 },
    paidAt: { type: Date },
    rawWebhookEvent: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoundRobinPayment", RoundRobinPaymentSchema);
