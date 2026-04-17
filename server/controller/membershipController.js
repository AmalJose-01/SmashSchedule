const Member = require("../model/member");
const Membership = require("../model/membership");
const MemberDocument = require("../model/memberDocument");
const MembershipType = require("../model/membershipType");
const AdminUser = require("../model/adminUser");
const Club = require("../model/club");

// Helper: calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

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
        dateOfBirth,
        registeringFor,
        relationship,
        address,
        membershipType,
        clubId,
      } = req.body;

      // Validate required fields
      if (!userId || !firstName || !lastName || !email || !phoneNumber) {
        console.log("Missing required fields:", { userId, firstName, lastName, email, phoneNumber });
        return res.status(400).json({
          message: "Missing required fields: userId, firstName, lastName, email, phoneNumber are required",
          received: { userId, firstName, lastName, email, phoneNumber }
        });
      }

      if (!dateOfBirth) {
        return res.status(400).json({ message: "Date of birth is required" });
      }

      // Validate registeringFor and relationship
      if (!registeringFor || !["myself", "other"].includes(registeringFor)) {
        return res.status(400).json({ message: "registeringFor must be 'myself' or 'other'" });
      }

      if (registeringFor === "other") {
        if (!relationship || !["father", "mother", "brother", "sister", "spouse", "friend", "other"].includes(relationship)) {
          return res.status(400).json({ message: "relationship is required when registering for other" });
        }
      }

      const age = calculateAge(dateOfBirth);

      // Check if member already exists for this user+club combination
      const existingQuery = clubId ? { userId, clubId } : { userId };
      const existingMember = await Member.findOne(existingQuery);
      if (existingMember) {
        const existingMembership = await Membership.findOne({ memberId: existingMember._id });
        return res.status(200).json({
          message: "Member already registered",
          member: existingMember,
          membership: existingMembership,
          alreadyExists: true,
        });
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
        registeringFor,
        relationship: registeringFor === "other" ? relationship : null,
        address,
        membershipType,
        membershipExpiryDate: expiryDate,
        membershipStatus: membershipConfig.requiresDocumentVerification
          ? "PENDING_VERIFICATION"
          : "ACTIVE",
        isVerified: !membershipConfig.requiresDocumentVerification,
        ...(clubId && { clubId }),
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
      const { memberId, documentType, fileUrl } = req.body;

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

      // Delete old document if exists
      if (member.verificationDocumentId) {
        await MemberDocument.deleteOne({ _id: member.verificationDocumentId });
      }

      // Create document record
      const document = await MemberDocument.create({
        memberId,
        documentType,
        fileName: req.file.filename,
        fileUrl: fileUrl || req.file.path, // Use provided URL or default path
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
      const { phoneNumber, address, profilePhoto, dateOfBirth } = req.body;

      const update = { phoneNumber, address, profilePhoto };
      if (dateOfBirth) {
        update.dateOfBirth = dateOfBirth;
        update.age = calculateAge(dateOfBirth);
      }

      const member = await Member.findByIdAndUpdate(
        memberId,
        update,
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

      const club = await Club.findOne({ adminId: req.userId }).lean();
      if (!club) {
        return res.status(200).json({ members: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
      }

      const query = { clubId: club._id };

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

  // ========== ADMIN: DELETE MEMBER ==========
  deleteMember: async (req, res) => {
    try {
      const { memberId } = req.params;
      const club = await Club.findOne({ adminId: req.userId }).lean();
      if (!club) return res.status(403).json({ message: "Club not found" });

      const member = await Member.findOne({ _id: memberId, clubId: club._id });
      if (!member) return res.status(404).json({ message: "Member not found or access denied" });

      if (member.verificationDocumentId) {
        await MemberDocument.deleteOne({ _id: member.verificationDocumentId });
      }
      await Membership.deleteMany({ memberId });
      await Member.deleteOne({ _id: memberId });

      return res.status(200).json({ message: "Member deleted successfully" });
    } catch (error) {
      console.error("Delete member error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: UPDATE MEMBER ==========
  updateMemberAdmin: async (req, res) => {
    try {
      const { memberId } = req.params;
      const { firstName, lastName, email, phoneNumber, membershipType, membershipStatus, age, address } = req.body;

      const club = await Club.findOne({ adminId: req.userId }).lean();
      if (!club) return res.status(403).json({ message: "Club not found" });

      const update = {};
      if (firstName !== undefined) update.firstName = firstName;
      if (lastName !== undefined) update.lastName = lastName;
      if (email !== undefined) update.email = email;
      if (phoneNumber !== undefined) update.phoneNumber = phoneNumber;
      if (membershipType !== undefined) update.membershipType = membershipType;
      if (membershipStatus !== undefined) update.membershipStatus = membershipStatus;
      if (age !== undefined) update.age = age;
      if (address !== undefined) update.address = address;

      const member = await Member.findOneAndUpdate(
        { _id: memberId, clubId: club._id },
        update,
        { new: true }
      );

      if (!member) return res.status(404).json({ message: "Member not found or access denied" });
      return res.status(200).json({ message: "Member updated successfully", member });
    } catch (error) {
      console.error("Update member error:", error);
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
      const club = await Club.findOne({ adminId: req.userId }).lean();
      const clubMemberIds = club
        ? (await Member.find({ clubId: club._id }).select("_id").lean()).map((m) => m._id)
        : [];

      const documents = await MemberDocument.find({
        verificationStatus: "PENDING",
        memberId: { $in: clubMemberIds },
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

  // ========== GET MY MEMBERSHIPS (User — all clubs) ==========
  getMyMemberships: async (req, res) => {
    try {
      console.log("getMyMemberships — req.userId:", req.userId);
      const members = await Member.find({ userId: req.userId })
        .populate("clubId", "name logo location")
        .populate("verificationDocumentId")
        .lean();

      const memberIds = members.map((m) => m._id);
      const memberships = await Membership.find({ memberId: { $in: memberIds } })
        .sort({ createdAt: -1 })
        .lean();

      // Attach latest membership record to each member
      const result = members.map((m) => ({
        ...m,
        latestMembership: memberships.find(
          (ms) => ms.memberId.toString() === m._id.toString()
        ) || null,
      }));

      console.log("getMyMemberships — found members:", members.length);
      return res.status(200).json({ memberships: result });
    } catch (error) {
      console.error("getMyMemberships error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GET MEMBERSHIP TYPES ==========
  getMembershipTypes: async (req, res) => {
    try {
      const { adminId } = req.query;
      const query = { isActive: true };
      if (adminId) query.createdBy = adminId;
      const types = await MembershipType.find(query).lean();

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

      const club = await Club.findOne({ adminId: req.userId }).lean();
      const clubFilter = club ? { clubId: club._id } : { clubId: null };

      const expiringMembers = await Member.find({
        ...clubFilter,
        membershipExpiryDate: { $gte: today, $lte: expiryThreshold },
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
      const club = await Club.findOne({ adminId: req.userId }).lean();
      const clubFilter = club ? { clubId: club._id } : { clubId: null };

      const result = await Member.updateMany(
        {
          ...clubFilter,
          membershipExpiryDate: { $lt: today },
          membershipStatus: "ACTIVE",
        },
        {
          membershipStatus: "EXPIRED",
        }
      );

      const expiredMemberIds = club
        ? (await Member.find({ clubId: club._id, membershipExpiryDate: { $lt: today } }).select("_id").lean()).map((m) => m._id)
        : [];
      await Membership.updateMany(
        { memberId: { $in: expiredMemberIds }, expiryDate: { $lt: today }, status: "ACTIVE" },
        { status: "EXPIRED" }
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

      if (!name || !displayName || price === undefined) {
        return res.status(400).json({ message: "name, displayName, and price are required" });
      }

      const adminId = req.userId;

      const existing = await MembershipType.findOne({ name, createdBy: adminId });
      if (existing) {
        return res.status(400).json({ message: "You already have a membership type with this name" });
      }

      const membershipType = await MembershipType.create({
        name,
        displayName,
        description,
        price,
        discountPercentage: discountPercentage || 0,
        validityMonths: validityMonths || 12,
        requiresDocumentVerification: requiresDocumentVerification || false,
        requiredDocumentType: requiredDocumentType || [],
        benefits: benefits || [],
        createdBy: adminId,
      });

      return res.status(201).json({
        message: "Membership type created successfully",
        membershipType,
      });
    } catch (error) {
      console.error("Error creating membership type:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: GET ALL MEMBERSHIP TYPES ==========
  getAllMembershipTypes: async (req, res) => {
    try {
      const types = await MembershipType.find({ createdBy: req.userId }).sort({ createdAt: 1 }).lean();
      return res.status(200).json({ message: "Membership types retrieved", types });
    } catch (error) {
      console.error("Error fetching membership types:", error);
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

      const membershipType = await MembershipType.findOneAndUpdate(
        { _id: typeId, createdBy: req.userId },
        {
          ...(displayName !== undefined && { displayName }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price }),
          ...(discountPercentage !== undefined && { discountPercentage }),
          ...(validityMonths !== undefined && { validityMonths }),
          ...(requiresDocumentVerification !== undefined && { requiresDocumentVerification }),
          ...(requiredDocumentType !== undefined && { requiredDocumentType }),
          ...(benefits !== undefined && { benefits }),
          ...(isActive !== undefined && { isActive }),
        },
        { new: true }
      );

      if (!membershipType) {
        return res.status(404).json({ message: "Membership type not found or access denied" });
      }

      return res.status(200).json({
        message: "Membership type updated successfully",
        membershipType,
      });
    } catch (error) {
      console.error("Error updating membership type:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== ADMIN: DELETE MEMBERSHIP TYPE ==========
  deleteMembershipType: async (req, res) => {
    try {
      const { typeId } = req.params;

      const membershipType = await MembershipType.findOne({ _id: typeId, createdBy: req.userId });
      if (!membershipType) {
        return res.status(404).json({ message: "Membership type not found or access denied" });
      }

      const inUse = await Member.countDocuments({ membershipType: membershipType.name });
      if (inUse > 0) {
        return res.status(400).json({
          message: `Cannot delete: ${inUse} member(s) currently use this type`,
        });
      }

      await MembershipType.findByIdAndDelete(typeId);

      return res.status(200).json({ message: "Membership type deleted successfully" });
    } catch (error) {
      console.error("Error deleting membership type:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // ========== GET MEMBERSHIP STATISTICS (Admin Dashboard) ==========
  getMembershipStats: async (req, res) => {
    try {
      const club = await Club.findOne({ adminId: req.userId }).lean();
      const clubFilter = club ? { clubId: club._id } : { clubId: null };

      const types = await MembershipType.find({ createdBy: req.userId }).lean();
      const typeBreakdown = {};
      for (const t of types) {
        typeBreakdown[t.name] = await Member.countDocuments({ ...clubFilter, membershipType: t.name });
      }

      const stats = {
        totalMembers: await Member.countDocuments(clubFilter),
        activeMembers: await Member.countDocuments({ ...clubFilter, membershipStatus: "ACTIVE" }),
        pendingVerification: await Member.countDocuments({ ...clubFilter, membershipStatus: "PENDING_VERIFICATION" }),
        expiredMembers: await Member.countDocuments({ ...clubFilter, membershipStatus: "EXPIRED" }),
        // legacy keys kept for dashboard compatibility
        standardMembers: typeBreakdown["STANDARD"] || 0,
        studentMembers: typeBreakdown["STUDENT"] || 0,
        veteranMembers: typeBreakdown["VETERAN"] || 0,
        typeBreakdown,
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
};

module.exports = membershipController;
