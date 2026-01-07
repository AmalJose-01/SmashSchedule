const express = require("express");
const router = express.Router();
const sendEmail = require("../utils/sendEmail");

router.get("/test", async (req, res) => {
  try {
    await sendEmail({
      to: "amaljvv@gmail.com", // your email
      subject: "✅ Render Email Test",
      html: "<h2>Render email is working 🎉</h2>",
    });

    res.json({ success: true, message: "Test email sent" });
  } catch (err) {
    console.error("Mail test error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
