const DeleteConfirmModal = ({ member, onConfirm, onCancel, isDeleting }) => {
  if (!member) return null;

  return (
    <div className="aml-modal-overlay" onClick={onCancel}>
      <div className="aml-modal aml-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="aml-modal-header">
          <h2>Delete Member</h2>
          <button className="aml-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div className="aml-modal-body">
          <p className="aml-confirm-text">
            Are you sure you want to delete{" "}
            <strong>
              {member.firstName} {member.lastName}
            </strong>
            ? This will permanently remove their membership record and cannot be
            undone.
          </p>
        </div>
        <div className="aml-modal-footer">
          <button className="aml-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="aml-btn-delete-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
