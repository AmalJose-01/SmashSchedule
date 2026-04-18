import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useClubProfile } from "../hooks/useClubProfile";
import AddressSearch from "../../../../components/AddressSearch";
import "./ClubProfile.css";

const ClubProfile = () => {
  const navigate = useNavigate();
  const logoInputRef = useRef(null);

  const {
    club,
    formData,
    isLoading,
    isEditing,
    isSaving,
    isProfileComplete,
    logoPreview,
    handleInputChange,
    handleAddressSelect,
    handleLogoSelect,
    handleSave,
    handleEditStart,
    handleEditCancel,
  } = useClubProfile();

  if (isLoading) {
    return (
      <div className="cp-loading">
        <div className="cp-spinner" />
        <p>Loading club profile...</p>
      </div>
    );
  }

  const logoSrc = logoPreview || club?.logo;
  const initials = (club?.name || formData.name || "?")[0].toUpperCase();

  return (
    <div className="cp-container">
      <div className="cp-wrapper">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        {!isProfileComplete && (
          <div className="cp-incomplete-banner">
            <span>⚠️</span>
            <span>
              Complete your club profile before creating tournaments or membership types.
              <strong> Name, phone number, and city are required.</strong>
            </span>
          </div>
        )}

        {/* ===== HEADER ===== */}
        <div className="cp-header-card">
          <div className="cp-header-left">
            <div className="cp-logo-wrap">
              {logoSrc ? (
                <img src={logoSrc} alt="Club logo" className="cp-logo" />
              ) : (
                <div className="cp-logo-placeholder">{initials}</div>
              )}
              {isEditing && (
                <>
                  <div
                    className="cp-logo-edit-btn"
                    onClick={() => logoInputRef.current?.click()}
                    title="Upload logo"
                  >
                    📷
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="cp-logo-input"
                    onChange={handleLogoSelect}
                  />
                </>
              )}
            </div>
            <div className="cp-header-info">
              <h1>{club?.name || "Your Club"}</h1>
              <p>{club?.location?.city ? `${club.location.city}${club.location.state ? ", " + club.location.state : ""}` : "Location not set"}</p>
              <span className={`cp-complete-badge ${isProfileComplete ? "complete" : "incomplete"}`}>
                {isProfileComplete ? "✓ Profile Complete" : "⚠ Incomplete"}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button className="btn-edit-profile" onClick={handleEditStart}>
              Edit Profile
            </button>
          )}
        </div>

        {/* ===== CLUB DETAILS ===== */}
        <div className="cp-section-card">
          <h2 className="cp-section-title">🏢 Club Details</h2>

          {isEditing ? (
            <div className="cp-form">
              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label>Club Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sydney Smash Club"
                  />
                </div>
                <div className="cp-form-group">
                  <label>Registration Number</label>
                  <input
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. ABN 12 345 678 901"
                  />
                </div>
              </div>

              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label>Phone Number *</label>
                  <input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+61 400 000 000"
                  />
                </div>
                <div className="cp-form-group">
                  <label>Email (auto-filled)</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="club@example.com"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="cp-info-grid">
              <div className="cp-info-item">
                <label>Club Name</label>
                <span>{club?.name || <span className="empty">—</span>}</span>
              </div>
              <div className="cp-info-item">
                <label>Registration Number</label>
                <span>{club?.registrationNumber || <span className="empty">—</span>}</span>
              </div>
              <div className="cp-info-item">
                <label>Phone Number</label>
                <span>{club?.phoneNumber || <span className="empty">—</span>}</span>
              </div>
              <div className="cp-info-item">
                <label>Email</label>
                <span>{club?.email || <span className="empty">—</span>}</span>
              </div>
            </div>
          )}
        </div>

        {/* ===== LOCATION ===== */}
        <div className="cp-section-card">
          <h2 className="cp-section-title">📍 Location</h2>

          {isEditing ? (
            <div className="cp-form">
              <div className="cp-form-group">
                <label>🔍 Search Address</label>
                <AddressSearch
                  onAddressSelect={handleAddressSelect}
                  placeholder="Type your address to search..."
                />
              </div>

              <div className="cp-form-group">
                <label>Street Address</label>
                <input
                  name="location_address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label>City / Suburb *</label>
                  <input
                    name="location_city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    placeholder="Sydney"
                  />
                </div>
                <div className="cp-form-group">
                  <label>State</label>
                  <input
                    name="location_state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    placeholder="NSW"
                  />
                </div>
              </div>
              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label>Zip / Postal Code</label>
                  <input
                    name="location_zipCode"
                    value={formData.location.zipCode}
                    onChange={handleInputChange}
                    placeholder="2000"
                  />
                </div>
                <div className="cp-form-group">
                  <label>Country</label>
                  <input
                    name="location_country"
                    value={formData.location.country}
                    onChange={handleInputChange}
                    placeholder="Australia"
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                💡 Your GPS coordinates will be captured automatically when you save (if you allow location access).
              </p>

              <div className="cp-form-actions">
                <button className="btn-secondary" onClick={handleEditCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Club Profile"}
                </button>
              </div>
            </div>
          ) : (
            <div className="cp-info-grid">
              <div className="cp-info-item">
                <label>Street</label>
                <span>{club?.location?.address || <span className="empty">—</span>}</span>
              </div>
              <div className="cp-info-item">
                <label>City</label>
                <span>{club?.location?.city || <span className="empty">—</span>}</span>
              </div>
              <div className="cp-info-item">
                <label>State</label>
                <span>{club?.location?.state || <span className="empty">—</span>}</span>
              </div>
              <div className="cp-info-item">
                <label>Zip / Postal Code</label>
                <span>{club?.location?.zipCode || <span className="empty">—</span>}</span>
              </div>
              <div className="cp-info-item">
                <label>Country</label>
                <span>{club?.location?.country || <span className="empty">—</span>}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubProfile;
