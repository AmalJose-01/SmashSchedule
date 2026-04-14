/**
 * ========================================
 * FEATURE: Membership
 * MODULE: User Service Layer
 * FILE: Data Transfer Objects (DTOs)
 * ========================================
 * 
 * Defines the shape of API requests and responses.
 * Documents the API contracts between frontend and backend.
 */

/**
 * @typedef {Object} RegisterMemberRequest
 * @property {string} userId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {number} age
 * @property {string} dateOfBirth
 * @property {Object} address
 * @property {string} address.street
 * @property {string} address.city
 * @property {string} address.state
 * @property {string} address.zipCode
 * @property {string} address.country
 * @property {string} membershipType
 */

/**
 * @typedef {Object} RegisterMemberResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} member
 * @property {string} member._id
 * @property {string} member.userId
 * @property {string} member.firstName
 * @property {string} member.lastName
 * @property {string} member.email
 * @property {string} member.membershipType
 * @property {string} member.membershipStatus
 * @property {string} member.membershipStartDate
 * @property {string} member.membershipExpiryDate
 */

/**
 * @typedef {Object} MembershipTypesResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Array<Object>} types
 * @property {string} types[].\_id
 * @property {string} types[].name
 * @property {string} types[].description
 * @property {number} types[].price
 * @property {number} types[].durationMonths
 * @property {boolean} types[].requiresDocumentVerification
 * @property {string[]} types[].approvedDocuments
 */

/**
 * @typedef {Object} MemberProfileResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} profile
 * @property {string} profile._id
 * @property {string} profile.firstName
 * @property {string} profile.lastName
 * @property {string} profile.email
 * @property {string} profile.phoneNumber
 * @property {number} profile.age
 * @property {string} profile.dateOfBirth
 * @property {Object} profile.address
 * @property {string} profile.membershipType
 * @property {string} profile.membershipStatus
 * @property {string} profile.membershipStartDate
 * @property {string} profile.membershipExpiryDate
 * @property {boolean} profile.isVerified
 * @property {number} profile.renewalCount
 */

/**
 * @typedef {Object} UpdateMemberProfileRequest
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [phoneNumber]
 * @property {number} [age]
 * @property {Object} [address]
 */

/**
 * @typedef {Object} UpdateMemberProfileResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} profile
 */

/**
 * @typedef {Object} UploadDocumentResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} document
 * @property {string} document._id
 * @property {string} document.memberId
 * @property {string} document.documentType
 * @property {string} document.fileUrl
 * @property {string} document.verificationStatus
 */

/**
 * @typedef {Object} RenewMembershipResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} membership
 * @property {string} membership.membershipExpiryDate
 * @property {number} membership.renewalCount
 */

/**
 * @typedef {Object} MembershipHistoryResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Array<Object>} history
 * @property {string} history[].membershipType
 * @property {string} history[].startDate
 * @property {string} history[].expiryDate
 * @property {string} history[].status
 * @property {string} history[].renewalDate
 */

/**
 * @typedef {Object} ApiErrorResponse
 * @property {boolean} success - Always false for errors
 * @property {string} message - Error message
 * @property {string} [code] - Error code
 * @property {Array<string>} [errors] - Array of validation errors if applicable
 */

export const DTO_SHAPES = {
  REGISTER_MEMBER: "RegisterMemberRequest",
  MEMBERSHIP_TYPES: "MembershipTypesResponse",
  MEMBER_PROFILE: "MemberProfileResponse",
  UPDATE_PROFILE: "UpdateMemberProfileRequest",
  UPLOAD_DOCUMENT: "UploadDocumentResponse",
  RENEW_MEMBERSHIP: "RenewMembershipResponse",
  HISTORY: "MembershipHistoryResponse",
};
