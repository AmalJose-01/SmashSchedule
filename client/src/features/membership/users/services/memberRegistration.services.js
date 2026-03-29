/**
 * ========================================
 * FEATURE: Membership
 * MODULE: User Service Layer
 * FILE: API Services
 * ========================================
 * 
 * Pure API calls for membership operations.
 * No business logic, state management, or React dependencies.
 * Functions here are reusable from any context.
 */

import apiClient from "../../../../services/api/axiosInstance.js";
import { BASE_URL } from "../../../../../utils/config.js";
import { headerData } from "../../../../../utils/storageHandler.js";

/**
 * Register a new member
 * @param {Object} memberData - Member registration data
 * @returns {Promise<RegisterMemberResponse>}
 */
export const registerMember = async (memberData) => {
  const response = await apiClient.post(`/membership/register`, memberData);
  return response.data;
};

/**
 * Fetch all available membership types
 * @returns {Promise<MembershipTypesResponse>}
 */
export const getMembershipTypes = async (adminId) => {
  const params = adminId ? { adminId } : {};
  const response = await apiClient.get(`/membership/types`, { params });
  return response.data;
};

/**
 * Fetch member profile by ID
 * @param {string} memberId - Member ID
 * @returns {Promise<MemberProfileResponse>}
 */
export const getMemberProfile = async (memberId) => {
  const response = await apiClient.get(
    `/membership/${memberId}/profile`
  );
  return response.data;
};

/**
 * Update member profile
 * @param {string} memberId - Member ID
 * @param {Object} profileData - Profile update data
 * @returns {Promise<UpdateMemberProfileResponse>}
 */
export const updateMemberProfile = async (memberId, profileData) => {
  const response = await apiClient.put(
    `/membership/${memberId}/profile`,
    profileData
  );
  return response.data;
};

/**
 * Upload verification document for member
 * @param {string} memberId - Member ID
 * @param {File} file - Document file
 * @param {string} documentType - Type of document (STUDENT_ID, AGE_PROOF, ADDRESS_PROOF)
 * @returns {Promise<UploadDocumentResponse>}
 */
export const uploadVerificationDocument = async (memberId, file, documentType) => {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("documentType", documentType);
  formData.append("memberId", memberId);

  const response = await apiClient.post(
    `/membership/${memberId}/upload-document`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Renew member's membership
 * @param {string} memberId - Member ID
 * @returns {Promise<RenewMembershipResponse>}
 */
export const renewMembership = async (memberId) => {
  const response = await apiClient.post(
    `/membership/${memberId}/renew`,
    {}
  );
  return response.data;
};

/**
 * Fetch membership history for member
 * @param {string} memberId - Member ID
 * @returns {Promise<MembershipHistoryResponse>}
 */
export const getMembershipHistory = async (memberId) => {
  const response = await axios.get(
    `/membership/${memberId}/history`
  );
  return response.data;
};
