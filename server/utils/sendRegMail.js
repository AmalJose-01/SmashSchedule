const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send registration email
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML email content
 */
const sendRegMail = async ({ to, subject, html }) => {
  try {
    // Safety check
    if (!to || typeof to !== "string") {
      console.warn("⚠️ Invalid email skipped:", to);
      return;
    }

    console.log("📨 To:", to);
    console.log("📨 Subject:", subject);

    const info = await resend.emails.send({
      // Use this until your domain is verified in Resend
      from: "Ballarat Masters Badminton Club <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info);
    return info;
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
};

module.exports = sendRegMail;
