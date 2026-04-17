import { useNavigate } from "react-router-dom";
import { useMemberRegistration } from "../hooks/useMemberRegistration";
import DatePicker from "../components/DatePicker";
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
    handleStep1Next,
    handleRegister,
  } = useMemberRegistration();

  // Step 1: Personal Information
  if (step === 1) {
    const relationshipOptions = [
      { value: "father", label: "Father" },
      { value: "mother", label: "Mother" },
      { value: "brother", label: "Brother" },
      { value: "sister", label: "Sister" },
      { value: "spouse", label: "Spouse" },
      { value: "friend", label: "Friend" },
      { value: "other", label: "Other" },
    ];

    return (
      <div className="registration-container">
        <div className="registration-card">
          <h2>Member Registration - Step 1</h2>
          <p>Personal Information</p>

          <form onSubmit={handleStep1Next}>
            <div className="form-section">
              <h3>Who are you registering for? *</h3>
              <div className="radio-group">
                <label className={`radio-label ${formData.registeringFor === "myself" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="registeringFor"
                    value="myself"
                    checked={formData.registeringFor === "myself"}
                    onChange={handleInputChange}
                  />
                  <span className="radio-icon">👤</span>
                  <span className="radio-text">Myself</span>
                </label>
                <label className={`radio-label ${formData.registeringFor === "other" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="registeringFor"
                    value="other"
                    checked={formData.registeringFor === "other"}
                    onChange={handleInputChange}
                  />
                  <span className="radio-icon">👥</span>
                  <span className="radio-text">Other</span>
                </label>
              </div>
            </div>

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
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(date) =>
                    setFormData({ ...formData, dateOfBirth: date })
                  }
                  required
                />
              </div>
              {formData.registeringFor === "other" && (
                <div className="form-group">
                  <label>Relationship *</label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select relationship</option>
                    {relationshipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-close"
                onClick={() => navigate(-1)}
                title="Close registration"
              >
                ✕ Close
              </button>
              <button type="submit" className="btn-primary">
                Next: Address
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Membership Type
  if (step === 2) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <h2>Member Registration - Step 2</h2>
          <p>Select Membership Type</p>

          <form onSubmit={handleRegister}>
            <div className="form-section">
              <h3>Membership Type *</h3>
              {membershipTypes.length === 0 ? (
                <div className="membership-no-types">
                  <p>⚠️ No membership types available for this club.</p>
                  <p>Please contact the club administrator.</p>
                </div>
              ) : (
                <div className="membership-options">
                  {membershipTypes.map((type) => (
                    <div
                      key={type._id}
                      className={`membership-card ${formData.membershipType === type.name ? "selected" : ""}`}
                      onClick={() => setFormData({ ...formData, membershipType: type.name })}
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
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-close"
                onClick={() => navigate(-1)}
                title="Close registration"
              >
                ✕ Close
              </button>
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
                disabled={isRegistering || !formData.membershipType || membershipTypes.length === 0}
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
                onClick={() => navigate("/user/memberships")}
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
