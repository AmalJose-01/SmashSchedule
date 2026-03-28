import { useUserMembership } from "../hooks/useUserMembership.js";
import Navbar from "../../../components/Navbar.jsx";
import "./UserMembershipHome.css";

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: { label: "Active", cls: "um-badge-active" },
    PENDING_VERIFICATION: { label: "Pending Verification", cls: "um-badge-pending" },
    EXPIRED: { label: "Expired", cls: "um-badge-expired" },
    SUSPENDED: { label: "Suspended", cls: "um-badge-suspended" },
  };
  const { label, cls } = map[status] || { label: status, cls: "um-badge-default" };
  return <span className={`um-badge ${cls}`}>{label}</span>;
};

const UserMembershipHome = () => {
  const {
    memberships,
    isLoading,
    error,
    refetch,
    handleAddMembership,
    handleViewDetails,
    isExpired,
    isExpiringSoon,
  } = useUserMembership();

  return (
    <div className="um-container">
      <div className="sticky top-0 z-50 bg-white shadow">
        <Navbar />
      </div>

      <div className="um-content">
        <div className="um-page-header">
          <div>
            <h1>My Memberships</h1>
            <p>Manage your club memberships</p>
          </div>
          <button className="um-add-btn" onClick={handleAddMembership}>
            + Add Membership
          </button>
        </div>

        {isLoading ? (
          <div className="um-loading">Loading your memberships...</div>
        ) : error ? (
          <div className="um-error">
            <p>Failed to load memberships. Please try again.</p>
            <button className="um-add-btn" onClick={() => refetch()}>Retry</button>
          </div>
        ) : memberships.length === 0 ? (
          <div className="um-empty">
            <div className="um-empty-icon">🏸</div>
            <h2>No memberships yet</h2>
            <p>Join a club to get started with your membership.</p>
            <button className="um-add-btn" onClick={handleAddMembership}>
              Find a Club
            </button>
          </div>
        ) : (
          <div className="um-list">
            {memberships.map((m) => {
              const expired = isExpired(m.membershipExpiryDate);
              const expiringSoon = isExpiringSoon(m.membershipExpiryDate);
              const clubName = m.clubId?.name || "Unknown Club";
              const clubLogo = m.clubId?.logo;
              const clubCity = m.clubId?.location?.city;
              const clubInitial = clubName[0].toUpperCase();

              return (
                <div key={m._id} className={`um-card ${expired ? "um-card-expired" : ""}`}>
                  {/* Club header */}
                  <div className="um-card-header">
                    {clubLogo ? (
                      <img src={clubLogo} alt={clubName} className="um-club-logo" />
                    ) : (
                      <div className="um-club-avatar">{clubInitial}</div>
                    )}
                    <div className="um-club-info">
                      <h3>{clubName}</h3>
                      {clubCity && <p>📍 {clubCity}{m.clubId?.location?.state ? `, ${m.clubId.location.state}` : ""}</p>}
                    </div>
                    <StatusBadge status={m.membershipStatus} />
                  </div>

                  {/* Membership details */}
                  <div className="um-card-body">
                    <div className="um-detail-row">
                      <div className="um-detail">
                        <label>Member</label>
                        <span>{m.firstName} {m.lastName}</span>
                      </div>
                      <div className="um-detail">
                        <label>Type</label>
                        <span>{m.membershipType}</span>
                      </div>
                    </div>

                    <div className="um-detail-row">
                      <div className="um-detail">
                        <label>Joined</label>
                        <span>{m.membershipStartDate ? new Date(m.membershipStartDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="um-detail">
                        <label>Expires</label>
                        <span className={expired ? "um-text-red" : expiringSoon ? "um-text-amber" : ""}>
                          {m.membershipExpiryDate ? new Date(m.membershipExpiryDate).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </div>

                    {m.latestMembership?.membershipPrice !== undefined && (
                      <div className="um-detail-row">
                        <div className="um-detail">
                          <label>Amount Paid</label>
                          <span>${m.latestMembership.membershipPrice}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {expired && (
                    <div className="um-warning um-warning-red">
                      ⚠️ Your membership has expired. View details to renew.
                    </div>
                  )}
                  {!expired && expiringSoon && (
                    <div className="um-warning um-warning-amber">
                      ⏰ Expires in {Math.ceil((new Date(m.membershipExpiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days.
                    </div>
                  )}
                  {m.membershipStatus === "PENDING_VERIFICATION" && (
                    <div className="um-warning um-warning-blue">
                      📄 Document verification pending. Upload your document to activate.
                    </div>
                  )}

                  {/* Actions */}
                  <div className="um-card-footer">
                    <button className="um-btn-details" onClick={() => handleViewDetails(m)}>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMembershipHome;
