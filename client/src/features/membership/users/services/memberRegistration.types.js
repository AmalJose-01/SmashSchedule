/**
 * ========================================
 * FEATURE: Membership
 * MODULE: User Service Layer
 * FILE: Type Definitions
 * ========================================
 * 
 * Defines all TypeScript-like interfaces and types for the membership feature.
 * This file is the single source of truth for all membership-related types and enums.
 */

/**
 * @typedef {Object} Address
 * @property {string} street
 * @property {string} city
 * @property {string} state
 * @property {string} zipCode
 * @property {string} country
 */

/**
 * @typedef {Object} Member
 * @property {string} _id - Member ID from database
 * @property {string} userId - User ID from authentication
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {number} age
 * @property {string} dateOfBirth - ISO date string
 * @property {Address} address
 * @property {string} membershipType - 'STANDARD' | 'STUDENT' | 'VETERAN'
 * @property {string} membershipStatus - 'ACTIVE' | 'PENDING_VERIFICATION' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'
 * @property {string} membershipStartDate - ISO date string
 * @property {string} membershipExpiryDate - ISO date string
 * @property {boolean} isVerified
 * @property {number} renewalCount
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} MembershipType
 * @property {string} _id
 * @property {string} name - 'STANDARD' | 'STUDENT' | 'VETERAN'
 * @property {string} description
 * @property {number} price
 * @property {number} durationMonths
 * @property {boolean} requiresDocumentVerification
 * @property {string[]} approvedDocuments - Array of document types accepted
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} MemberDocument
 * @property {string} _id
 * @property {string} memberId
 * @property {string} documentType - 'STUDENT_ID' | 'AGE_PROOF' | 'ADDRESS_PROOF'
 * @property {string} fileUrl
 * @property {string} fileName
 * @property {number} fileSize
 * @property {string} uploadedDate - ISO date string
 * @property {string} verificationStatus - 'PENDING' | 'APPROVED' | 'REJECTED'
 * @property {string} verificationReason - Reason for rejection if applicable
 * @property {string} verifiedBy - Admin user ID who verified
 * @property {Date} verifiedDate
 */

/**
 * @typedef {Object} MemberRegistrationPayload
 * @property {string} userId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {number} age
 * @property {string} dateOfBirth
 * @property {Address} address
 * @property {string} membershipType
 */

/**
 * @typedef {Object} MemberProfileUpdatePayload
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [phoneNumber]
 * @property {number} [age]
 * @property {Address} [address]
 */

/**
 * @typedef {Object} DocumentUploadPayload
 * @property {File} document
 * @property {string} documentType
 * @property {string} memberId
 */

export const MEMBERSHIP_STATUSES = {
  ACTIVE: "ACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
  CANCELLED: "CANCELLED",
};

export const MEMBERSHIP_TYPES = {
  STANDARD: "STANDARD",
  STUDENT: "STUDENT",
  VETERAN: "VETERAN",
};

export const DOCUMENT_TYPES = {
  STUDENT_ID: "STUDENT_ID",
  AGE_PROOF: "AGE_PROOF",
  ADDRESS_PROOF: "ADDRESS_PROOF",
};

export const VERIFICATION_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};
