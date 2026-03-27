/**
 * ========================================
 * FEATURE: Membership
 * MODULE: Admin Service Layer
 * FILE: Data Transfer Objects (DTOs)
 * ========================================
 * 
 * Defines the shape of admin API requests and responses.
 * Documents the API contracts between admin frontend and backend.
 */

/**
 * @typedef {Object} GetAllMembersRequest
 * @property {number} page
 * @property {number} limit
 * @property {string} search - Search term for name/email/phone
 * @property {string} status - Filter by membership status
 */

/**
 * @typedef {Object} MembersPaginatedResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Array<Object>} members
 * @property {Object} pagination
 * @property {number} pagination.currentPage
 * @property {number} pagination.totalPages
 * @property {number} pagination.totalDocuments
 * @property {number} pagination.pageSize
 */

/**
 * @typedef {Object} MembershipStatsResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} stats
 * @property {number} stats.totalMembers
 * @property {number} stats.activeMembers
 * @property {number} stats.pendingVerification
 * @property {number} stats.expiredMembers
 * @property {number} stats.suspendedMembers
 * @property {number} stats.standardMembers
 * @property {number} stats.studentMembers
 * @property {number} stats.veteranMembers
 */

/**
 * @typedef {Object} PendingVerificationsResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Array<Object>} documents
 * @property {string} documents[].\_id
 * @property {Object} documents[].memberId
 * @property {string} documents[].documentType
 * @property {string} documents[].fileUrl
 * @property {string} documents[].uploadedDate
 * @property {string} documents[].verificationStatus
 */

/**
 * @typedef {Object} ExpiringMembershipsResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Array<Object>} members
 * @property {string} members[].\_id
 * @property {string} members[].firstName
 * @property {string} members[].lastName
 * @property {string} members[].email
 * @property {string} members[].phoneNumber
 * @property {string} members[].membershipType
 * @property {string} members[].membershipExpiryDate
 */

/**
 * @typedef {Object} VerifyDocumentRequest
 * @property {string} status - 'APPROVED' | 'REJECTED'
 * @property {string} [rejectionReason] - Required if rejecting
 */

/**
 * @typedef {Object} VerifyDocumentResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} document
 * @property {string} document._id
 * @property {string} document.verificationStatus
 * @property {string} document.verifiedBy
 * @property {string} document.verifiedDate
 */

/**
 * @typedef {Object} AutoExpireResponse
 * @property {boolean} success
 * @property {string} message
 * @property {number} expiredCount
 * @property {Array<string>} expiredMemberIds
 */

export const ADMIN_DTO_SHAPES = {
  GET_ALL_MEMBERS: "MembersPaginatedResponse",
  GET_STATS: "MembershipStatsResponse",
  GET_PENDING: "PendingVerificationsResponse",
  GET_EXPIRING: "ExpiringMembershipsResponse",
  VERIFY_DOCUMENT: "VerifyDocumentResponse",
  AUTO_EXPIRE: "AutoExpireResponse",
};
