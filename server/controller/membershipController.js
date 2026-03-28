const Member = require("../model/member");
const Membership = require("../model/membership");
const MemberDocument = require("../model/memberDocument");
const MembershipType = require("../model/membershipType");
const AdminUser = require("../model/adminUser");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryHelper");

const membershipController = {
  // ========== MEMBER REGISTRATION ==========
  registerMember: async (req, res) => {
    try {
      const {
        userId,
        firstName,
        lastName,
        email,
        phoneNumber,
        age,
        dateOfBirth,
        address,
        membershipType,
      } = req.body;

      // Validate required fields
      if (!userId || !firstName || !lastName || !email || !phoneNumber) {
        console.log("Missing required fields:", { userId, firstName, lastName, email, phoneNumber });
        return res.status(400).json({ 
          message: "Missing required fields: userId, firstName, lastName, email, phoneNumber are required",
          received: { userId, firstName, lastName, email, phoneNumber }
        });
      }

      // Check if member already exists
      const existingMember = await Member.findOne({ email });
      if (existingMember) {
        return res.status(400).json({ message: "Member already exists with this email" });
      }

      // Get membership type configuration
      const membershipConfig = await MembershipType.findOne({ name: membershipType });
      if (!membershipConfig) {
        return res.status(400).json({ message: "Invalid membership type" });
      }

      // Calculate expiry date
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(expiryDate.getMonth() + membershipConfig.validityMonths);

      // Create member profile
      const member = await Member.create({
        userId,
        firstName,
        lastName,
        email,
        phoneNumber,
        age,
        dateOfBirth: dateOfBirth || null,
        address,
        membershipType,
        membershipExpiryDate: expiryDate,
        membershipStatus: membershipConfig.requiresDocumentVerification
          ? "PENDING_VERIFICATION"
          : "ACTIVE",
        isVerified: !membershipConfig.requiresDocumentVerification,
      });

      // Create membership record
      const membership = await Membership.create({
        memberId: member._id,
        membershipType,
        status: membershipConfig.requiresDocumentVerification
          ? "PENDING_VERIFICATION"
          : "ACTIVE",
        startDate,
        expiryDate,
        membershipPrice: membershipConfig.price,
        discountApplied: membershipConfig.discountPercentage,
      });

      return res.status(201).json({
        message: "Member registered successfully",
        member,
        membership,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  },

  // ========== UPLOAD VERIFICATION DOCUMENT ==========
  uploadVerificationDocument: async (req, res) => {
    try {
      const { memberId, documentType } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file size (5MB max)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "File size must be less than 5MB" });
      }

      // Validate file type
      const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Invalid file type. Only PDF, JPG, PNG are allowed",
        });
      }

      // Check if member exists
      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Delete old document from Cloudinary and database if exists
      if (member.verificationDocumentId) {
        const oldDoc = await MemberDocument.findById(member.verificationDocumentId);
        if (oldDoc && oldDoc.cloudinaryPublicId) {
          await deleteFromCloudinary(oldDoc.cloudinaryPublicId);
        }
        await MemberDocument.deleteOne({ _id: member.verificationDocumentId });
      }

      // Upload file to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        'membership-verification-documents'
      );

      // Create document record with Cloudinary URL
      const document = await MemberDocument.create({
        memberId,
        documentType,
        fileName: req.file.originalname,
        fileUrl: cloudinaryResult.url,
        cloudinaryPublicId: cloudinaryResult.cloudinaryId,
        verificationStatus: "PENDING",
      });

      // Update member with new document ID
      member.verificationDocumentId = document._id;
      member.membershipStatus = "PENDING_VERIFICATION";
      await member.save();

      return res.status(201).json({
        message: "Document uploaded successfully",
        document,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  },

  // ========== GET MEMBER PROFILE ==========
  getMemberProfile: async (req, res) => {
    try {
      const { memberId } = req.params;

      const member = await Member.findById(memberId)
        .populate("verificationDocumentId")
        .lean();

      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const membership = await Membership.findOne({ memberId }).lean();

      return res.status(200).json({
        member,
        membership,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== UPDATE MEMBER PROFILE ==========
  updateMemberProfile: async (req, res) => {
    try {
      const { memberId } = req.params;
      const { phoneNumber, address, profilePhoto } = req.body;

      const member = await Member.findByIdAndUpdate(
        memberId,
        { phoneNumber, address, profilePhoto },
        { new: true }
      );

      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      return res.status(200).json({
        message: "Profile updated successfully",
        member,
      });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== RENEW MEMBERSHIP ==========
  renewMembership: async (req, res) => {
    try {
      const { memberId } = req.params;

      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Get membership type configuration
      const membershipConfig = await MembershipType.findOne({
        name: member.membershipType,
      });

      // Calculate new expiry date
      const newExpiryDate = new Date(member.membershipExpiryDate);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + membershipConfig.validityMonths);

      // Update member
      member.membershipExpiryDate = newExpiryDate;
      member.membershipStatus = "ACTIVE";
      member.isVerified = true;
      await member.save();

      // Create new membership record
      const membership = await Membership.create({
        memberId,
        membershipType: member.membershipType,
        status: "ACTIVE",
        startDate: new Date(),
        expiryDate: newExpiryDate,
        membershipPrice: membershipConfig.price,
        discountApplied: membershipConfig.discountPercentage,
        renewalDate: new Date(),
      });

      return res.status(200).json({
        message: "Membership renewed successfully",
        member,
        membership,
      });
    } catch (error) {
      console.error("Renewal error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GET MEMBERSHIP HISTORY ==========
  getMembershipHistory: async (req, res) => {
    try {
      const { memberId } = req.params;

      const history = await Membership.find({ memberId }).sort({ createdAt: -1 });

      if (history.length === 0) {
        return res.status(404).json({ message: "No membership history found" });
      }

      return res.status(200).json({
        message: "Membership history retrieved",
        history,
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: GET ALL MEMBERS ==========
  getAllMembers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;

      const query = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }

      if (status) {
        query.membershipStatus = status;
      }

      const skip = (page - 1) * limit;

      const members = await Member.find(query)
        .populate("verificationDocumentId")
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Member.countDocuments(query);

      return res.status(200).json({
        message: "Members retrieved successfully",
        members,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching members:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: VERIFY DOCUMENT ==========
  verifyDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const { status, rejectionReason } = req.body;
      const adminId = req.userId; // From auth middleware

      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const document = await MemberDocument.findByIdAndUpdate(
        documentId,
        {
          verificationStatus: status,
          verifiedBy: adminId,
          verificationDate: new Date(),
          rejectionReason: status === "REJECTED" ? rejectionReason : null,
        },
        { new: true }
      );

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Update member status based on verification
      if (status === "APPROVED") {
        await Member.findByIdAndUpdate(
          document.memberId,
          { membershipStatus: "ACTIVE", isVerified: true },
          { new: true }
        );

        // Update membership status
        await Membership.findOneAndUpdate(
          { memberId: document.memberId },
          { status: "ACTIVE", approvedBy: adminId, approvalDate: new Date() }
        );
      } else if (status === "REJECTED") {
        await Member.findByIdAndUpdate(
          document.memberId,
          { membershipStatus: "PENDING_VERIFICATION" }
        );
      }

      return res.status(200).json({
        message: `Document ${status.toLowerCase()} successfully`,
        document,
      });
    } catch (error) {
      console.error("Verification error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: GET PENDING VERIFICATIONS ==========
  getPendingVerifications: async (req, res) => {
    try {
      const documents = await MemberDocument.find({
        verificationStatus: "PENDING",
      })
        .populate("memberId", "firstName lastName email phoneNumber")
        .sort({ uploadedDate: 1 })
        .lean();

      return res.status(200).json({
        message: "Pending documents retrieved",
        documents,
      });
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GET MEMBERSHIP TYPES ==========
  getMembershipTypes: async (req, res) => {
    try {
      const types = await MembershipType.find({ isActive: true }).lean();

      return res.status(200).json({
        message: "Membership types retrieved",
        types,
      });
    } catch (error) {
      console.error("Error fetching membership types:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GET EXPIRED MEMBERSHIPS (For Admin Renewal Reminders) ==========
  getExpiringMemberships: async (req, res) => {
    try {
      const daysBeforeExpiry = 30; // Notify 30 days before expiry
      const today = new Date();
      const expiryThreshold = new Date(today);
      expiryThreshold.setDate(expiryThreshold.getDate() + daysBeforeExpiry);

      const expiringMembers = await Member.find({
        membershipExpiryDate: {
          $gte: today,
          $lte: expiryThreshold,
        },
        membershipStatus: "ACTIVE",
      })
        .select("firstName lastName email phoneNumber membershipExpiryDate")
        .lean();

      return res.status(200).json({
        message: "Expiring memberships retrieved",
        count: expiringMembers.length,
        members: expiringMembers,
      });
    } catch (error) {
      console.error("Error fetching expiring memberships:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== AUTO EXPIRE MEMBERSHIPS (Cron Job) ==========
  autoExpireMembers: async (req, res) => {
    try {
      const today = new Date();

      const result = await Member.updateMany(
        {
          membershipExpiryDate: { $lt: today },
          membershipStatus: "ACTIVE",
        },
        {
          membershipStatus: "EXPIRED",
        }
      );

      await Membership.updateMany(
        {
          expiryDate: { $lt: today },
          status: "ACTIVE",
        },
        {
          status: "EXPIRED",
        }
      );

      return res.status(200).json({
        message: "Auto expiry completed",
        updatedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Auto expiry error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GET MEMBERSHIP STATISTICS (Admin Dashboard) ==========
  getMembershipStats: async (req, res) => {
    try {
      const stats = {
        totalMembers: await Member.countDocuments(),
        activeMembers: await Member.countDocuments({ membershipStatus: "ACTIVE" }),
        pendingVerification: await Member.countDocuments({
          membershipStatus: "PENDING_VERIFICATION",
        }),
        expiredMembers: await Member.countDocuments({ membershipStatus: "EXPIRED" }),
        standardMembers: await Member.countDocuments({ membershipType: "STANDARD" }),
        studentMembers: await Member.countDocuments({ membershipType: "STUDENT" }),
        veteranMembers: await Member.countDocuments({ membershipType: "VETERAN" }),
      };

      return res.status(200).json({
        message: "Statistics retrieved",
        stats,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: CREATE MEMBERSHIP TYPE ==========
  createMembershipType: async (req, res) => {
    try {
      const {
        name,
        displayName,
        description,
        price,
        discountPercentage,
        validityMonths,
        requiresDocumentVerification,
        requiredDocumentType,
        benefits,
      } = req.body;

      // Validate required fields
      if (!name || !displayName || price === undefined) {
        return res.status(400).json({
          message: "Missing required fields: name, displayName, price",
        });
      }

      // Normalize name to uppercase for consistency with schema enum
      const normalizedName = name.toUpperCase();

      // Check if membership type already exists
      const existingType = await MembershipType.findOne({ name: normalizedName });
      if (existingType) {
        return res.status(400).json({
          message: `Membership type '${normalizedName}' already exists`,
        });
      }

      // Create new membership type
      const newType = await MembershipType.create({
        name: normalizedName,
        displayName,
        description,
        price,
        discountPercentage: discountPercentage || 0,
        validityMonths: validityMonths || 12,
        requiresDocumentVerification: requiresDocumentVerification || false,
        requiredDocumentType: requiredDocumentType || [],
        benefits: benefits || [],
        isActive: true,
      });

      return res.status(201).json({
        message: "Membership type created successfully",
        type: newType,
      });
    } catch (error) {
      console.error("Create membership type error:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  },

  // ========== ADMIN: GET ALL MEMBERSHIP TYPES ==========
  getAllMembershipTypes: async (req, res) => {
    try {
      const types = await MembershipType.find().sort({ createdAt: -1 });
      return res.status(200).json({
        message: "Membership types retrieved successfully",
        types,
      });
    } catch (error) {
      console.error("Get all membership types error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: UPDATE MEMBERSHIP TYPE ==========
  updateMembershipType: async (req, res) => {
    try {
      const { typeId } = req.params;
      const {
        displayName,
        description,
        price,
        discountPercentage,
        validityMonths,
        requiresDocumentVerification,
        requiredDocumentType,
        benefits,
        isActive,
      } = req.body;

      const updatedType = await MembershipType.findByIdAndUpdate(
        typeId,
        {
          displayName,
          description,
          price,
          discountPercentage,
          validityMonths,
          requiresDocumentVerification,
          requiredDocumentType,
          benefits,
          isActive,
        },
        { new: true }
      );

      if (!updatedType) {
        return res.status(404).json({ message: "Membership type not found" });
      }

      return res.status(200).json({
        message: "Membership type updated successfully",
        type: updatedType,
      });
    } catch (error) {
      console.error("Update membership type error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: DELETE MEMBERSHIP TYPE ==========
  deleteMembershipType: async (req, res) => {
    try {
      const { typeId } = req.params;

      // Check if any members are using this membership type
      const membershipTypeName = await MembershipType.findById(typeId).select("name");
      if (!membershipTypeName) {
        return res.status(404).json({ message: "Membership type not found" });
      }

      const membersWithType = await Member.findOne({
        membershipType: membershipTypeName.name,
      });

      if (membersWithType) {
        return res.status(400).json({
          message: "Cannot delete membership type. Members are using this type.",
        });
      }

      const deletedType = await MembershipType.findByIdAndDelete(typeId);

      return res.status(200).json({
        message: "Membership type deleted successfully",
        type: deletedType,
      });
    } catch (error) {
      console.error("Delete membership type error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = membershipController;
