import { useState, useEffect } from "react";

const STATUSES = ["ACTIVE", "PENDING_VERIFICATION", "EXPIRED", "SUSPENDED", "CANCELLED"];

const EditMemberModal = ({ member, onSave, onCancel, isUpdating }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    membershipType: "",
    membershipStatus: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        phoneNumber: member.phoneNumber || "",
        membershipType: member.membershipType || "",
        membershipStatus: member.membershipStatus || "",
      });
    }
  }, [member]);

  if (!member) return null;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(member._id, form);
  };

  return (
    <div className="aml-modal-overlay" onClick={onCancel}>
      <div className="aml-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aml-modal-header">
          <h2>Edit Member</h2>
          <button className="aml-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <form className="aml-modal-body" onSubmit={handleSubmit}>
          <div className="aml-form-row">
            <div className="aml-form-field">
              <label>First Name</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="aml-form-field">
              <label>Last Name</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="aml-form-row">
            <div className="aml-form-field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="aml-form-field">
              <label>Phone</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="aml-form-row">
            <div className="aml-form-field">
              <label>Membership Type</label>
              <input
                name="membershipType"
                value={form.membershipType}
                onChange={handleChange}
              />
            </div>
            <div className="aml-form-field">
              <label>Status</label>
              <select
                name="membershipStatus"
                value={form.membershipStatus}
                onChange={handleChange}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="aml-modal-footer">
            <button type="button" className="aml-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="aml-btn-save" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;
