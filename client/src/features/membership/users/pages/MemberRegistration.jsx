import { useNavigate } from "react-router-dom";
import { useMemberRegistration } from "../hooks/useMemberRegistration";
import DatePicker from "../components/DatePicker";
import AddressSearch from "../../../../components/AddressSearch";
import ClubSearch from "../../../club-profile/users/pages/ClubSearch";
import { toast } from "sonner";
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

  // Step 2: Address Detail
  if (step === 2) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <h2>Member Registration - Step 2</h2>
          <p>Address Detail</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zipCode) {
              toast.error("Please select a complete address");
              return;
            }
            setStep(3);
          }}>
            <div className="form-section">
              <h3>Your Address *</h3>

              <AddressSearch
                onAddressSelect={(addressData) => {
                  setFormData({
                    ...formData,
                    address: {
                      street: addressData.fullStreet || addressData.address || formData.address.street,
                      city: addressData.city || formData.address.city,
                      state: addressData.state || formData.address.state,
                      zipCode: addressData.zipCode || formData.address.zipCode,
                      country: addressData.country || formData.address.country,
                    },
                  });
                }}
              />

              {formData.address.street && (
                <div className="form-row" style={{ marginTop: "20px" }}>
                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      name="address_street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Street"
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
              )}

              {formData.address.state && (
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
                    <label>Zip Code</label>
                    <input
                      type="text"
                      name="address_zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      placeholder="Zip Code"
                    />
                  </div>
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
              <button type="submit" className="btn-primary">
                Next: Select Club
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Search Club and Select Membership Type
  if (step === 3) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <h2>Member Registration - Step 3</h2>
          <p>Search Club and Select Membership Type</p>

          <form onSubmit={handleRegister}>
            <div className="form-section">
              <h3>Club Information *</h3>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
                Search for the club you want to join. You can search by club name or use your location.
              </p>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <ClubSearch />
            </div>

            <div className="form-section">
              <h3>Membership Type *</h3>
              {membershipTypes.length === 0 ? (
                <div className="membership-no-types">
                  <p>⚠️ No membership types available for this club.</p>
                  <p>Please select a club first or contact the club administrator.</p>
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
                onClick={() => setStep(2)}
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
};

export default MemberRegistration;
