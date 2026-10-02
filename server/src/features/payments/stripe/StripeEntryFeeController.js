const mongoose = require("mongoose");
const RoundRobinTournament = require("../../round-robin/models/RoundRobinTournament");
const RoundRobinPlayer = require("../../round-robin/models/RoundRobinPlayer");
const RoundRobinPayment = require("../../round-robin/models/RoundRobinPayment");
const { findMember } = require("../../round-robin/services/playerJoinService");
const SquarePaymentController = require("../square/SquarePaymentController");
const { createEntryFeeCheckout, refreshStripePayment, refundEntryFee } = require("./entryFeeCheckoutService");

const valid = (...ids) => ids.every((id) => mongoose.Types.ObjectId.isValid(id));

const sendError = (res, error, fallback) => {
  if (error?.status) return res.status(error.status).json({ message: error.message });
  console.log(`${fallback}:`, error?.message || error);
  return res.status(500).json({ message: fallback, error: error?.message });
};

const paymentView = (p) => ({
  _id: p._id,
  paymentId: p._id,
  playerId: p.playerId,
  provider: p.provider,
  status: p.status,
  amount: p.amount,
  checkoutUrl: p.status === "PENDING" ? p.checkoutUrl : undefined,
  platformFeeCents: p.platformFeeCents,
  clubNetCents: p.clubNetCents,
  refundedCents: p.refundedCents,
  paidAt: p.paidAt,
  createdAt: p.createdAt,
});

const StripeEntryFeeController = {
  // POST /admin/round-robin/tournaments/:tournamentId/players/:playerId/collect-payment
  // Admin starts a card payment; the UI shows the link as a QR for the player to scan.
  collectPayment: async (req, res) => {
    try {
      const { tournamentId, playerId } = req.params;
      if (!valid(tournamentId, playerId)) return res.status(400).json({ message: "Invalid tournament or player id" });

      const tournament = await RoundRobinTournament.findOne({ _id: tournamentId, adminId: req.userId });
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });
      const player = await RoundRobinPlayer.findOne({ _id: playerId, tournamentId });
      if (!player) return res.status(404).json({ message: "Player not found in this tournament" });

      const payment = await createEntryFeeCheckout({ tournament, player, initiatedBy: "admin" });
      return res.status(201).json({ message: "Payment link ready", data: paymentView(payment) });
    } catch (error) {
      return sendError(res, error, "Failed to start card payment");
    }
  },

  // GET /admin/round-robin/payments/:paymentId/status — polled by the Players table.
  getPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      if (!valid(paymentId)) return res.status(400).json({ message: "Invalid payment id" });
      const payment = await RoundRobinPayment.findOne({ _id: paymentId, adminId: req.userId });
      if (!payment) return res.status(404).json({ message: "Payment not found" });

      // Legacy Square Terminal records keep their own status logic.
      if (payment.provider !== "stripe") return SquarePaymentController.getPaymentStatus(req, res);

      try {
        await refreshStripePayment(payment);
      } catch (pollErr) {
        console.log("stripe status poll warning:", pollErr?.message || pollErr);
      }
      return res.status(200).json({ data: paymentView(payment) });
    } catch (error) {
      return sendError(res, error, "Failed to load payment status");
    }
  },

  // POST /admin/round-robin/payments/:paymentId/refund
  refundPayment: async (req, res) => {
    try {
      const { paymentId } = req.params;
      if (!valid(paymentId)) return res.status(400).json({ message: "Invalid payment id" });
      const payment = await RoundRobinPayment.findOne({ _id: paymentId, adminId: req.userId });
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      await refundEntryFee(payment);
      return res.status(200).json({ message: "Refund issued", data: paymentView(payment) });
    } catch (error) {
      return sendError(res, error, "Refund failed");
    }
  },

  // POST /club/round-robin/:id/pay — signed-in player pays their own entry fee.
  payAsPlayer: async (req, res) => {
    try {
      const { id } = req.params;
      if (!valid(id)) return res.status(400).json({ message: "Invalid round robin" });
      const tournament = await RoundRobinTournament.findById(id);
      if (!tournament) return res.status(404).json({ message: "Round robin not found" });

      const { member } = await findMember(tournament.adminId, req.userId);
      const player = member ? await RoundRobinPlayer.findOne({ tournamentId: id, memberId: member._id }) : null;
      if (!player) return res.status(403).json({ message: "Join this round robin before paying the entry fee." });

      const payment = await createEntryFeeCheckout({ tournament, player, initiatedBy: "player" });
      return res.status(201).json({ data: { checkoutUrl: payment.checkoutUrl, status: payment.status } });
    } catch (error) {
      return sendError(res, error, "Failed to start payment");
    }
  },
};

module.exports = StripeEntryFeeController;
