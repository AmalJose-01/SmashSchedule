const Club = require("../../../../model/club");
const AdminUser = require("../../login-signup/model/adminUser");
const { stripe, clientUrl } = require("./stripeClient");

// Copies the connected account's readiness onto the club record. Called from
// the status endpoint and the `account.updated` webhook.
const syncAccountToClub = async (account) => {
  if (!account?.id) return null;
  return Club.findOneAndUpdate(
    { stripeAccountId: account.id },
    {
      stripeChargesEnabled: !!account.charges_enabled,
      stripePayoutsEnabled: !!account.payouts_enabled,
      stripeDetailsSubmitted: !!account.details_submitted,
    },
    { new: true }
  );
};

const findAdminClub = (adminId) => Club.findOne({ adminId });

const onboardingLink = (accountId) =>
  stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${clientUrl()}/admin/club-profile/payments?onboarding=refresh`,
    return_url: `${clientUrl()}/admin/club-profile/payments?onboarding=return`,
    type: "account_onboarding",
  });

const StripeConnectController = {
  // POST /admin/stripe/connect — create the club's Express account (first time)
  // and return a Stripe-hosted onboarding link where the admin enters the
  // club's details and its BSB + account number.
  connect: async (req, res) => {
    try {
      const club = await findAdminClub(req.userId);
      if (!club) {
        return res.status(404).json({ message: "Set up your club profile before connecting payouts." });
      }

      if (!club.stripeAccountId) {
        const admin = await AdminUser.findById(req.userId).select("emailID").lean();
        const account = await stripe.accounts.create({
          type: "express",
          country: "AU",
          email: club.email || admin?.emailID || undefined,
          business_profile: {
            name: club.name || undefined,
            mcc: "7997", // membership clubs (sports, recreation, athletic)
            product_description: "Badminton club entry fees and memberships via SmashSchedule",
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          settings: { payouts: { schedule: { interval: "daily" } } },
          metadata: { clubId: String(club._id), adminId: String(req.userId) },
        });
        club.stripeAccountId = account.id;
        await club.save();
      }

      const link = await onboardingLink(club.stripeAccountId);
      return res.status(200).json({ data: { url: link.url } });
    } catch (error) {
      console.log("stripe connect error:", error?.message || error);
      return res.status(500).json({ message: "Could not start Stripe payout setup", error: error.message });
    }
  },

  // GET /admin/stripe/status — onboarding state for the admin Payments page.
  getStatus: async (req, res) => {
    try {
      const club = await findAdminClub(req.userId);
      if (!club) return res.status(200).json({ data: { hasClub: false, connected: false } });
      if (!club.stripeAccountId) {
        return res.status(200).json({
          data: { hasClub: true, connected: false, platformFeeBps: club.platformFeeBps },
        });
      }

      const account = await stripe.accounts.retrieve(club.stripeAccountId);
      await syncAccountToClub(account);

      const bank = account.external_accounts?.data?.find((a) => a.object === "bank_account");
      return res.status(200).json({
        data: {
          hasClub: true,
          connected: true,
          chargesEnabled: !!account.charges_enabled,
          payoutsEnabled: !!account.payouts_enabled,
          detailsSubmitted: !!account.details_submitted,
          ready: !!account.charges_enabled && !!account.payouts_enabled,
          currentlyDue: account.requirements?.currently_due || [],
          disabledReason: account.requirements?.disabled_reason || null,
          bank: bank ? { bankName: bank.bank_name, last4: bank.last4, routingNumber: bank.routing_number } : null,
          platformFeeBps: club.platformFeeBps,
        },
      });
    } catch (error) {
      console.log("stripe status error:", error?.message || error);
      return res.status(500).json({ message: "Could not load payout status", error: error.message });
    }
  },

  // GET /admin/stripe/dashboard — one-time login link to the club's Express
  // dashboard (see payouts, change the bank account).
  dashboardLink: async (req, res) => {
    try {
      const club = await findAdminClub(req.userId);
      if (!club?.stripeAccountId) return res.status(400).json({ message: "Payouts are not set up yet." });
      if (!club.stripeDetailsSubmitted) {
        const link = await onboardingLink(club.stripeAccountId);
        return res.status(200).json({ data: { url: link.url, onboarding: true } });
      }
      const login = await stripe.accounts.createLoginLink(club.stripeAccountId);
      return res.status(200).json({ data: { url: login.url } });
    } catch (error) {
      console.log("stripe dashboard link error:", error?.message || error);
      return res.status(500).json({ message: "Could not open the Stripe dashboard", error: error.message });
    }
  },
};

module.exports = { StripeConnectController, syncAccountToClub };
