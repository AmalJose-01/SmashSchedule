const Tournament = require("../../../../model/tournamentModel");
const Team = require("../../../../model/team");
const TournamentPlayer = require("../../../../model/tournamentPlayer");
const TournamentPayment = require("../../../../model/tournamentPayment");
const { getRemainingSlots, fullMessage } = require("../../../../helpers/participantLimit");
const sendTeamRegistrationEmails = require("../../../../utils/teamRegistrationEmails");
const { stripe, CURRENCY, clientUrl } = require("./stripeClient");
const { calculateFees, toCents } = require("./feeCalculator");
const { getPayableClub } = require("./entryFeeCheckoutService");

// Online payment for team / singles Tournaments (the round robin equivalent
// lives in entryFeeCheckoutService). Pay-first: the Team / TournamentPlayer is
// only created once Stripe confirms the payment.

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Registration Fee is stored as text ("25", "$25"). 0 unless "Accept online
// payment" is switched on.
const tournamentFee = (tournament) => {
  if (tournament?.acceptOnlinePayment !== true) return 0;
  const n = Number(String(tournament.registrationFee ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const clean = (v) => (typeof v === "string" ? v.trim() : v);

// Only the fields we need, trimmed — what's stored on the payment until it's paid.
const sanitizeRegistration = (kind, r = {}) =>
  kind === "team"
    ? {
        teamName: clean(r.teamName),
        playerOneName: clean(r.playerOneName),
        playerTwoName: clean(r.playerTwoName),
        playerOneEmail: clean(r.playerOneEmail),
        playerTwoEmail: clean(r.playerTwoEmail),
        playerOneContact: clean(r.playerOneContact),
        playerTwoContact: clean(r.playerTwoContact),
        playerOneDOB: clean(r.playerOneDOB),
        playerTwoDOB: clean(r.playerTwoDOB),
      }
    : {
        name: clean(r.name),
        email: String(clean(r.email) || "").toLowerCase(),
        contact: clean(r.contact),
        dob: clean(r.dob) || undefined,
      };

const payerOf = (kind, reg) =>
  kind === "team"
    ? { payerEmail: String(reg.playerOneEmail || "").toLowerCase(), payerName: reg.playerOneName }
    : { payerEmail: String(reg.email || "").toLowerCase(), payerName: reg.name };

// Same duplicate rules as the free registration.
const findDuplicate = (kind, tournamentId, reg) =>
  kind === "team"
    ? Team.findOne({
        tournamentId,
        $or: [
          { playerOneEmail: reg.playerOneEmail },
          { playerTwoEmail: reg.playerTwoEmail },
          { playerOneContact: reg.playerOneContact },
          { playerTwoContact: reg.playerTwoContact },
        ],
      })
    : TournamentPlayer.findOne({
        tournamentId,
        $or: [{ email: reg.email }, { contact: reg.contact }],
      });

// Throws the same errors as the free registration so the player sees the
// reason BEFORE being sent to pay.
const assertCanRegister = async (tournament, kind, reg) => {
  if (tournament.status !== "Create") throw httpError(400, "Registration for this tournament is closed");
  if (kind === "team" && tournament.matchType !== "Doubles") {
    throw httpError(400, "This is a Singles tournament — register as a player");
  }
  if (kind === "player" && tournament.matchType === "Doubles") {
    throw httpError(400, "This is a Doubles tournament — register a team");
  }
  if (await findDuplicate(kind, tournament._id, reg)) {
    throw httpError(400, kind === "team" ? "Email or Contact already exists" : "Already registered in this tournament");
  }
  const { max, remaining } = await getRemainingSlots(tournament._id);
  if (remaining <= 0) throw httpError(409, fullMessage(max));
};

// Pull the latest state of a pending checkout from Stripe (covers a missed or
// delayed webhook) and finish the registration if it was paid.
const refreshTournamentPayment = async (payment) => {
  if (payment.status === "COMPLETED") return finalizeRegistration(payment);
  if (payment.status !== "PENDING" || !payment.stripeCheckoutSessionId) return payment;

  const session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
  if (session.status === "complete" && session.payment_status === "paid") {
    return markTournamentPaymentPaid(payment, { paymentIntent: session.payment_intent });
  }
  if (session.status === "expired") {
    payment.status = "CANCELED";
    await payment.save();
  }
  return payment;
};

/**
 * Creates (or reuses) a Stripe Checkout Session for a registration fee.
 * Destination charge, same money flow as round robin entry fees: the player
 * pays the platform, Stripe transfers amount − applicationFee to the club.
 */
const createRegistrationCheckout = async ({ tournament, kind, registration }) => {
  const fee = tournamentFee(tournament);
  if (fee <= 0) throw httpError(400, "This tournament has no registration fee.");

  const { club, ready } = await getPayableClub(tournament.adminId);
  if (!ready) throw httpError(400, "This club hasn't set up online payments yet — contact the club to register.");

  const reg = sanitizeRegistration(kind, registration);
  await assertCanRegister(tournament, kind, reg);
  const { payerEmail, payerName } = payerOf(kind, reg);

  // One open checkout per person: reuse it (with their latest details).
  const open = await TournamentPayment.findOne({
    tournamentId: tournament._id,
    payerEmail,
    status: "PENDING",
  }).sort({ createdAt: -1 });
  if (open) {
    await refreshTournamentPayment(open);
    if (open.status === "PENDING" && open.checkoutUrl && open.kind === kind) {
      open.registration = reg;
      open.markModified("registration");
      await open.save();
      return open;
    }
  }

  const fees = calculateFees(toCents(fee), club.platformFeeBps);
  const payment = await TournamentPayment.create({
    tournamentId: tournament._id,
    adminId: tournament.adminId,
    kind,
    registration: reg,
    payerEmail,
    payerName,
    amount: fee,
    currency: "AUD",
    status: "PENDING",
    clubId: club._id,
    stripeAccountId: club.stripeAccountId,
    ...fees,
  });

  const who = kind === "team" ? reg.teamName || `${reg.playerOneName} & ${reg.playerTwoName}` : reg.name;
  const metadata = {
    tournamentPaymentId: String(payment._id),
    tournamentId: String(tournament._id),
    clubId: String(club._id),
    kind: "tournament_registration",
  };
  const back = `tp=${payment._id}&t=${tournament._id}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: payerEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: fees.amountCents,
            product_data: {
              name: `Registration fee — ${tournament.tournamentName}`,
              description: `${who}${club.name ? ` · ${club.name}` : ""}`,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: fees.applicationFeeCents,
        transfer_data: { destination: club.stripeAccountId },
        on_behalf_of: club.stripeAccountId, // club is the merchant on the card statement
        description: `Tournament registration: ${tournament.tournamentName} (${who})`,
        metadata,
      },
      metadata,
      // Short expiry so an abandoned checkout doesn't linger (Stripe minimum is 30 min).
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${clientUrl()}/payment/result?status=success&${back}`,
      cancel_url: `${clientUrl()}/payment/result?status=cancelled&${back}`,
    },
    { idempotencyKey: `tournament-reg-${payment._id}` }
  );

  payment.stripeCheckoutSessionId = session.id;
  payment.checkoutUrl = session.url;
  await payment.save();
  return payment;
};

// Stripe says the money arrived (webhook or status refresh). Safe to call twice.
const markTournamentPaymentPaid = async (payment, { paymentIntent, event } = {}) => {
  if (payment.status === "REFUNDED") return payment;
  if (payment.status !== "COMPLETED") {
    payment.status = "COMPLETED";
    payment.stripePaymentIntentId = paymentIntent || payment.stripePaymentIntentId;
    payment.paidAt = payment.paidAt || new Date();
    if (event) payment.rawWebhookEvent = { id: event.id, type: event.type };
    await payment.save();
  }
  return finalizeRegistration(payment);
};

/**
 * Creates the Team / TournamentPlayer for a paid checkout. If the tournament
 * closed, filled up, or the person is already registered in the meantime, the
 * payment is refunded in full instead. Safe to call twice (and concurrently:
 * only one caller wins the claim).
 */
const finalizeRegistration = async (payment) => {
  if (payment.status !== "COMPLETED" || payment.teamId || payment.playerId) return payment;

  const staleBefore = new Date(Date.now() - 2 * 60 * 1000);
  const claimed = await TournamentPayment.findOneAndUpdate(
    {
      _id: payment._id,
      status: "COMPLETED",
      teamId: { $exists: false },
      playerId: { $exists: false },
      $or: [{ finalizeClaimedAt: { $exists: false } }, { finalizeClaimedAt: { $lt: staleBefore } }],
    },
    { finalizeClaimedAt: new Date() },
    { new: true }
  );
  if (!claimed) return payment.constructor.findById(payment._id); // another worker has it

  const refundWith = async (reason) => {
    claimed.failureReason = reason;
    await claimed.save();
    if (claimed.stripePaymentIntentId) {
      await stripe.refunds.create(
        { payment_intent: claimed.stripePaymentIntentId, reverse_transfer: true, refund_application_fee: true },
        { idempotencyKey: `tournament-reg-refund-${claimed._id}` }
      );
    }
    claimed.status = "REFUNDED";
    claimed.refundedCents = claimed.amountCents;
    await claimed.save();
    return claimed;
  };

  const tournament = await Tournament.findById(claimed.tournamentId).lean();
  if (!tournament) return refundWith("Tournament no longer available");
  if (tournament.status !== "Create") return refundWith("Registration closed before your payment completed");

  const reg = claimed.registration || {};
  if (await findDuplicate(claimed.kind, claimed.tournamentId, reg)) {
    return refundWith("You're already registered in this tournament");
  }
  const { remaining } = await getRemainingSlots(claimed.tournamentId);
  if (remaining <= 0) return refundWith("The tournament filled up before your payment completed");

  let created;
  try {
    created =
      claimed.kind === "team"
        ? await Team.create({ ...reg, tournamentId: claimed.tournamentId })
        : await TournamentPlayer.create({ ...reg, tournamentId: claimed.tournamentId });
  } catch (err) {
    if (err.code === 11000) return refundWith("You're already registered in this tournament");
    throw err;
  }

  // Last-slot race: undo and refund if two payments landed together.
  const after = await getRemainingSlots(claimed.tournamentId);
  if (after.max > 0 && after.current > after.max) {
    await (claimed.kind === "team" ? Team : TournamentPlayer).deleteOne({ _id: created._id });
    return refundWith("The tournament filled up before your payment completed");
  }

  if (claimed.kind === "team") claimed.teamId = created._id;
  else claimed.playerId = created._id;
  await claimed.save();

  if (claimed.kind === "team") {
    // Confirmation emails run in the background; they never throw.
    sendTeamRegistrationEmails({ tournamentId: claimed.tournamentId, ...reg });
  }
  return claimed;
};

// Full refund: returns the club's share (reverse_transfer) and the platform's
// application fee. Stripe keeps its own processing fee.
const refundRegistrationFee = async (payment) => {
  if (payment.status !== "COMPLETED" || !payment.stripePaymentIntentId) {
    throw httpError(400, "Only completed payments can be refunded.");
  }
  const refund = await stripe.refunds.create(
    { payment_intent: payment.stripePaymentIntentId, reverse_transfer: true, refund_application_fee: true },
    { idempotencyKey: `tournament-admin-refund-${payment._id}` }
  );
  payment.status = "REFUNDED";
  payment.refundedCents = refund.amount;
  await payment.save();
  return payment;
};

module.exports = {
  tournamentFee,
  assertCanRegister,
  createRegistrationCheckout,
  refreshTournamentPayment,
  markTournamentPaymentPaid,
  finalizeRegistration,
  refundRegistrationFee,
};
