import React from "react";
import { useMembershipTypeManagement } from "../hooks/useMembershipTypeManagement";
import Dropdown from "../../../../components/Dropdown";
import "./MembershipTypeManagement.css";

const MembershipTypeManagement = () => {
  const {
    showForm,
    setShowForm,
    editingType,
    formData,
    membershipTypes,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
  } = useMembershipTypeManagement();

  const docTypeOptions = [
    { value: "STUDENT_ID", label: "Student ID" },
    { value: "GOVERNMENT_ID", label: "Government ID" },
    { value: "VETERAN_PROOF", label: "Veteran Proof" },
  ];

  if (isLoading) {
    return <div className="loading">Loading membership types...</div>;
  }

  return (
    <div className="membership-type-management">
      <div className="management-header">
        <h2>Membership Type Management</h2>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add New Type"}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <h3>{editingType ? "Edit Membership Type" : "Create New Membership Type"}</h3>
          <form onSubmit={handleSubmit} className="membership-form">
            <div className="form-row">
              <div className="form-group">
                <label>Type Name (Internal) *</label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={editingType ? true : false}
                  required
                >
                  <option value="">-- Select Type --</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="VETERAN">VETERAN</option>
                </select>
              </div>
              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g., Standard Member"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Annual Price (AUD) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 99.99"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Discount Percentage (%)</label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter membership type description"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Validity Period (Months)</label>
                <input
                  type="number"
                  name="validityMonths"
                  value={formData.validityMonths}
                  onChange={handleInputChange}
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
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
              <div className="form-group">
                <label>Required Document Types</label>
                <div className="checkbox-group">
                  {docTypeOptions.map((option) => (
                    <label key={option.value}>
                      <input
                        type="checkbox"
                        name="requiredDocumentType"
                        value={option.value}
                        checked={formData.requiredDocumentType?.includes(
                          option.value
                        )}
                        onChange={handleInputChange}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="types-list">
        <h3>Existing Membership Types</h3>
        {membershipTypes.length === 0 ? (
          <p className="no-data">No membership types found. Create one to get started.</p>
        ) : (
          <div className="types-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Display Name</th>
                  <th>Price (AUD)</th>
                  <th>Discount</th>
                  <th>Validity</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {membershipTypes.map((type) => (
                  <tr key={type._id}>
                    <td>{type.name}</td>
                    <td>{type.displayName}</td>
                    <td>A${type.price.toFixed(2)}</td>
                    <td>{type.discountPercentage}%</td>
                    <td>{type.validityMonths} months</td>
                    <td>
                      {type.requiresDocumentVerification ? (
                        <span className="badge-warning">Required</span>
                      ) : (
                        <span className="badge-info">Not Required</span>
                      )}
                    </td>
                    <td className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(type)}
                        disabled={isUpdating}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(type._id)}
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipTypeManagement;
