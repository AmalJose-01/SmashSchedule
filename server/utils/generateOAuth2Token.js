const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "urn:ietf:wg:oauth:2.0:oob" // redirect URI for desktop apps
);

// Generate a url for consent
const scopes = ["https://www.googleapis.com/auth/gmail.send"];
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // important for refresh token
  scope: scopes,
});

console.log("Visit this URL to authorize the app:");
console.log(authUrl);

// After visiting, you will get a code. Paste it here:
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("Enter the code from Google: ", async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log("Your tokens:");
  console.log(tokens);
  readline.close();
});
module.exports = oauth2Client;