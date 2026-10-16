const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const AdminUser = require("../../login-signup/model/adminUser");
const Club = require("../../../../model/club");
const Tournament = require("../../../../model/tournamentModel");
const Member = require("../../../../model/member");
const RoundRobinTournament = require("../../round-robin/models/RoundRobinTournament");
const RoundRobinMember = require("../../round-robin/models/RoundRobinMember");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const signMasterToken = (master) =>
  jwt.sign(
    { id: master._id, email: master.emailID, role: "master" },
    process.env.SECURITY_KEY_JWT,
    { expiresIn: process.env.MASTER_TOKEN_TTL || "8h" }
  );

// Short-lived token that makes the existing `auth` middleware treat the caller
// as the club's admin. No refresh token is ever issued for it.
const signImpersonationToken = (target, master) => {
  const ttl = process.env.MASTER_IMPERSONATION_TTL || "60m";
  const accessToken = jwt.sign(
    {
      id: target._id,
      firstName: target.firstName,
      lastName: target.lastName,
      email: target.emailID,
      impersonatedBy: String(master.masterId),
      impersonatedByEmail: master.masterEmail,
    },
    process.env.SECURITY_KEY_JWT,
    { expiresIn: ttl }
  );
  return { accessToken, expiresIn: ttl };
};

// Admin accounts left-joined to their Club (older admins may not have one yet).
const listClubs = async ({ search = "", status = "all", page = 1, limit = 20 }) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const pipeline = [
    { $match: { accountType: "admin" } },
    { $lookup: { from: Club.collection.name, localField: "_id", foreignField: "adminId", as: "club" } },
    { $unwind: { path: "$club", preserveNullAndEmptyArrays: true } },
  ];

  const q = String(search || "").trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    pipeline.push({
      $match: {
        $or: [
          { emailID: rx },
          { firstName: rx },
          { lastName: rx },
          { "club.name": rx },
          { "club.clubCode": rx },
          { "club.location.city": rx },
        ],
      },
    });
  }

  if (status === "verified") pipeline.push({ $match: { isVerified: true } });
  else if (status === "pending") pipeline.push({ $match: { isVerified: { $ne: true } } });
  else if (status === "incomplete") pipeline.push({ $match: { "club.isProfileComplete": { $ne: true } } });

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              adminId: "$_id",
              adminEmail: "$emailID",
              adminName: { $trim: { input: { $concat: ["$firstName", " ", { $ifNull: ["$lastName", ""] }] } } },
              isVerified: { $eq: ["$isVerified", true] },
              createdAt: 1,
              clubId: "$club._id",
              name: { $ifNull: ["$club.name", ""] },
              logo: { $ifNull: ["$club.logo", null] },
              city: { $ifNull: ["$club.location.city", ""] },
              state: { $ifNull: ["$club.location.state", ""] },
              clubCode: { $ifNull: ["$club.clubCode", ""] },
              isProfileComplete: { $eq: ["$club.isProfileComplete", true] },
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    }
  );

  const [out] = await AdminUser.aggregate(pipeline);
  const total = out?.total?.[0]?.n || 0;
  return { items: out?.items || [], total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
};

const getClubDetail = async (adminId) => {
  if (!mongoose.isValidObjectId(adminId)) return null;
  const admin = await AdminUser.findOne({ _id: adminId, accountType: "admin" }).lean();
  if (!admin) return null;
  const club = await Club.findOne({ adminId }).lean();

  const [tournaments, roundRobinTournaments, roundRobinMembers, members] = await Promise.all([
    Tournament.countDocuments({ adminId }),
    RoundRobinTournament.countDocuments({ adminId }),
    RoundRobinMember.countDocuments({ adminId }),
    club ? Member.countDocuments({ clubId: club._id }) : 0,
  ]);

  return {
    admin: {
      adminId: admin._id,
      email: admin.emailID,
      firstName: admin.firstName,
      lastName: admin.lastName || "",
      isVerified: admin.isVerified === true,
      createdAt: admin.createdAt,
      squareConnected: !!admin.squareMerchantId,
    },
    club,
    counts: { tournaments, roundRobinTournaments, roundRobinMembers, members },
  };
};

module.exports = { signMasterToken, signImpersonationToken, listClubs, getClubDetail };
