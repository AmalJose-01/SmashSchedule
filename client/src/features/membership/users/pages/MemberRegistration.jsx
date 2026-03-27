import React from "react";
import { useNavigate } from "react-router-dom";
import { useMemberRegistration } from "../hooks/useMemberRegistration";
import "./MemberRegistration.css";

const MemberRegistration = () => {
  const navigate = useNavigate();
  const {
    step,
    setStep,
    formData,
    setFormData,
    documentFile,
    documentType,
    setDocumentType,
    previewImage,
    membershipTypes,
    selectedType,
    isRegistering,
    handleInputChange,
    handleFileSelect,
    handleDocumentUpload,
    handleRegister,
  } = useMemberRegistration();

  // Step 1: Personal Information
  if (step === 1) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <h2>Member Registration - Step 1</h2>
          <p>Personal Information</p>

          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email"
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter age"
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Next: Address
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Address & Membership Type
  if (step === 2) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <h2>Member Registration - Step 2</h2>
          <p>Address & Membership Type</p>

          <form onSubmit={handleRegister}>
            <div className="form-section">
              <h3>Address Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Street</label>
                  <input
                    type="text"
                    name="address_street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="Street address"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address_city"
                    value={formData.address.city}
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
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="address_zipCode"
                    value={formData.address.zipCode}
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
                  value={formData.address.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Membership Type</h3>
              <div className="membership-options">
                {membershipTypes.map((type) => (
                  <div
                    key={type._id}
                    className={`membership-card ${
                      formData.membershipType === type.name ? "selected" : ""
                    }`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        membershipType: type.name,
                      })
                    }
                  >
                    <h4>{type.displayName}</h4>
                    <p className="price">${type.price}/year</p>
                    {type.discountPercentage > 0 && (
                      <p className="discount">{type.discountPercentage}% Discount</p>
                    )}
                    <p className="description">{type.description}</p>
                    {type.requiresDocumentVerification && (
                      <p className="note">⚠️ Document verification required</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isRegistering}
              >
                {isRegistering ? "Registering..." : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Document Upload (if required)
  if (step === 3) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <h2>Member Registration - Step 3</h2>
          <p>Verify Your Identity</p>

          <div className="document-section">
            <h3>Upload Verification Document</h3>
            <p>
              Your {selectedType?.displayName} membership requires document verification.
            </p>

            <div className="document-type-select">
              <label>Document Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {selectedType?.requiredDocumentType.map((docType) => (
                  <option key={docType} value={docType}>
                    {docType.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="file-upload">
              <label>Select File (PDF, JPG, PNG - Max 5MB) *</label>
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
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/member/profile")}
              >
                Skip for Now
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleDocumentUpload}
                disabled={!documentFile}
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MemberRegistration;
