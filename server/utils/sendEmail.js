const nodemailer = require("nodemailer");

// SMTP (cPanel mailbox) settings come from .env:
//   SMTP_HOST=mail.rallix.com.au
//   SMTP_PORT=465
//   SMTP_USER=noreply@rallix.com.au
//   SMTP_PASS=<the mailbox password>
//   MAIL_FROM_NAME=Rallix            (optional)
let transporter;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = implicit SSL/TLS
      // One shared connection, one email at a time: cPanel mail servers often
      // drop extra simultaneous connections (shows up as a TLS "wrong version" error).
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  if (!to || typeof to !== "string") {
    console.warn("⚠️ Invalid email skipped:", to);
    return;
  }

  // Retry a couple of times: a flaky connection to the mail server (for
  // example when mail.rallix.com.au resolves to more than one IP and one of
  // them isn't the mail server) usually succeeds on the next attempt.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const info = await getTransporter().sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Rallix"}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      console.log("📧 Email sent:", info.messageId, "→", to);
      return;
    } catch (err) {
      // DO NOT throw — prevents 500 / timeout
      console.error(
        `❌ Email failed (attempt ${attempt}/${MAX_ATTEMPTS}) to ${to}:`,
        err.code || "",
        err.address ? `[server IP ${err.address}:${err.port}]` : "",
        err.message
      );
      if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 1500));
    }
  }
};

module.exports = sendEmail;
