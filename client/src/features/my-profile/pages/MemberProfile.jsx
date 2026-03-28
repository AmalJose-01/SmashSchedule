import React from "react";
import { useNavigate } from "react-router-dom";
import { useMemberProfile } from "../hooks/useMemberProfile";
import "./MemberProfile.css";

const STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending Verification",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

const DOCUMENT_STATUS_CONFIG = {
  APPROVED: {
    className: "approved",
    icon: "✅",
    title: "Document Verified",
    desc: "Your identity document has been verified successfully.",
  },
  PENDING: {
    className: "pending",
    icon: "⏳",
    title: "Verification Pending",
    desc: "Your document is under review. This may take 1-2 business days.",
  },
  REJECTED: {
    className: "rejected",
    icon: "❌",
    title: "Document Rejected",
    desc: "Your document was rejected. Please upload a new one.",
  },
};

const getInitials = (firstName, lastName) => {
  return `${(firstName || "?")[0]}${(lastName || "?")[0]}`.toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isExpiringSoon = (expiryDate) => {
  if (!expiryDate) return false;
  const daysLeft = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
  return daysLeft >= 0 && daysLeft <= 30;
};

const MemberProfile = () => {
  const navigate = useNavigate();
  const {
    memberId,
    member,
    membership,
    document,
    history,
    isLoadingProfile,
    isEditing,
    editData,
    documentFile,
    documentType,
    setDocumentType,
    previewImage,
    isUpdating,
    isUploading,
    isRenewing,
    handleEditStart,
    handleEditCancel,
    handleInputChange,
    handleSaveProfile,
    handleFileSelect,
    handleDocumentUpload,
    handleRenewMembership,
  } = useMemberProfile();

  if (isLoadingProfile) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!memberId || !member) {
    return (
      <div className="profile-no-member">
        <h2>No Membership Found</h2>
        <p>You haven't registered as a member yet.</p>
        <button className="btn-primary" onClick={() => navigate("/user/membership")}>
          Register Now
        </button>
      </div>
    );
  }

  const statusKey = (member.membershipStatus || "").toLowerCase();
  const docConfig =
    document
      ? DOCUMENT_STATUS_CONFIG[document.verificationStatus] || DOCUMENT_STATUS_CONFIG.PENDING
      : null;

  const expiryDateValue = membership?.expiryDate;
  const canRenew =
    member.membershipStatus === "EXPIRED" || isExpiringSoon(expiryDateValue);

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Back Button */}
        <button className="btn-back" onClick={() => navigate("/user/dashboard")}>
          ← Back to Dashboard
        </button>

        {/* ===== HEADER CARD ===== */}
        <div className="profile-header-card">
          <div className="profile-header-left">
            <div className="profile-avatar">
              {getInitials(member.firstName, member.lastName)}
            </div>
            <div className="profile-header-info">
              <h1>{member.firstName} {member.lastName}</h1>
              <p>{member.email}</p>
            </div>
          </div>
          <div className="profile-header-actions">
            <span className={`status-badge ${statusKey}`}>
              <span className="status-dot" />
              {STATUS_LABELS[member.membershipStatus] || member.membershipStatus}
            </span>
            {canRenew && (
              <button
                className="btn-renew"
                onClick={handleRenewMembership}
                disabled={isRenewing}
              >
                {isRenewing ? "Renewing..." : "Renew Membership"}
              </button>
            )}
          </div>
        </div>

        {/* ===== PERSONAL INFORMATION ===== */}
        <div className="profile-section-card">
          <h2 className="section-title">
            <span className="section-title-icon">👤</span>
            Personal Information
          </h2>
          <div className="info-grid">
            <div className="info-item">
              <label>First Name</label>
              <span>{member.firstName || <span className="empty">—</span>}</span>
            </div>
            <div className="info-item">
              <label>Last Name</label>
              <span>{member.lastName || <span className="empty">—</span>}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{member.email || <span className="empty">—</span>}</span>
            </div>
            <div className="info-item">
              <label>Age</label>
              <span>{member.age || <span className="empty">—</span>}</span>
            </div>
            <div className="info-item">
              <label>Date of Birth</label>
              <span>{formatDate(member.dateOfBirth)}</span>
            </div>
          </div>
        </div>

        {/* ===== CONTACT & ADDRESS ===== */}
        <div className="profile-section-card">
          <h2 className="section-title">
            <span className="section-title-icon">📍</span>
            Contact & Address
          </h2>

          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editData.phoneNumber || ""}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Street</label>
                  <input
                    type="text"
                    name="address_street"
                    value={editData.address?.street || ""}
                    onChange={handleInputChange}
                    placeholder="Street address"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address_city"
                    value={editData.address?.city || ""}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address_state"
                    value={editData.address?.state || ""}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="address_zipCode"
                    value={editData.address?.zipCode || ""}
                    onChange={handleInputChange}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="address_country"
                  value={editData.address?.country || ""}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>
              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="info-grid">
                <div className="info-item">
                  <label>Phone Number</label>
                  <span>{member.phoneNumber || <span className="empty">—</span>}</span>
                </div>
                <div className="info-item">
                  <label>Street</label>
                  <span>{member.address?.street || <span className="empty">—</span>}</span>
                </div>
                <div className="info-item">
                  <label>City</label>
                  <span>{member.address?.city || <span className="empty">—</span>}</span>
                </div>
                <div className="info-item">
                  <label>State</label>
                  <span>{member.address?.state || <span className="empty">—</span>}</span>
                </div>
                <div className="info-item">
                  <label>ZIP Code</label>
                  <span>{member.address?.zipCode || <span className="empty">—</span>}</span>
                </div>
                <div className="info-item">
                  <label>Country</label>
                  <span>{member.address?.country || <span className="empty">—</span>}</span>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleEditStart}>
                  Edit Contact & Address
                </button>
              </div>
            </>
          )}
        </div>

        {/* ===== MEMBERSHIP DETAILS ===== */}
        <div className="profile-section-card">
          <h2 className="section-title">
            <span className="section-title-icon">🎖️</span>
            Membership Details
          </h2>
          <div className="membership-info-grid">
            <div className="membership-stat">
              <label>Membership Type</label>
              <div className="stat-value">{member.membershipType || "—"}</div>
            </div>
            <div className="membership-stat">
              <label>Status</label>
              <div className="stat-value">
                <span className={`status-badge ${statusKey}`}>
                  {STATUS_LABELS[member.membershipStatus] || member.membershipStatus || "—"}
                </span>
              </div>
            </div>
            <div className="membership-stat">
              <label>Start Date</label>
              <div className="stat-value">{formatDate(membership?.startDate)}</div>
            </div>
            <div className="membership-stat">
              <label>Expiry Date</label>
              <div
                className={`stat-value ${
                  member.membershipStatus === "EXPIRED"
                    ? "expired"
                    : isExpiringSoon(expiryDateValue)
                    ? "expiring-soon"
                    : ""
                }`}
              >
                {formatDate(expiryDateValue)}
                {isExpiringSoon(expiryDateValue) && member.membershipStatus !== "EXPIRED" && (
                  <span style={{ fontSize: "12px", display: "block", fontWeight: 400 }}>
                    Expiring soon
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== DOCUMENT VERIFICATION ===== */}
        <div className="profile-section-card">
          <h2 className="section-title">
            <span className="section-title-icon">📄</span>
            Document Verification
          </h2>

          {docConfig ? (
            <div className={`document-status ${docConfig.className}`}>
              <span className="document-status-icon">{docConfig.icon}</span>
              <div className="document-status-text">
                <h4>{docConfig.title}</h4>
                <p>{docConfig.desc}</p>
                {document.verificationStatus === "REJECTED" && document.rejectionReason && (
                  <p style={{ marginTop: 6, color: "#dc2626", fontWeight: 600 }}>
                    Reason: {document.rejectionReason}
                  </p>
                )}
                {document.verificationStatus === "APPROVED" && (
                  <p style={{ marginTop: 6, color: "#065f46" }}>
                    Type: {document.documentType?.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="document-status none">
              <span className="document-status-icon">📂</span>
              <div className="document-status-text">
                <h4>No Document Uploaded</h4>
                <p>Upload a verification document if required for your membership type.</p>
              </div>
            </div>
          )}

          {/* Show upload section if no approved document */}
          {(!document || document.verificationStatus !== "APPROVED") && (
            <div className="document-upload-section">
              <h4>
                {document?.verificationStatus === "REJECTED"
                  ? "Upload New Document"
                  : "Upload Verification Document"}
              </h4>
              <div className="document-type-select">
                <label>Document Type *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="STUDENT_ID">Student ID</option>
                  <option value="GOVERNMENT_ID">Government ID</option>
                  <option value="VETERAN_PROOF">Veteran Proof</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="file-upload">
                <label>Select File (PDF, JPG, PNG — Max 5MB) *</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {documentFile && (
                  <p className="file-name">✓ {documentFile.name}</p>
                )}
              </div>
              {previewImage && (
                <div className="image-preview">
                  <img src={previewImage} alt="Document preview" />
                </div>
              )}
              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleDocumentUpload}
                  disabled={!documentFile || isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== MEMBERSHIP HISTORY ===== */}
        <div className="profile-section-card">
          <h2 className="section-title">
            <span className="section-title-icon">📋</span>
            Membership History
          </h2>
          {history.length > 0 ? (
            <div className="history-list">
              {history.map((item, index) => (
                <div key={item._id || index} className="history-item">
                  <div className="history-item-left">
                    <h4>{item.membershipType || "Membership"}</h4>
                    <p>
                      {formatDate(item.startDate)} — {formatDate(item.expiryDate)}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${(item.status || "").toLowerCase()}`}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="history-empty">No membership history available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
