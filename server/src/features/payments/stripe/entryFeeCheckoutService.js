const Club = require("../../../../model/club");
const RoundRobinPayment = require("../../round-robin/models/RoundRobinPayment");
const RoundRobinPlayer = require("../../round-robin/models/RoundRobinPlayer");
const RoundRobinTournament = require("../../round-robin/models/RoundRobinTournament");
const RoundRobinMember = require("../../round-robin/models/RoundRobinMember");
const { stripe, CURRENCY, clientUrl } = require("./stripeClient");
const { calculateFees, toCents } = require("./feeCalculator");

const httpError = (status, message) => Object.assign(new Error(message), { status });

const entryFeeFor = (tournament, player) =>
  Number(player.isMember ? tournament.entryFeeMember || 0 : tournament.entryFeeNonMember || 0);

// The club that owns a round robin, and whether it can take card payments.
const getPayableClub = async (adminId) => {
  const club = await Club.findOne({ adminId });
  const ready = !!club?.stripeAccountId && !!club?.stripeChargesEnabled;
  return { club, ready };
};

// Pull the latest state of a pending Stripe payment from its Checkout Session
// (covers a missed or delayed webhook).
const refreshStripePayment = async (payment) => {
  // Paid self-join still waiting for its registration → finish it.
  if (payment.status === "COMPLETED" && payment.purpose === "self_join" && !payment.playerId) {
    return finalizeSelfJoin(payment);
  }
  if (payment.provider !== "stripe" || payment.status !== "PENDING" || !payment.stripeCheckoutSessionId) {
    return payment;
  }
  const session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
  if (session.status === "complete" && session.payment_status === "paid") {
    payment.status = "COMPLETED";
    payment.stripePaymentIntentId = session.payment_intent;
    payment.paidAt = payment.paidAt || new Date();
    await payment.save();
    await finalizeSelfJoin(payment);
  } else if (session.status === "expired") {
    payment.status = "CANCELED";
    await payment.save();
  }
  return payment;
};

/**
 * Creates (or reuses) a Stripe Checkout Session for a round robin entry fee.
 * Destination charge: the player pays the platform, Stripe transfers
 * amount − applicationFee to the club's connected account, which pays out to
 * the club's BSB. applicationFee = platform 1% + Stripe card fee estimate.
 */
const createEntryFeeCheckout = async ({ tournament, player, initiatedBy }) => {
  const entryFee = entryFeeFor(tournament, player);
  if (entryFee <= 0) throw httpError(400, "This round robin has no entry fee.");

  const { club, ready } = await getPayableClub(tournament.adminId);
  if (!ready) throw httpError(400, "This club hasn't finished setting up card payments yet.");

  // One live checkout per player: reuse an open session, refuse if already paid.
  const existing = await RoundRobinPayment.findOne({
    tournamentId: tournament._id,
    playerId: player._id,
    provider: "stripe",
    status: { $in: ["PENDING", "COMPLETED"] },
  }).sort({ createdAt: -1 });
  if (existing) {
    await refreshStripePayment(existing);
    if (existing.status === "COMPLETED") throw httpError(409, "This entry fee has already been paid.");
    if (existing.status === "PENDING" && existing.checkoutUrl) return existing;
  }

  const fees = calculateFees(toCents(entryFee), club.platformFeeBps);

  const payment = await RoundRobinPayment.create({
    tournamentId: tournament._id,
    adminId: tournament.adminId,
    playerId: player._id,
    playerName: player.name,
    amount: entryFee,
    currency: "AUD",
    status: "PENDING",
    provider: "stripe",
    initiatedBy,
    clubId: club._id,
    stripeAccountId: club.stripeAccountId,
    ...fees,
  });

  const metadata = {
    roundRobinPaymentId: String(payment._id),
    tournamentId: String(tournament._id),
    playerId: String(player._id),
    clubId: String(club._id),
  };
  const back = `rr=${tournament._id}&by=${initiatedBy}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: player.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: fees.amountCents,
            product_data: {
              name: `Entry fee — ${tournament.tournamentName}`,
              description: `${player.name}${club.name ? ` · ${club.name}` : ""}`,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: fees.applicationFeeCents,
        transfer_data: { destination: club.stripeAccountId },
        on_behalf_of: club.stripeAccountId, // club is the merchant on the card statement
        description: `Round robin entry fee: ${tournament.tournamentName} (${player.name})`,
        metadata,
      },
      metadata,
      success_url: `${clientUrl()}/payment/result?status=success&${back}`,
      cancel_url: `${clientUrl()}/payment/result?status=cancelled&${back}`,
    },
    { idempotencyKey: `rr-entry-${payment._id}` }
  );

  payment.stripeCheckoutSessionId = session.id;
  payment.checkoutUrl = session.url;
  await payment.save();
  return payment;
};

const LOCKED_STATUSES = ["Finalized", "Ongoing", "Completed"];

/**
 * Self-join: the player pays FIRST; the registration (RoundRobinPlayer) is only
 * created by finalizeSelfJoin once Stripe confirms the payment. Reuses an open
 * checkout for the same member + round robin.
 */
const createSelfJoinCheckout = async ({ tournament, member }) => {
  if (typeof member.isMember !== "boolean") throw httpError(400, "Your membership type hasn't been set by the club yet.");
  const entryFee = entryFeeFor(tournament, member);
  if (entryFee <= 0) throw httpError(400, "This round robin has no entry fee.");

  const { club, ready } = await getPayableClub(tournament.adminId);
  if (!ready) throw httpError(400, "This club hasn't set up online payments yet — contact the club to register.");

  const existing = await RoundRobinPayment.findOne({
    tournamentId: tournament._id,
    memberId: member._id,
    purpose: "self_join",
    status: "PENDING",
  }).sort({ createdAt: -1 });
  if (existing) {
    await refreshStripePayment(existing);
    if (existing.status === "PENDING" && existing.checkoutUrl) return existing;
    if (existing.status === "COMPLETED") throw httpError(409, "You've already paid — your registration is being confirmed.");
  }

  const fees = calculateFees(toCents(entryFee), club.platformFeeBps);
  const payment = await RoundRobinPayment.create({
    tournamentId: tournament._id,
    adminId: tournament.adminId,
    memberId: member._id,
    playerName: member.name,
    amount: entryFee,
    currency: "AUD",
    status: "PENDING",
    provider: "stripe",
    purpose: "self_join",
    initiatedBy: "player",
    clubId: club._id,
    stripeAccountId: club.stripeAccountId,
    ...fees,
  });

  const metadata = {
    roundRobinPaymentId: String(payment._id),
    tournamentId: String(tournament._id),
    memberId: String(member._id),
    clubId: String(club._id),
    purpose: "self_join",
  };
  const back = `rr=${tournament._id}&by=player&join=1`;
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: member.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: fees.amountCents,
            product_data: {
              name: `Entry fee — ${tournament.tournamentName}`,
              description: `${member.name} · ${member.isMember ? "Member" : "Non-member"}${club.name ? ` · ${club.name}` : ""}`,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: fees.applicationFeeCents,
        transfer_data: { destination: club.stripeAccountId },
        on_behalf_of: club.stripeAccountId,
        description: `Round robin registration: ${tournament.tournamentName} (${member.name})`,
        metadata,
      },
      metadata,
      // Short expiry so an abandoned checkout doesn't linger (Stripe minimum is 30 min).
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${clientUrl()}/payment/result?status=success&${back}`,
      cancel_url: `${clientUrl()}/payment/result?status=cancelled&${back}`,
    },
    { idempotencyKey: `rr-join-${payment._id}` }
  );

  payment.stripeCheckoutSessionId = session.id;
  payment.checkoutUrl = session.url;
  await payment.save();
  return payment;
};

