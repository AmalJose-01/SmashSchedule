import React from "react";
import { useAdminMembership } from "../hooks/useAdminMembership";
import "./AdminMembershipDashboard.css";

const AdminMembershipDashboard = () => {
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    stats,
    members,
    pagination,
    isMembersLoading,
    pendingDocuments,
    isPendingLoading,
    expiringMembers,
    verifyDocument,
    isVerifying,
    getStatusColor,
    getStatusLabel,
  } = useAdminMembership();

  // ========== OVERVIEW TAB ==========
  const renderOverview = () => (
    <div className="dashboard-grid">
      <div className="stat-card">
        <div className="stat-icon total">📊</div>
        <div className="stat-details">
          <h3>Total Members</h3>
          <p className="stat-number">{stats?.totalMembers || 0}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon active">✓</div>
        <div className="stat-details">
          <h3>Active Members</h3>
          <p className="stat-number">{stats?.activeMembers || 0}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon pending">⏳</div>
        <div className="stat-details">
          <h3>Pending Verification</h3>
          <p className="stat-number">{stats?.pendingVerification || 0}</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon expired">⚠️</div>
        <div className="stat-details">
          <h3>Expired Memberships</h3>
          <p className="stat-number">{stats?.expiredMembers || 0}</p>
        </div>
      </div>

      <div className="chart-section">
        <h3>Membership Type Distribution</h3>
        <div className="membership-chart">
          <div className="chart-item">
            <span>Standard Members:</span>
            <strong>{stats?.standardMembers || 0}</strong>
          </div>
          <div className="chart-item">
            <span>Student Members:</span>
            <strong>{stats?.studentMembers || 0}</strong>
          </div>
          <div className="chart-item">
            <span>Veteran Members:</span>
            <strong>{stats?.veteranMembers || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  // ========== MEMBERS TAB ==========
  const renderMembers = () => (
    <div className="members-section">
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search members (name, email, phone)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_VERIFICATION">Pending</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {isMembersLoading ? (
        <div className="loading">Loading members...</div>
      ) : (
        <>
          <div className="members-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Expiry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <strong>
                        {member.firstName} {member.lastName}
                      </strong>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.membershipType}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(
                            member.membershipStatus
                          ),
                        }}
                      >
                        {getStatusLabel(member.membershipStatus)}
                      </span>
                    </td>
                    <td>{new Date(member.membershipExpiryDate).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-view">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {pagination.pages}
              </span>
              <button
                disabled={currentPage === pagination.pages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ========== VERIFICATIONS TAB ==========
  const renderVerifications = () => (
    <div className="verifications-section">
      {isPendingLoading ? (
        <div className="loading">Loading pending documents...</div>
      ) : pendingDocuments.length === 0 ? (
        <div className="empty-state">No pending documents for verification</div>
      ) : (
        <div className="verifications-list">
          {pendingDocuments.map((doc) => (
            <div key={doc._id} className="verification-card">
              <div className="card-header">
                <h3>
                  {doc.memberId?.firstName} {doc.memberId?.lastName}
                </h3>
                <span className="doc-type">{doc.documentType.replace(/_/g, " ")}</span>
              </div>

              <div className="card-body">
                <p>
                  <strong>Email:</strong> {doc.memberId?.email}
                </p>
                <p>
                  <strong>Phone:</strong> {doc.memberId?.phoneNumber}
                </p>
                <p>
                  <strong>Uploaded:</strong>{" "}
                  {new Date(doc.uploadedDate).toLocaleDateString()}
                </p>

                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-document"
                  >
                    View Document →
                  </a>
                )}
              </div>

              <div className="card-actions">
                <button
                  className="btn-approve"
                  onClick={() =>
                    verifyDocument({
                      documentId: doc._id,
                      status: "APPROVED",
                    })
                  }
                  disabled={isVerifying}
                >
                  ✓ Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => {
                    const reason = prompt("Reason for rejection:");
                    if (reason) {
                      verifyDocument({
                        documentId: doc._id,
                        status: "REJECTED",
                        reason,
                      });
                    }
                  }}
                  disabled={isVerifying}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ========== EXPIRING TAB ==========
  const renderExpiring = () => (
    <div className="expiring-section">
      {expiringMembers.length === 0 ? (
        <div className="empty-state">No members with expiring memberships in the next 30 days</div>
      ) : (
        <div className="expiring-list">
          <h3>Members with Expiring Memberships (Next 30 Days)</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {expiringMembers.map((member) => {
                const expiryDate = new Date(member.membershipExpiryDate);
                const today = new Date();
                const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={member._id}>
                    <td>
                      <strong>
                        {member.firstName} {member.lastName}
                      </strong>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.phoneNumber}</td>
                    <td>{expiryDate.toLocaleDateString()}</td>
                    <td>
                      <span className={`days-badge ${daysLeft <= 7 ? "urgent" : ""}`}>
                        {daysLeft} days
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1>Membership Management</h1>
        <p>Manage member registrations, verifications, and renewals</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          👥 Members
        </button>
        <button
          className={`tab-button ${activeTab === "verifications" ? "active" : ""}`}
          onClick={() => setActiveTab("verifications")}
        >
          📄 Verifications {pendingDocuments.length > 0 && `(${pendingDocuments.length})`}
        </button>
        <button
          className={`tab-button ${activeTab === "expiring" ? "active" : ""}`}
          onClick={() => setActiveTab("expiring")}
        >
          ⚠️ Expiring {expiringMembers.length > 0 && `(${expiringMembers.length})`}
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "members" && renderMembers()}
        {activeTab === "verifications" && renderVerifications()}
        {activeTab === "expiring" && renderExpiring()}
      </div>
    </div>
  );
};

export default AdminMembershipDashboard;
