// Create / update the master admin account for THIS environment's database.
//
//   cd server
//   MASTER_EMAIL=you@example.com MASTER_PASSWORD='Str0ng!Passw0rd' node scripts/createMaster.js
//
// Run it once per environment (dev, qa, prod) with the same credentials so one
// login works across the console. The password must satisfy the AdminUser rule
// (8+ chars, upper, lower, digit and one of @$!%*?&). Master accounts can never
// be created through signup — this script is the only way.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const AdminUser = require("../src/features/login-signup/model/adminUser");

(async () => {
  const email = (process.env.MASTER_EMAIL || "").trim().toLowerCase();
  const password = process.env.MASTER_PASSWORD || "";
  if (!email || !password) {
    console.error("Set MASTER_EMAIL and MASTER_PASSWORD (env vars) before running.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const host = mongoose.connection.host;
  try {
    let user = await AdminUser.findOne({ emailID: email }).select("+password");
    if (user && user.accountType !== "master") {
      console.error(`${email} already exists as a "${user.accountType}" account. Use a different email.`);
      process.exit(1);
    }
    if (!user) {
      user = new AdminUser({ firstName: "Master", lastName: "Admin", emailID: email, accountType: "master" });
    }
    user.password = password; // hashed by the model's pre-save hook
    user.isVerified = true;
    await user.save();
    console.log(`Master account ready: ${email}  (database host: ${host})`);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
