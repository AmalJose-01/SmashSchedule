const mongoose = require("mongoose");

const memberDocumentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    documentType: {
      type: String,
      enum: ["STUDENT_ID", "GOVERNMENT_ID", "VETERAN_PROOF", "OTHER"],
      required: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true }, // Cloud storage URL
    uploadedDate: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    verificationDate: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

const MemberDocument = mongoose.model("MemberDocument", memberDocumentSchema);
module.exports = MemberDocument;
