// Usage (from /server):  node utils/testEmail.js you@example.com
// Sends one test email through the SMTP settings in .env and prints the real
// error if it fails (sendEmail.js swallows errors on purpose).
require("dotenv").config();
const nodemailer = require("nodemailer");

(async () => {
  const to = process.argv[2];
  if (!to) return console.log("Usage: node utils/testEmail.js you@example.com");
  const port = Number(process.env.SMTP_PORT) || 465;
  console.log(`Connecting to ${process.env.SMTP_HOST}:${port} as ${process.env.SMTP_USER} (password ${process.env.SMTP_PASS ? "set" : "EMPTY"})`);
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    await t.verify();
    console.log("✅ Login OK");
    const info = await t.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "Rallix"}" <${process.env.SMTP_USER}>`,
      to,
      subject: "Rallix test email",
      html: "<p>SMTP is working.</p>",
    });
    console.log("✅ Sent:", info.messageId, info.response);
  } catch (e) {
    console.log("❌ Failed:", e.code, "-", e.message);
  }
})();
