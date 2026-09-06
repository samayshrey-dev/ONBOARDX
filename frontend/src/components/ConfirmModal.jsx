import React from 'react';

const ConfirmModal = ({ isOpen, title, message, confirmText = 'DELETE', cancelText = 'CANCEL', isDanger = true, onConfirm, onClose, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1060,
        backdropFilter: 'blur(2px)'
      }}
    >
      <div className="bg-white border border-dark rounded-1 w-100 p-4 shadow-lg" style={{ maxWidth: 460 }}>
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-dark">
          <h5 className="font-mono fw-bold mb-0 text-uppercase tracking-tight text-dark d-flex align-items-center gap-2">
            <span className="text-danger">⚠</span> {title}
          </h5>
          <button
            type="button"
            className="btn-close shadow-none"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          />
        </div>
        <p className="font-mono text-dark small mb-4" style={{ lineHeight: 1.6 }}>
          {message}
        </p>
        <div className="d-flex justify-content-end gap-2 font-mono">
          <button
            type="button"
            className="btn btn-sm btn-ox-white text-uppercase px-3 py-1.5"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isDanger ? 'btn-dark bg-black text-white' : 'btn-dark'} text-uppercase px-3 py-1.5`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
