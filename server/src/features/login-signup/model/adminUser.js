const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminUserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is  required"],
    },
    lastName: {
      type: String,
      // required: [true, "Last name is  required"],
    },
    emailID: {
      type: String,
      required: [true, "EmailID name is  required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // basic email regex
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId; // Required only if not a Google user
        },
        "Password is required",
      ],
      // minlength: [6, "Password must be at least 8 characters long"],
      trim: true,
      validate: {
        validator: function (v) {
          if (!v && this.googleId) return true;

          // Password must have at least one uppercase, one lowercase, one digit, and one special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            v
          );
        },
        message: (props) =>
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
      select: false, // never include by default in queries
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows null for non-Google users
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    accountType: {
      type: String,
      enum: ["user", "admin"],
      default: "admin",
    },
    
    tournamentList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament"
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
     teamList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team"
    },

    // Square Payments (per-admin OAuth connection — multi-tenant)
    // Each admin brings their own Square Developer "app" (Application ID +
    // Secret), entered from the frontend Settings page — NOT a shared
    // platform-level credential in .env. The secret is encrypted at rest.
    squareApplicationId: { type: String, default: null },
    squareApplicationSecretEnc: { type: String, default: null, select: false },
    squareMerchantId: { type: String, default: null },
    squareAccessToken: { type: String, default: null, select: false },
    squareRefreshToken: { type: String, default: null, select: false },
    squareTokenExpiresAt: { type: Date, default: null },
    squareLocationId: { type: String, default: null },
    squareLocationName: { type: String, default: null },
    squareDeviceId: { type: String, default: null },

  },
  { timestamps: true }
);
adminUserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});




adminUserSchema.set("toJSON", {
  virtual: true,

  transform: (doc, ret) => {
    if (ret.password) {
      delete ret.password;
    }
    // Never leak Square tokens/secrets to the client, even if accidentally selected
    delete ret.squareAccessToken;
    delete ret.squareRefreshToken;
    delete ret.squareApplicationSecretEnc;

    return ret;
  },
});

// Compare entered password with stored hash
adminUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

// Export the model
module.exports = AdminUser;

