/**
 * ========================================
 * FEATURE: Membership
 * MODULE: Admin Service Layer
 * FILE: Type Definitions
 * ========================================
 * 
 * Defines all TypeScript-like interfaces and types for admin membership management.
 * This file is the single source of truth for all admin membership-related types and enums.
 */

/**
 * @typedef {Object} MembershipStats
 * @property {number} totalMembers
 * @property {number} activeMembers
 * @property {number} pendingVerification
 * @property {number} expiredMembers
 * @property {number} suspendedMembers
 * @property {number} standardMembers
 * @property {number} studentMembers
 * @property {number} veteranMembers
 */

/**
 * @typedef {Object} MemberListItem
 * @property {string} _id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {string} membershipType
 * @property {string} membershipStatus
 * @property {string} membershipStartDate - ISO date string
 * @property {string} membershipExpiryDate - ISO date string
 * @property {boolean} isVerified
 */

/**
 * @typedef {Object} PaginationInfo
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} totalDocuments
 * @property {number} pageSize
 */

/**
 * @typedef {Object} VerificationDocument
 * @property {string} _id - Document ID
 * @property {Object} memberId - Member details
 * @property {string} memberId.firstName
 * @property {string} memberId.lastName
 * @property {string} memberId.email
 * @property {string} memberId.phoneNumber
 * @property {string} documentType - Type of document
 * @property {string} fileUrl - URL to download/view document
 * @property {string} uploadedDate - ISO date string
 * @property {string} verificationStatus - 'PENDING' | 'APPROVED' | 'REJECTED'
 */

/**
 * @typedef {Object} ExpiringMember
 * @property {string} _id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {string} membershipType
 * @property {string} membershipExpiryDate - ISO date string
 */

/**
 * @typedef {Object} VerificationRequest
 * @property {string} documentId
 * @property {string} status - 'APPROVED' | 'REJECTED'
 * @property {string} [rejectionReason] - Reason if rejecting
 */

export const ADMIN_VERIFICATION_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const ADMIN_MEMBER_STATUSES = {
  ACTIVE: "ACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
  CANCELLED: "CANCELLED",
};

export const ADMIN_DOCUMENT_TYPES = {
  STUDENT_ID: "STUDENT_ID",
  AGE_PROOF: "AGE_PROOF",
  ADDRESS_PROOF: "ADDRESS_PROOF",
};
