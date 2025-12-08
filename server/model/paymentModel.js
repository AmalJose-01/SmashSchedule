import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  amount: Number,
  currency: String,
  status: {
    type: String,
    enum: ["pending", "succeeded", "failed"],
    default: "pending",
  },
  paymentIntentId: String,
  userEmail: String,
  metadata: {},
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
