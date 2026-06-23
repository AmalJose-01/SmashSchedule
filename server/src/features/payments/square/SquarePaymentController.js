const { randomUUID } = require("crypto");
const mongoose = require("mongoose");
const AdminUser = require("../../login-signup/model/adminUser");
const RoundRobinTournament = require("../../round-robin/models/RoundRobinTournament");
const RoundRobinPlayer = require("../../round-robin/models/RoundRobinPlayer");
const RoundRobinPayment = require("../../round-robin/models/RoundRobinPayment");
const { getClientForAdmin } = require("./squareClient");

const requireConnectedAdmin = async (adminId) => {
  const admin = await AdminUser.findById(adminId).select("+squareAccessToken +squareRefreshToken");
  if (!admin || !admin.squareAccessToken) {
    return { admin: null, error: "Square is not connected for this account yet." };
  }
  return { admin, error: null };
};

const SquarePaymentController = {
  // GET /admin/square/locations — list this admin's own Square business locations
  listLocations: async (req, res) => {
    try {
      const { admin, error } = await requireConnectedAdmin(req.userId);
      if (error) return res.status(400).json({ message: error });

      const client = getClientForAdmin(admin.squareAccessToken);
      // square SDK v37+ returns `{ data, rawResponse }`, not `{ locations }` directly.
      const { locations } = (await client.locations.list()).data;

      const devicesByLocation = {};
      for (const loc of locations || []) {
        try {
          const page = await client.devices.list({ locationId: loc.id });
          devicesByLocation[loc.id] = (page?.data || page?.items || []).map((d) => ({
            id: d.id,
            name: d.attributes?.name || d.id,
            type: d.attributes?.type,
            status: d.status,
          }));
        } catch {
          devicesByLocation[loc.id] = [];
        }
      }

      return res.status(200).json({
        data: (locations || []).map((loc) => ({
          id: loc.id,
          name: loc.name,
          status: loc.status,
          devices: devicesByLocation[loc.id] || [],
        })),
      });
    } catch (error) {
      console.log("listLocations error:", error?.message || error);
      return res.status(500).json({ message: "Failed to fetch Square locations", error: error.message });
    }
  },

  // POST /admin/square/device-code — create a pairing code for a Square Terminal.
  // The admin types this code into the physical Terminal device; once paired,
  // Square assigns it a deviceId which we pick up via getDeviceCodeStatus.
  createDeviceCode: async (req, res) => {
    try {
      const { admin, error } = await requireConnectedAdmin(req.userId);
      if (error) return res.status(400).json({ message: error });

      const { locationId, name } = req.body;
      if (!locationId) {
        return res.status(400).json({ message: "locationId is required" });
      }

      const client = getClientForAdmin(admin.squareAccessToken);
      const { data } = await client.devices.codes.create({
        idempotencyKey: randomUUID(),
        deviceCode: {
          name: name || `Terminal ${new Date().toISOString().slice(0, 10)}`,
          productType: "TERMINAL_API",
          locationId,
        },
      });

      const deviceCode = data.deviceCode;
      return res.status(201).json({
        data: {
          id: deviceCode.id,
          code: deviceCode.code,
          status: deviceCode.status,
          pairBy: deviceCode.pairBy,
        },
      });
    } catch (error) {
      console.log("createDeviceCode error:", error?.message || error);
      return res.status(500).json({ message: "Failed to create device pairing code", error: error.message });
    }
  },

  // GET /admin/square/device-code/:id — poll pairing status; once status is
  // PAIRED, the response includes the new deviceId so the frontend can save it.
  getDeviceCodeStatus: async (req, res) => {
    try {
      const { admin, error } = await requireConnectedAdmin(req.userId);
      if (error) return res.status(400).json({ message: error });

      const client = getClientForAdmin(admin.squareAccessToken);
      const { data } = await client.devices.codes.get({ id: req.params.id });
      const deviceCode = data.deviceCode;

      return res.status(200).json({
        data: {
          id: deviceCode.id,
          status: deviceCode.status,
          deviceId: deviceCode.deviceId || null,
        },
      });
    } catch (error) {
      console.log("getDeviceCodeStatus error:", error?.message || error);
      return res.status(500).json({ message: "Failed to check pairing status", error: error.message });
    }
  },

  // POST /admin/square/settings — save chosen locationId/deviceId for the logged-in admin
  saveSquareSettings: async (req, res) => {
    try {
      const { locationId, locationName, deviceId } = req.body;
      if (!locationId) {
        return res.status(400).json({ message: "locationId is required" });
      }

      const admin = await AdminUser.findByIdAndUpdate(
        req.userId,
        { squareLocationId: locationId, squareLocationName: locationName || null, squareDeviceId: deviceId || null },
        { new: true }
      );

      return res.status(200).json({
        message: "Square settings saved",
        data: {
          locationId: admin.squareLocationId,
          locationName: admin.squareLocationName,
          deviceId: admin.squareDeviceId,
        },
      });
    } catch (error) {
      console.log("saveSquareSettings error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // POST /round-robin/tournaments/:tournamentId/players/:playerId/collect-payment
  // Triggers an automatic checkout popup on the admin's paired Square Terminal
  // for the tournament's preset entry fee.
  collectPayment: async (req, res) => {
    try {
      const { tournamentId, playerId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(playerId)) {
        return res.status(400).json({ message: "Invalid tournament or player id" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: tournamentId, adminId: req.userId });
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });

      const player = await RoundRobinPlayer.findOne({ _id: playerId, tournamentId });
      if (!player) return res.status(404).json({ message: "Player not found in this tournament" });

      const entryFee = tournament.entryFee || 0;
      if (entryFee <= 0) {
        return res.status(400).json({ message: "This tournament has no entry fee configured." });
      }

      const { admin, error } = await requireConnectedAdmin(req.userId);
      if (error) return res.status(400).json({ message: error });

      if (!admin.squareLocationId || !admin.squareDeviceId) {
        return res.status(400).json({
          message: "Connect Square and choose a Location + Terminal Device in Settings before collecting payments.",
        });
      }

      const client = getClientForAdmin(admin.squareAccessToken);
      const amountCents = Math.round(entryFee * 100);

      const { data: checkoutData } = await client.terminal.checkouts.create({
        idempotencyKey: randomUUID(),
        checkout: {
          amountMoney: { amount: BigInt(amountCents), currency: "AUD" },
          referenceId: `${tournament._id}:${player._id}`,
          note: `Entry fee — ${tournament.tournamentName} (${player.name})`,
          deviceOptions: { deviceId: admin.squareDeviceId },
          locationId: admin.squareLocationId,
        },
      });
      const { checkout } = checkoutData;

      const payment = await RoundRobinPayment.create({
        tournamentId: tournament._id,
        adminId: req.userId,
        playerId: player._id,
        playerName: player.name,
        amount: entryFee,
        currency: "AUD",
        status: checkout.status || "PENDING",
        squareCheckoutId: checkout.id,
        squareDeviceId: admin.squareDeviceId,
        squareLocationId: admin.squareLocationId,
      });

      return res.status(201).json({
        message: "Checkout sent to Terminal",
        data: { paymentId: payment._id, status: payment.status, squareCheckoutId: payment.squareCheckoutId },
      });
    } catch (error) {
      console.log("collectPayment error:", error?.message || error);
      return res.status(500).json({ message: "Failed to start Terminal checkout", error: error.message });
    }
  },

  // GET /round-robin/tournaments/:tournamentId/payments — latest payment per player for this tournament,
  // so the Players table can show the correct status (Paid / Waiting / Collect) for each player on load.
  getTournamentPayments: async (req, res) => {
    try {
      const { tournamentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament id" });
      }

      const tournament = await RoundRobinTournament.findOne({ _id: tournamentId, adminId: req.userId });
      if (!tournament) return res.status(404).json({ message: "Tournament not found" });

      const payments = await RoundRobinPayment.find({ tournamentId, adminId: req.userId }).sort({ createdAt: -1 });

      // Keep only the most recent payment per player
      const latestByPlayer = {};
      for (const payment of payments) {
        const key = payment.playerId.toString();
        if (!latestByPlayer[key]) latestByPlayer[key] = payment;
      }

      return res.status(200).json({ data: Object.values(latestByPlayer) });
    } catch (error) {
      console.log("getTournamentPayments error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // GET /round-robin/payments/:paymentId/status — poll while the Terminal checkout is in progress
  getPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).json({ message: "Invalid payment id" });
      }

      const payment = await RoundRobinPayment.findOne({ _id: paymentId, adminId: req.userId });
      if (!payment) return res.status(404).json({ message: "Payment not found" });

      // Best-effort live refresh from Square in case the webhook hasn't arrived yet
      if (["PENDING", "IN_PROGRESS"].includes(payment.status)) {
        try {
          const { admin } = await requireConnectedAdmin(req.userId);
          if (admin) {
            const client = getClientForAdmin(admin.squareAccessToken);
            const { checkout } = (await client.terminal.checkouts.get({ checkoutId: payment.squareCheckoutId })).data;
            if (checkout?.status && checkout.status !== payment.status) {
              payment.status = checkout.status;
              if (checkout.paymentIds?.[0]) payment.squarePaymentId = checkout.paymentIds[0];
              await payment.save();
            }
          }
        } catch (pollErr) {
          console.log("getPaymentStatus poll warning:", pollErr?.message || pollErr);
        }
      }

      return res.status(200).json({ data: payment });
    } catch (error) {
      console.log("getPaymentStatus error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = SquarePaymentController;
