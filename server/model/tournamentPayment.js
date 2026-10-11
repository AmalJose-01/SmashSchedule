const mongoose = require("mongoose");
const { Schema } = mongoose;

// Online registration-fee payment for a (team / singles) Tournament.
//
// Pay-first: nothing is registered until Stripe confirms the payment. The form
// the player filled in is kept in `registration` and turned into a Team or
// TournamentPlayer by finalizeRegistration (webhook or status refresh).
const TournamentPaymentSchema = new Schema(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    // "team" = Doubles team, "player" = Singles player
    kind: { type: String, enum: ["team", "player"], required: true },
    registration: { type: Schema.Types.Mixed, required: true },
    payerEmail: { type: String, lowercase: true, trim: true, index: true },
    payerName: { type: String },
    // Set once the registration exists
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    playerId: { type: Schema.Types.ObjectId, ref: "TournamentPlayer" },
    finalizeClaimedAt: { type: Date },
    failureReason: { type: String },

    amount: { type: Number, required: true }, // dollars
    currency: { type: String, default: "AUD" },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

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

module.exports = mongoose.model("TournamentPayment", TournamentPaymentSchema);
