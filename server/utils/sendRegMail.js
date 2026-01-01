const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {object} club { contactName, contactEmail }
 */
const sendRegMail = async (to, subject, html, club) => {
  try {
    const fromAddress = club
      ? `"${club.contactName}" <${club.contactEmail}>`
      : `"Tournament System" <${process.env.EMAIL_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      replyTo: club?.contactEmail, // replies go to club
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
};

module.exports = sendRegMail;
