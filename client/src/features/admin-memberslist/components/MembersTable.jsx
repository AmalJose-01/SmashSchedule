const MembersTable = ({
  members,
  isLoading,
  pagination,
  currentPage,
  onPageChange,
  onEdit,
  onDelete,
  getStatusColor,
  getStatusLabel,
}) => {
  if (isLoading) return <div className="aml-loading">Loading members...</div>;
  if (!members.length) return <div className="aml-empty">No members found.</div>;

  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <div className="aml-table-wrap">
      <table className="aml-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Type</th>
            <th>Status</th>
            <th>Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m._id}>
              <td>
                <strong>
                  {m.firstName} {m.lastName}
                </strong>
              </td>
              <td>{m.email}</td>
              <td>{m.phoneNumber || "—"}</td>
              <td>{m.membershipType}</td>
              <td>
                <span
                  className="aml-badge"
                  style={{ background: getStatusColor(m.membershipStatus) }}
                >
                  {getStatusLabel(m.membershipStatus)}
                </span>
              </td>
              <td>{fmt(m.membershipExpiryDate)}</td>
              <td className="aml-actions">
                <button className="aml-btn-edit" onClick={() => onEdit(m)}>
                  Edit
                </button>
                <button className="aml-btn-delete" onClick={() => onDelete(m)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && pagination.pages > 1 && (
        <div className="aml-pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {pagination.pages} ({pagination.total} total)
          </span>
          <button
            disabled={currentPage === pagination.pages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MembersTable;
