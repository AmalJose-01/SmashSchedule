const { SquareClient, SquareEnvironment } = require("square");

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const environment = isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

// Temporary startup diagnostic — remove once the env var mismatch is confirmed fixed.
console.log(
  `[Square] SQUARE_ENVIRONMENT raw value = ${JSON.stringify(
    process.env.SQUARE_ENVIRONMENT
  )} -> isProduction = ${isProduction}`
);

// Unauthenticated client — used only for the app-level OAuth token exchange
// (authorization code / refresh token grants use the app's own client id/secret,
// not a merchant access token).
const oauthClient = new SquareClient({ environment });

// Per-admin client, authenticated with that specific admin's own Square access token.
// Never share one access token across admins — each admin connects their own
// Square business account via OAuth.
const getClientForAdmin = (accessToken) =>
  new SquareClient({ token: accessToken, environment });

module.exports = {
  environment,
  isProduction,
  oauthClient,
  getClientForAdmin,
};
