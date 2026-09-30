const mongoose = require("mongoose");
const RoundRobinTournament = require("../models/RoundRobinTournament");
const RoundRobinMatch = require("../models/RoundRobinMatch");
const RoundRobinMember = require("../models/RoundRobinMember");
const RoundRobinPlayer = require("../models/RoundRobinPlayer");
const AdminUser = require("../../login-signup/model/adminUser");
const { getJoinInfo, joinRoundRobin, leaveRoundRobin } = require("../services/playerJoinService");
const RoundRobinPayment = require("../models/RoundRobinPayment");
const { getPayableClub, entryFeeFor, createSelfJoinCheckout, refreshStripePayment, getPlayerPaymentStatus } = require("../../payments/stripe/entryFeeCheckoutService");
const { findMember } = require("../services/playerJoinService");

// Entry fee state for the signed-in player's own registration (or null when
// they haven't joined / there is no fee).
const getMyPaymentInfo = async (tournament, myPlayerIds) => {
  if (!myPlayerIds.length) return null;
  const player = await RoundRobinPlayer.findById(myPlayerIds[0]).select("isMember").lean();
  if (!player) return null;
  const amount = entryFeeFor(tournament, player);
  if (amount <= 0) return null;
  const [status, { ready }] = await Promise.all([
    getPlayerPaymentStatus(tournament._id, player._id),
    getPayableClub(tournament.adminId),
  ]);
  return { amount, status, canPayOnline: ready };
};

const SLOTS = ["player1Id", "player1PartnerId", "player2Id", "player2PartnerId"];
const idOf = (x) => (x ? String(x._id ?? x) : null);

// Read-only round robin schedule for players (standings are admin-only). Only
// exposes names — no emails/contacts — since any signed-in player can open it.
const PlayerRoundRobinController = {
  getRoundRobinView: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid round robin" });
      }

      const tournament = await RoundRobinTournament.findById(id)
        .select("tournamentName matchType format status startDate endDate registrationDeadline numberOfCourts numberOfSlots numberOfSets setWinningPoint winningPointGap description adminId entryFeeMember entryFeeNonMember")
        .lean();
      if (!tournament) return res.status(404).json({ message: "Round robin not found" });

      const matches = await RoundRobinMatch.find({ tournamentId: id })
          .select("matchName player1Id player1PartnerId player2Id player2PartnerId groupId gradeGroupLabel court slot status sets winner isDraw isBye createdAt")
          .populate("player1Id", "name")
          .populate("player1PartnerId", "name")
          .populate("player2Id", "name")
          .populate("player2PartnerId", "name")
          .populate("groupId", "groupName")
          .sort({ slot: 1, createdAt: 1 })
          .lean();

      // Which of this tournament's player entries belong to the signed-in
      // player (via their linked member record, or their login email).
      const account = await AdminUser.findById(req.userId).select("emailID").lean();
      const email = account?.emailID?.toLowerCase();
      const myMembers = await RoundRobinMember.find({
        adminId: tournament.adminId,
        $or: [{ userId: req.userId }, ...(email ? [{ email }] : [])],
      })
        .select("_id")
        .lean();
      const myPlayers = myMembers.length
        ? await RoundRobinPlayer.find({ tournamentId: id, memberId: { $in: myMembers.map((m) => m._id) } }).select("_id").lean()
        : [];
      const mine = new Set(myPlayers.map((p) => String(p._id)));

      // Players only get their own matches — nobody else's matches are sent.
      const myMatches = matches
        .filter((m) => SLOTS.some((slot) => mine.has(idOf(m[slot]))))
        .map((m) => ({ ...m, isMine: true }));
      const hasSchedule = matches.length > 0;

      // Just back from Stripe? Confirm any open self-join payment now instead of
      // waiting for the webhook; a paid one creates the registration.
      if (myMembers.length && mine.size === 0) {
        const pendingJoins = await RoundRobinPayment.find({
          tournamentId: id,
          memberId: { $in: myMembers.map((m) => m._id) },
          purpose: "self_join",
          $or: [{ status: "PENDING" }, { status: "COMPLETED", playerId: null }],
        });
        for (const p of pendingJoins) {
          try {
            await refreshStripePayment(p);
            if (p.status === "COMPLETED" && p.playerId) mine.add(String(p.playerId));
          } catch (e) {
            console.error("self-join refresh warning:", e?.message || e);
          }
        }
      }

      const join = await getJoinInfo(tournament, req.userId);
      const payment = await getMyPaymentInfo(tournament, [...mine]);

      const { adminId, ...safeTournament } = tournament;
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ tournament: safeTournament, matches: myMatches, isParticipant: mine.size > 0, hasSchedule, join, payment });
    } catch (error) {
      console.error("getRoundRobinView error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

// POST /club/round-robin/:id/join — the signed-in player registers themselves.
PlayerRoundRobinController.joinRoundRobin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid round robin" });
    }
    // Entry fee (by membership type) → pay FIRST. The registration is only
    // created once Stripe confirms payment (finalizeSelfJoin); nobody is added
    // to the round robin without a completed payment.
    const tournament = await RoundRobinTournament.findById(id);
    if (!tournament) return res.status(404).json({ message: "Round robin not found" });
    const { member } = await findMember(tournament.adminId, req.userId);
    const info = await getJoinInfo(tournament.toObject(), req.userId, { member });
    if (!info.canJoin) {
      return res.status(info.reason === "joined" ? 409 : 400).json({ message: info.reasonText, data: info });
    }
    if (info.entryFee > 0) {
      const payment = await createSelfJoinCheckout({ tournament, member });
      return res.status(200).json({
        message: `Pay the A$${info.entryFee.toFixed(2)} entry fee to complete your registration.`,
        data: { ...info, checkoutUrl: payment.checkoutUrl },
      });
    }

    const join = await joinRoundRobin(id, req.userId);
    return res.status(201).json({ message: "You're in! See you on court.", data: join });
  } catch (error) {
    if (error?.status) return res.status(error.status).json({ message: error.message, data: error.info });
    console.error("joinRoundRobin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /club/round-robin/:id/join — the player cancels (before the deadline).
PlayerRoundRobinController.leaveRoundRobin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid round robin" });
    }
    const join = await leaveRoundRobin(id, req.userId);
    const { refundedCents = 0, manualRefundDollars = 0 } = join.refund || {};
    let message = "Your registration has been cancelled.";
    if (refundedCents > 0) {
      message += ` A$${(refundedCents / 100).toFixed(2)} is being refunded to your card (usually 5–10 business days).`;
    }
    if (manualRefundDollars > 0) {
      message += ` Contact the club for your A$${manualRefundDollars.toFixed(2)} refund.`;
    }
    return res.status(200).json({ message, data: join });
  } catch (error) {
    if (error?.status) return res.status(error.status).json({ message: error.message, data: error.info });
    console.error("leaveRoundRobin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = PlayerRoundRobinController;
