import React from "react";

const AlertView = ({
  isOpen,
  title = "Are you sure?",
  message = "Do you want to continue?",
  confirmText = "YES",
  cancelText = "NO",
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {title}
        </h2>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex justify-center gap-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-white transition
              ${danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"}
              disabled:opacity-60`}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertView;
