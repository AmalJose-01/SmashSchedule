import React from "react";
import { useMemberProfile } from "../hooks/useMemberProfile.js";
import Navbar from "../../../../../components/Navbar.jsx";
import "./MemberProfile.css";

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: { label: "Active", cls: "badge-active" },
    PENDING_VERIFICATION: { label: "Pending Verification", cls: "badge-pending" },
    EXPIRED: { label: "Expired", cls: "badge-expired" },
    SUSPENDED: { label: "Suspended", cls: "badge-suspended" },
  };
  const { label, cls } = map[status] || { label: status, cls: "badge-default" };
  return <span className={`status-badge ${cls}`}>{label}</span>;
};

const MemberProfile = () => {
  const {
    member,
    membership,
    history,
    isLoadingProfile,
    isEditing,
    editData,
    documentFile,
    documentType,
    setDocumentType,
    previewImage,
    showUploadSection,
    setShowUploadSection,
    isUpdating,
    isUploading,
    isRenewing,
    handleEditStart,
    handleEditCancel,
    handleEditChange,
    handleEditSave,
    handleFileSelect,
    handleDocumentUpload,
    handleRenew,
    isExpiringSoon,
    isExpired,
    navigate,
  } = useMemberProfile();

  if (isLoadingProfile) {
    return (
      <div className="mp-loading">
        <Navbar />
        <div className="mp-loading-inner">Loading your profile...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mp-loading">
        <Navbar />
        <div className="mp-loading-inner">
          <p>No membership found.</p>
          <button className="btn-primary" onClick={() => navigate("/membership")}>
            Register Membership
          </button>
        </div>
      </div>
    );
  }

  const expiryDate = member.membershipExpiryDate
    ? new Date(member.membershipExpiryDate).toLocaleDateString()
    : "—";

  return (
    <div className="mp-container">
      <div className="sticky top-0 z-50 bg-white shadow">
        <Navbar />
      </div>

      <div className="mp-content">
        {/* Header card */}
        <div className="mp-header-card">
          <div className="mp-avatar">
            {member.firstName?.[0]}{member.lastName?.[0]}
          </div>
          <div className="mp-header-info">
            <h1>{member.firstName} {member.lastName}</h1>
            <p>{member.email}</p>
            <StatusBadge status={member.membershipStatus} />
          </div>
        </div>

        {/* Expiry warning */}
        {isExpired() && (
          <div className="mp-banner mp-banner-error">
            Your membership has expired.
            <button className="btn-renew" onClick={handleRenew} disabled={isRenewing}>
              {isRenewing ? "Renewing..." : "Renew Now"}
            </button>
          </div>
        )}
        {!isExpired() && isExpiringSoon() && (
          <div className="mp-banner mp-banner-warn">
            Your membership expires on {expiryDate}.
            <button className="btn-renew" onClick={handleRenew} disabled={isRenewing}>
              {isRenewing ? "Renewing..." : "Renew Early"}
            </button>
          </div>
        )}

        <div className="mp-grid">
          {/* Personal Info */}
          <div className="mp-card">
            <h2 className="mp-card-title">Personal Information</h2>
            <div className="mp-field">
              <label>First Name</label>
              <span>{member.firstName}</span>
            </div>
            <div className="mp-field">
              <label>Last Name</label>
              <span>{member.lastName}</span>
            </div>
            <div className="mp-field">
              <label>Email</label>
              <span>{member.email}</span>
            </div>
            {member.age && (
              <div className="mp-field">
                <label>Age</label>
                <span>{member.age}</span>
              </div>
            )}
            {member.dateOfBirth && (
              <div className="mp-field">
                <label>Date of Birth</label>
                <span>{new Date(member.dateOfBirth).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Contact & Address (editable) */}
          <div className="mp-card">
            <div className="mp-card-header">
              <h2 className="mp-card-title">Contact & Address</h2>
              {!isEditing && (
                <button className="btn-edit" onClick={handleEditStart}>Edit</button>
              )}
            </div>

            {isEditing ? (
              <div className="mp-edit-form">
                <div className="mp-field">
                  <label>Phone Number</label>
                  <input
                    name="phoneNumber"
                    value={editData.phoneNumber}
                    onChange={handleEditChange}
                    className="mp-input"
                  />
                </div>
                <div className="mp-field">
                  <label>Street</label>
                  <input
                    name="address_street"
                    value={editData.address?.street || ""}
                    onChange={handleEditChange}
                    className="mp-input"
                  />
                </div>
                <div className="mp-field-row">
                  <div className="mp-field">
                    <label>City</label>
                    <input
                      name="address_city"
                      value={editData.address?.city || ""}
                      onChange={handleEditChange}
                      className="mp-input"
                    />
                  </div>
                  <div className="mp-field">
                    <label>State</label>
                    <input
                      name="address_state"
                      value={editData.address?.state || ""}
                      onChange={handleEditChange}
                      className="mp-input"
                    />
                  </div>
                </div>
                <div className="mp-field-row">
                  <div className="mp-field">
                    <label>Zip Code</label>
                    <input
                      name="address_zipCode"
                      value={editData.address?.zipCode || ""}
                      onChange={handleEditChange}
                      className="mp-input"
                    />
                  </div>
                  <div className="mp-field">
                    <label>Country</label>
                    <input
                      name="address_country"
                      value={editData.address?.country || ""}
                      onChange={handleEditChange}
                      className="mp-input"
                    />
                  </div>
                </div>
                <div className="mp-edit-actions">
                  <button className="btn-save" onClick={handleEditSave} disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                  <button className="btn-cancel" onClick={handleEditCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mp-field">
                  <label>Phone</label>
                  <span>{member.phoneNumber || "—"}</span>
                </div>
                <div className="mp-field">
                  <label>Address</label>
                  <span>
                    {[
                      member.address?.street,
                      member.address?.city,
                      member.address?.state,
                      member.address?.zipCode,
                      member.address?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Membership Details */}
          <div className="mp-card">
            <h2 className="mp-card-title">Membership Details</h2>
            <div className="mp-field">
              <label>Type</label>
              <span>{member.membershipType}</span>
            </div>
            <div className="mp-field">
              <label>Status</label>
              <StatusBadge status={member.membershipStatus} />
            </div>
            <div className="mp-field">
              <label>Expiry Date</label>
              <span className={isExpired() ? "text-red-600" : isExpiringSoon() ? "text-amber-600" : ""}>
                {expiryDate}
              </span>
            </div>
            {membership?.startDate && (
              <div className="mp-field">
                <label>Start Date</label>
                <span>{new Date(membership.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {membership?.membershipPrice !== undefined && (
              <div className="mp-field">
                <label>Price Paid</label>
                <span>${membership.membershipPrice}</span>
              </div>
            )}
          </div>

          {/* Document Verification */}
          <div className="mp-card">
            <div className="mp-card-header">
              <h2 className="mp-card-title">Document Verification</h2>
              {member.membershipStatus === "PENDING_VERIFICATION" && (
                <button className="btn-edit" onClick={() => setShowUploadSection((v) => !v)}>
                  {showUploadSection ? "Cancel" : "Upload"}
                </button>
              )}
            </div>

            {member.verificationDocumentId ? (
              <div className="mp-field">
                <label>Status</label>
                <StatusBadge status={member.verificationDocumentId.verificationStatus || "PENDING"} />
              </div>
            ) : (
              <p className="mp-hint">No document uploaded yet.</p>
            )}

            {showUploadSection && (
              <div className="mp-upload-section">
                <div className="mp-field">
                  <label>Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="mp-input"
                  >
                    <option value="STUDENT_ID">Student ID</option>
                    <option value="AGE_PROOF">Age Proof</option>
                    <option value="ADDRESS_PROOF">Address Proof</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="mp-field">
                  <label>File</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} />
                </div>
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="mp-preview-img" />
                )}
                <button
                  className="btn-primary"
                  onClick={handleDocumentUpload}
                  disabled={isUploading || !documentFile}
                >
                  {isUploading ? "Uploading..." : "Submit Document"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Membership History */}
        <div className="mp-card mp-history-card">
          <h2 className="mp-card-title">Membership History</h2>
          {history.length === 0 ? (
            <p className="mp-hint">No history available.</p>
          ) : (
            <div className="mp-history-list">
              {history.map((h, i) => (
                <div key={h._id || i} className="mp-history-item">
                  <div className="mp-history-row">
                    <span className="mp-history-type">{h.membershipType}</span>
                    <StatusBadge status={h.status} />
                  </div>
                  <div className="mp-history-dates">
                    {h.startDate && (
                      <span>From {new Date(h.startDate).toLocaleDateString()}</span>
                    )}
                    {h.expiryDate && (
                      <span>To {new Date(h.expiryDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  {h.membershipPrice !== undefined && (
                    <span className="mp-history-price">${h.membershipPrice}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
