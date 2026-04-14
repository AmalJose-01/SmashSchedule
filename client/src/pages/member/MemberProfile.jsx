import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMemberProfileAPI,
  updateMemberProfileAPI,
  renewMembershipAPI,
  getMembershipHistoryAPI,
} from "../../features/membership/users/services/membershipService";
import "./MemberProfile.css";

const MemberProfile = () => {
  const { memberId } = useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Fetch member profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["memberProfile", memberId],
    queryFn: () => getMemberProfileAPI(memberId),
  });

  // Fetch membership history
  const { data: historyData } = useQuery({
    queryKey: ["membershipHistory", memberId],
    queryFn: () => getMembershipHistoryAPI(memberId),
  });

  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data) => updateMemberProfileAPI(memberId, data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["memberProfile", memberId] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Update failed");
    },
  });

  // Renewal mutation
  const { mutate: renewMembership, isPending: isRenewing } = useMutation({
    mutationFn: () => renewMembershipAPI(memberId),
    onSuccess: () => {
      toast.success("Membership renewed successfully");
      queryClient.invalidateQueries({ queryKey: ["memberProfile", memberId] });
      queryClient.invalidateQueries({ queryKey: ["membershipHistory", memberId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Renewal failed");
    },
  });

  const member = profileData?.member;
  const membership = profileData?.membership;
  const history = historyData?.history || [];

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "green",
      PENDING_VERIFICATION: "orange",
      EXPIRED: "red",
      SUSPENDED: "red",
      CANCELLED: "gray",
    };
    return colors[status] || "gray";
  };

  const getStatusLabel = (status) => {
    const labels = {
      ACTIVE: "Active",
      PENDING_VERIFICATION: "Pending Verification",
      EXPIRED: "Expired",
      SUSPENDED: "Suspended",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  const isExpired = member?.membershipStatus === "EXPIRED";
  const isExpiringSoon = () => {
    if (!member?.membershipExpiryDate) return false;
    const expiryDate = new Date(member.membershipExpiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="member-profile-container">
      <div className="profile-header">
        <div className="header-content">
          <h1>Member Profile</h1>
          <p>Manage your membership and personal information</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Personal Information</h2>
            <button
              className="btn-edit"
              onClick={() => {
                setEditData(member || {});
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile(editData);
              }}
            >
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editData.phoneNumber || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, phoneNumber: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Street</label>
                <input
                  type="text"
                  value={editData.address?.street || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      address: { ...editData.address, street: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={editData.address?.city || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        address: { ...editData.address, city: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={editData.address?.state || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        address: { ...editData.address, state: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={isUpdating} className="btn-primary">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">
                  {member?.firstName} {member?.lastName}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{member?.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone:</span>
                <span className="value">{member?.phoneNumber}</span>
              </div>
              <div className="info-row">
                <span className="label">Age:</span>
                <span className="value">{member?.age}</span>
              </div>
              <div className="info-row">
                <span className="label">Address:</span>
                <span className="value">
                  {member?.address?.street}, {member?.address?.city},{" "}
                  {member?.address?.state} {member?.address?.zipCode}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Membership Card */}
        <div className="membership-card">
          <h2>Membership Details</h2>
          <div className="membership-info">
            <div className="info-item">
              <span className="label">Type:</span>
              <span className="value">{member?.membershipType}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span
                className={`status ${getStatusColor(member?.membershipStatus)}`}
              >
                {getStatusLabel(member?.membershipStatus)}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Start Date:</span>
              <span className="value">
                {new Date(member?.membershipStartDate).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Expiry Date:</span>
              <span className="value">
                {new Date(member?.membershipExpiryDate).toLocaleDateString()}
                {isExpiringSoon() && (
                  <span className="warning"> ⚠️ Expiring Soon</span>
                )}
              </span>
            </div>
            {member?.isVerified && (
              <div className="info-item">
                <span className="label">Verification:</span>
                <span className="value verified">✓ Verified</span>
              </div>
            )}
          </div>

          {(isExpired || isExpiringSoon()) && (
            <button
              className="btn-primary btn-renew"
              onClick={() => renewMembership()}
              disabled={isRenewing}
            >
              {isRenewing ? "Renewing..." : "Renew Membership"}
            </button>
          )}
        </div>

        {/* History Card */}
        <div className="history-card">
          <h2>Membership History</h2>
          {history.length > 0 ? (
            <div className="history-list">
              {history.map((record) => (
                <div key={record._id} className="history-item">
                  <div className="history-header">
                    <span className="date">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`status ${getStatusColor(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                  </div>
                  <div className="history-details">
                    <p>
                      <strong>${record.membershipPrice}</strong> - Expires:{" "}
                      {new Date(record.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No membership history</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
