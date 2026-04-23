/**
 * ========================================
 * FEATURE: User Signup
 * MODULE: Service Layer
 * FILE: Type Definitions
 * ========================================
 */

/**
 * @typedef {Object} SignupPayload
 * @property {string} email
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} SignupResponse
 * @property {string} message
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {Object} user
 * @property {string} user._id
 * @property {string} user.emailID
 * @property {string} user.firstName
 * @property {string} user.accountType
 */