/**
 * Called when a self-join payment succeeds (webhook or status refresh).
 * Creates the registration. If the round robin filled up or was scheduled in
 * the meantime, the payment is refunded in full instead. Safe to call twice.
 */
const finalizeSelfJoin = async (payment) => {
  if (payment.purpose !== "self_join" || payment.status !== "COMPLETED" || payment.playerId) return payment;

  const [tournament, member] = await Promise.all([
    RoundRobinTournament.findById(payment.tournamentId).lean(),
    RoundRobinMember.findById(payment.memberId).lean(),
  ]);

  const refundWith = async (reason) => {
    payment.failureReason = reason;
    await payment.save();
    if (payment.stripePaymentIntentId) {
      await stripe.refunds.create(
        { payment_intent: payment.stripePaymentIntentId, reverse_transfer: true, refund_application_fee: true },
        { idempotencyKey: `rr-join-refund-${payment._id}` }
      );
    }
    payment.status = "REFUNDED";
    payment.refundedCents = payment.amountCents;
    await payment.save();
    return payment;
  };

  if (!tournament || !member || !member.isActive) return refundWith("Registration no longer available");

  // Already registered (e.g. the admin added them meanwhile) → just link.
  let player = await RoundRobinPlayer.findOne({ tournamentId: tournament._id, memberId: member._id });
  if (!player) {
    if (LOCKED_STATUSES.includes(tournament.status)) return refundWith("The schedule was finalized before your payment completed");
    const slots = Number(tournament.numberOfSlots) > 0 ? Number(tournament.numberOfSlots) : null;
    if (slots != null && (await RoundRobinPlayer.countDocuments({ tournamentId: tournament._id })) >= slots) {
      return refundWith("The round robin filled up before your payment completed");
    }
    try {
      player = await RoundRobinPlayer.create({
        tournamentId: tournament._id,
        memberId: member._id,
        name: member.name,
        email: member.email,
        contact: member.contact,
        grade: member.grade,
        isMember: member.isMember,
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
      player = await RoundRobinPlayer.findOne({ tournamentId: tournament._id, email: member.email });
    }
    // Last-slot race: undo and refund if two payments landed together.
    if (slots != null && (await RoundRobinPlayer.countDocuments({ tournamentId: tournament._id })) > slots) {
      await RoundRobinPlayer.deleteOne({ _id: player._id });
      return refundWith("The round robin filled up before your payment completed");
    }
  }

  payment.playerId = player._id;
  await payment.save();
  return payment;
};

// Full refund: returns the club's share (reverse_transfer) and the platform's
// application fee. Stripe keeps its own processing fee.
const refundEntryFee = async (payment) => {
  if (payment.provider !== "stripe") throw httpError(400, "Only card payments taken through Stripe can be refunded here.");
  if (payment.status !== "COMPLETED" || !payment.stripePaymentIntentId) {
    throw httpError(400, "Only completed payments can be refunded.");
  }
  const refund = await stripe.refunds.create(
    { payment_intent: payment.stripePaymentIntentId, reverse_transfer: true, refund_application_fee: true },
    { idempotencyKey: `rr-refund-${payment._id}` }
  );
  payment.status = "REFUNDED";
  payment.refundedCents = refund.amount;
  await payment.save();
  return payment;
};

module.exports = {
  createEntryFeeCheckout,
  createSelfJoinCheckout,
  finalizeSelfJoin,
  refreshStripePayment,
  refundEntryFee,
  getPayableClub,
  entryFeeFor,
};
