const jwt = require("jsonwebtoken");
const AdminUser = require("../../login-signup/model/adminUser");
const { oauthClient, isProduction } = require("./squareClient");
const { encrypt, decrypt, maskSecret } = require("../../../utils/cryptoUtil");

const AUTHORIZE_BASE = isProduction
  ? "https://connect.squareup.com/oauth2/authorize"
  : "https://connect.squareupsandbox.com/oauth2/authorize";

// Scopes needed to: read merchant/location info, read paired Terminal devices,
// and create/manage Terminal checkouts for the entry-fee payments.
const SCOPES = [
  "MERCHANT_PROFILE_READ",
  "PAYMENTS_WRITE",
  "PAYMENTS_READ",
  "DEVICE_CREDENTIAL_MANAGEMENT",
].join(" ");

const SquareOAuthController = {
  // POST /admin/square/credentials — admin enters their OWN Square Developer
  // app's Application ID + Secret (multi-tenant: each admin has a different
  // Square account/app, so this can't live in a single shared .env). The
  // secret is encrypted before it's stored and is never echoed back.
  saveCredentials: async (req, res) => {
    try {
      const applicationId = req.body.applicationId?.trim();
      const applicationSecret = req.body.applicationSecret?.trim();

      if (!applicationId || !applicationSecret) {
        return res.status(400).json({ message: "Application ID and Application Secret are required" });
      }

      // Square's Application ID prefix tells you which environment it belongs
      // to: "sandbox-sq0idb-..." for Sandbox, "sq0idp-..." for Production.
      // Using the wrong one against this server's configured environment is
      // a common mistake and Square rejects it with an opaque 400 — catch it
      // here with a clear message instead.
      const looksSandbox = applicationId.startsWith("sandbox-sq0idb-");
      const looksProduction = applicationId.startsWith("sq0idp-");

      if (isProduction && looksSandbox) {
        return res.status(400).json({
          message:
            "This looks like a Sandbox Application ID (sandbox-sq0idb-...), but this server is configured for Square Production. Use your Production Application ID instead.",
        });
      }
      if (!isProduction && looksProduction) {
        return res.status(400).json({
          message:
            "This looks like a Production Application ID (sq0idp-...), but this server is configured for Square Sandbox. Use your Sandbox Application ID instead (it starts with sandbox-sq0idb-).",
        });
      }

      await AdminUser.findByIdAndUpdate(req.userId, {
        squareApplicationId: applicationId,
        squareApplicationSecretEnc: encrypt(applicationSecret),
      });

      return res.status(200).json({
        message: "Square credentials saved",
        data: {
          maskedApplicationId: maskSecret(applicationId),
          maskedSecret: maskSecret(applicationSecret),
        },
      });
    } catch (error) {
      console.log("saveCredentials error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // GET /admin/square/connect — redirects the logged-in admin to Square's consent screen
  connectSquare: async (req, res) => {
    try {
      const admin = await AdminUser.findById(req.userId);
      if (!admin?.squareApplicationId) {
        return res.status(400).json({
          message: "Add your Square Application ID and Secret first, then connect your account.",
        });
      }

      // Encode + sign the adminId as state so the callback can attribute the
      // tokens to the right admin without relying on a client-side session.
      const state = jwt.sign({ adminId: req.userId.toString() }, process.env.SECURITY_KEY_JWT, {
        expiresIn: "15m",
      });

      const params = new URLSearchParams({
        client_id: admin.squareApplicationId,
        scope: SCOPES,
        session: "false",
        state,
        redirect_uri: process.env.SQUARE_OAUTH_REDIRECT_URI,
      });

      return res.status(200).json({ url: `${AUTHORIZE_BASE}?${params.toString()}` });
    } catch (error) {
      console.log("connectSquare error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // GET /admin/square/callback — Square redirects here with ?code=&state=
  squareCallback: async (req, res) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    try {
      const { code, state, error: squareError } = req.query;

      if (squareError) {
        return res.redirect(`${clientUrl}/admin/square-settings?square_error=${encodeURIComponent(squareError)}`);
      }
      if (!code || !state) {
        return res.redirect(`${clientUrl}/admin/square-settings?square_error=missing_code`);
      }

      let adminId;
      try {
        const decoded = jwt.verify(state, process.env.SECURITY_KEY_JWT);
        adminId = decoded.adminId;
      } catch {
        return res.redirect(`${clientUrl}/admin/square-settings?square_error=invalid_state`);
      }

      const admin = await AdminUser.findById(adminId).select("+squareApplicationSecretEnc");
      if (!admin?.squareApplicationId || !admin?.squareApplicationSecretEnc) {
        return res.redirect(`${clientUrl}/admin/square-settings?square_error=missing_credentials`);
      }

      const clientSecret = decrypt(admin.squareApplicationSecretEnc);

      const { body: tokenResponse } = await oauthClient.oAuth.obtainToken({
        clientId: admin.squareApplicationId,
        clientSecret,
        code,
        grantType: "authorization_code",
      });

      const { accessToken, refreshToken, merchantId, expiresAt } = tokenResponse;

      await AdminUser.findByIdAndUpdate(adminId, {
        squareAccessToken: accessToken,
        squareRefreshToken: refreshToken,
        squareMerchantId: merchantId,
        squareTokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      return res.redirect(`${clientUrl}/admin/square-settings?square_connected=1`);
    } catch (error) {
      console.log("squareCallback error:", error);
      return res.redirect(`${clientUrl}/admin/square-settings?square_error=server_error`);
    }
  },

  // GET /admin/square/status — connection status for the logged-in admin (no secrets returned)
  getSquareStatus: async (req, res) => {
    try {
      const admin = await AdminUser.findById(req.userId).select("+squareApplicationSecretEnc");
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      return res.status(200).json({
        data: {
          hasCredentials: !!(admin.squareApplicationId && admin.squareApplicationSecretEnc),
          // Never return the full Application ID once saved — only a masked
          // preview. Updating credentials always requires re-entering both
          // fields in full, the same as the secret.
          maskedApplicationId: admin.squareApplicationId ? maskSecret(admin.squareApplicationId) : null,
          connected: !!admin.squareMerchantId,
          merchantId: admin.squareMerchantId || null,
          locationId: admin.squareLocationId || null,
          locationName: admin.squareLocationName || null,
          deviceId: admin.squareDeviceId || null,
          tokenExpiresAt: admin.squareTokenExpiresAt || null,
        },
      });
    } catch (error) {
      console.log("getSquareStatus error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // POST /admin/square/disconnect
  disconnectSquare: async (req, res) => {
    try {
      const admin = await AdminUser.findById(req.userId).select(
        "+squareAccessToken +squareApplicationSecretEnc"
      );

      if (admin?.squareAccessToken && admin?.squareApplicationId && admin?.squareApplicationSecretEnc) {
        try {
          const clientSecret = decrypt(admin.squareApplicationSecretEnc);
          await oauthClient.oAuth.revokeToken(
            {
              clientId: admin.squareApplicationId,
              accessToken: admin.squareAccessToken,
            },
            {
              headers: { Authorization: `Client ${clientSecret}` },
            }
          );
        } catch (revokeErr) {
          // Even if Square-side revoke fails (e.g. token already invalid), still clear local state
          console.log("Square revokeToken warning:", revokeErr?.message || revokeErr);
        }
      }

      await AdminUser.findByIdAndUpdate(req.userId, {
        squareAccessToken: null,
        squareRefreshToken: null,
        squareMerchantId: null,
        squareTokenExpiresAt: null,
        squareLocationId: null,
        squareLocationName: null,
        squareDeviceId: null,
      });

      return res.status(200).json({ message: "Square disconnected" });
    } catch (error) {
      console.log("disconnectSquare error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },
};

module.exports = SquareOAuthController;
