const FilterBar = ({ statusFilter, searchTerm, onStatusChange, onSearch }) => {
  const filters = [
    { label: "All", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Pending", value: "PENDING_VERIFICATION" },
    { label: "Expired", value: "EXPIRED" },
  ];

  return (
    <div className="aml-filter-bar">
      <div className="aml-filter-tabs">
        {filters.map((f) => (
          <button
            key={f.value}
            className={`aml-filter-tab ${statusFilter === f.value ? "aml-filter-tab--active" : ""}`}
            onClick={() => onStatusChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <input
        className="aml-search"
        placeholder="Search name, email, phone..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

export default FilterBar;
