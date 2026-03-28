import { useNavigate } from "react-router-dom";
import { useClubSearch } from "../hooks/useClubSearch";
import "./ClubSearch.css";

const ClubSearch = () => {
  const navigate = useNavigate();
  const selectedClubName = localStorage.getItem("selectedClubName");
  const selectedClubId = localStorage.getItem("selectedClubId");

  const {
    searchTerm,
    setSearchTerm,
    clubs,
    isLoading,
    isLocating,
    userLocation,
    handleLocateMe,
    handleClearLocation,
    handleSelectClub,
  } = useClubSearch();

  return (
    <div className="cs-container">
      <div className="cs-wrapper">
        <div className="cs-header">
          <h1>Find Your Club</h1>
          <p>Search by club name or use your location to find clubs near you</p>
        </div>

        {selectedClubId && selectedClubName && (
          <div className="cs-current-club">
            <div className="cs-current-club-info">
              <span className="cs-current-label">Currently selected</span>
              <span className="cs-current-name">{selectedClubName}</span>
            </div>
            <button className="cs-continue-btn" onClick={() => navigate("/membership")}>
              Continue →
            </button>
          </div>
        )}

        <div className="cs-search-card">
          <div className="cs-search-row">
            <input
              className="cs-search-input"
              type="text"
              placeholder="Search by club name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button
              className="cs-locate-btn"
              onClick={handleLocateMe}
              disabled={isLocating || !!userLocation}
            >
              {isLocating ? "Locating..." : "📍 Near Me"}
            </button>
          </div>

          {userLocation && (
            <div>
              <span className="cs-location-pill">
                📍 Using your location
                <button onClick={handleClearLocation} title="Clear location">✕</button>
              </span>
            </div>
          )}
        </div>

        <p className="cs-results-label">
          {isLoading
            ? "Searching..."
            : clubs.length > 0
            ? `${clubs.length} club${clubs.length !== 1 ? "s" : ""} found`
            : "All clubs"}
        </p>

        {isLoading ? (
          <div className="cs-loading">Loading clubs...</div>
        ) : clubs.length === 0 ? (
          <div className="cs-empty">
            <p>No clubs found. Try a different search term.</p>
          </div>
        ) : (
          <div className="cs-club-list">
            {clubs.map((club) => (
              <div key={club._id} className="cs-club-card" onClick={() => handleSelectClub(club)}>
                {club.logo ? (
                  <img src={club.logo} alt={club.name} className="cs-club-logo" />
                ) : (
                  <div className="cs-club-avatar">
                    {(club.name || "?")[0].toUpperCase()}
                  </div>
                )}

                <div className="cs-club-info">
                  <h3>{club.name}</h3>
                  <p>
                    📍{" "}
                    {[club.location?.city, club.location?.state, club.location?.country]
                      .filter(Boolean)
                      .join(", ") || "Location not specified"}
                  </p>
                </div>

                <button
                  className="cs-select-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectClub(club);
                  }}
                >
                  Join →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubSearch;
