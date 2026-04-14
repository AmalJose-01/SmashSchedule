import React from "react";
import { useMembershipType } from "../hooks/useMembershipType";
import "./MembershipTypeManagement.css";

const TYPE_OPTIONS = ["STANDARD", "STUDENT", "VETERAN"];
const DOC_TYPE_OPTIONS = ["STUDENT_ID", "GOVERNMENT_ID", "VETERAN_PROOF"];

const MembershipTypeManagement = () => {
  const {
    types,
    isLoading,
    showForm,
    editingType,
    formData,
    isCreating,
    isUpdating,
    isDeleting,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseForm,
    handleInputChange,
    handleDocTypeToggle,
    handleSubmit,
    handleDelete,
    handleToggleActive,
  } = useMembershipType();

  return (
    <div className="mt-container">
      {/* Header */}
      <div className="mt-header">
        <div>
          <h1>Membership Types</h1>
          <p>Create and manage membership tiers shown during user registration</p>
        </div>
        <button className="btn-create" onClick={handleOpenCreate}>
          + Add Membership Type
        </button>
      </div>

      {/* Type Cards */}
      {isLoading ? (
        <div className="mt-loading">Loading membership types...</div>
      ) : (
        <div className="mt-grid">
          {types.length === 0 ? (
            <div className="mt-empty">
              <p>No membership types yet. Create one to get started.</p>
              <button className="btn-create" onClick={handleOpenCreate}>
                + Add First Type
              </button>
            </div>
          ) : (
            types.map((type) => (
              <div key={type._id} className={`mt-card ${!type.isActive ? "inactive" : ""}`}>
                <div className="mt-card-header">
                  <div className="mt-card-title">
                    <h3>{type.displayName}</h3>
                    <span className="mt-type-badge">{type.name}</span>
                  </div>
                  <span className={`mt-status-badge ${type.isActive ? "active" : "inactive"}`}>
                    {type.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-card-price">
                  A${type.price}
                  <span>/year</span>
                  {type.discountPercentage > 0 && (
                    <span className="mt-discount">{type.discountPercentage}% off</span>
                  )}
                </p>

                {type.description && (
                  <p className="mt-card-description">{type.description}</p>
                )}

                <div className="mt-card-meta">
                  <div className="mt-meta-row">
                    <span className="label">Validity</span>
                    <span>{type.validityMonths} months</span>
                  </div>
                  <div className="mt-meta-row">
                    <span className="label">Verification</span>
                    <span
                      className={`mt-verification-badge ${
                        type.requiresDocumentVerification ? "required" : "not-required"
                      }`}
                    >
                      {type.requiresDocumentVerification ? "Required" : "Not Required"}
                    </span>
                  </div>
                  {type.requiresDocumentVerification &&
                    type.requiredDocumentType?.length > 0 && (
                      <div className="mt-meta-row">
                        <span className="label">Documents</span>
                        <div className="mt-doc-types">
                          {type.requiredDocumentType.map((doc) => (
                            <span key={doc} className="mt-doc-chip">
                              {doc.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="mt-card-actions">
                  <button className="btn-edit" onClick={() => handleOpenEdit(type)}>
                    Edit
                  </button>
                  <button
                    className={`btn-toggle ${type.isActive ? "deactivate" : ""}`}
                    onClick={() => handleToggleActive(type)}
                  >
                    {type.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(type._id)}
                    disabled={isDeleting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="mt-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCloseForm()}>
          <div className="mt-modal">
            <h2>{editingType ? "Edit Membership Type" : "Create Membership Type"}</h2>

            <form className="mt-form" onSubmit={handleSubmit}>
              <div className="mt-form-row">
                <div className="mt-form-group">
                  <label>Type Name *</label>
                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingType}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-form-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Standard Membership"
                  />
                </div>
              </div>

              <div className="mt-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this membership type..."
                />
              </div>

              <div className="mt-form-row">
                <div className="mt-form-group">
                  <label>Price (A$) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="mt-form-group">
                  <label>Discount (%)</label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-form-row">
                <div className="mt-form-group">
                  <label>Validity (months)</label>
                  <input
                    type="number"
                    name="validityMonths"
                    value={formData.validityMonths}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="12"
                  />
                </div>
                <div className="mt-form-group" style={{ justifyContent: "center" }}>
                  <label>&nbsp;</label>
                  <label className="mt-checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    Active (visible in registration)
                  </label>
                </div>
              </div>

              <div className="mt-form-group">
                <label className="mt-checkbox-label">
                  <input
                    type="checkbox"
                    name="requiresDocumentVerification"
                    checked={formData.requiresDocumentVerification}
                    onChange={handleInputChange}
                  />
                  Requires Document Verification
                </label>
              </div>

              {formData.requiresDocumentVerification && (
                <div className="mt-doc-type-group">
                  <label>Required Document Types</label>
                  <div className="mt-doc-type-options">
                    {DOC_TYPE_OPTIONS.map((docType) => (
                      <label key={docType} className="mt-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.requiredDocumentType.includes(docType)}
                          onChange={() => handleDocTypeToggle(docType)}
                        />
                        {docType.replace(/_/g, " ")}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseForm}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating
                    ? "Saving..."
                    : editingType
                    ? "Save Changes"
                    : "Create Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipTypeManagement;
