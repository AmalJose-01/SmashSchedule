/**
 * ========================================
 * FEATURE: Membership
 * MODULE: Admin Service Layer
 * FILE: API Services
 * ========================================
 * 
 * Pure API calls for admin membership operations.
 * No business logic, state management, or React dependencies.
 * Functions here are reusable from any context.
 */

import { BASE_URL } from "../../../../../utils/config.js";
import { headerData } from "../../../../../utils/storageHandler.js";
import apiClient from "../../../../services/api/axiosInstance.js";
/**
 * Fetch all members with pagination, search, and filtering
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} search - Search term for name/email/phone
 * @param {string} status - Filter by membership status
 * @returns {Promise<MembersPaginatedResponse>}
 */
export const getAllMembers = async (page = 1, limit = 10, search = "", status = "") => {
  const response = await apiClient.get(`${BASE_URL}/membership/admin/members`, {
    params: { page, limit, search, status },
    ...headerData(),
  });
  return response.data;
};

/**
 * Fetch pending documents waiting for verification
 * @returns {Promise<PendingVerificationsResponse>}
 */
export const getPendingVerifications = async () => {
  const response = await apiClient.get(
    `${BASE_URL}/membership/admin/pending-verifications`,
    { ...headerData() }
  );
  return response.data;
};

/**
 * Verify or reject a member's document
 * @param {string} documentId - Document ID
 * @param {string} status - 'APPROVED' or 'REJECTED'
 * @param {string} rejectionReason - Reason for rejection (if rejecting)
 * @returns {Promise<VerifyDocumentResponse>}
 */
export const verifyDocument = async (documentId, status, rejectionReason = "") => {
  const response = await apiClient.post(
    `${BASE_URL}/membership/admin/verify-document/${documentId}`,
    { status, rejectionReason },
    { ...headerData() }
  );
  return response.data;
};

/**
 * Fetch memberships expiring in next 30 days
 * @returns {Promise<ExpiringMembershipsResponse>}
 */
export const getExpiringMemberships = async () => {
  const response = await apiClient.get(
    `${BASE_URL}/membership/admin/expiring-memberships`,
    { ...headerData() }
  );
  return response.data;
};

/**
 * Fetch membership statistics
 * @returns {Promise<MembershipStatsResponse>}
 */
export const getMembershipStats = async () => {
  const response = await apiClient.get(
    `${BASE_URL}/membership/admin/statistics`,
    { ...headerData() }
  );
  return response.data;
};

/**
 * Automatically expire memberships past their expiry date
 * @returns {Promise<AutoExpireResponse>}
 */
export const autoExpireMembers = async () => {
  const response = await apiClient.post(
    `${BASE_URL}/membership/admin/auto-expire`,
    {},
    { ...headerData() }
  );
  return response.data;
};
