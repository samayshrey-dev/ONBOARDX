import React, { useState } from 'react';

const DocumentCard = ({ documentItem, onUploadSuccess, isEditable }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const docName = documentItem.document_name || documentItem.checklist_item_name || 'Document Requirement';
  const isMandatory = documentItem.is_mandatory ?? true;
  const status = documentItem.status || 'NOT_UPLOADED';
  const isReplaceable = documentItem.is_replaceable ?? (status !== 'APPROVED');
  const reviewerComment = documentItem.reviewer_comment;
  const uploadedAt = documentItem.uploaded_at ? new Date(documentItem.uploaded_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : null;

  const getStatusConfig = (st) => {
    switch (st) {
      case 'APPROVED':
      case 'VERIFIED':
        return { symbol: '●', label: 'VERIFIED', bg: '#000000', color: '#FFFFFF' };
      case 'UPLOADED':
      case 'UNDER_REVIEW':
        return { symbol: '◐', label: 'IN REVIEW', bg: '#FFFFFF', color: '#000000' };
      case 'REJECTED':
      case 'CORRECTION_REQUIRED':
        return { symbol: '!', label: 'NEEDS ATTENTION', bg: '#1E1E22', color: '#FFFFFF' };
      case 'NOT_UPLOADED':
      default:
        return { symbol: '○', label: 'WAITING', bg: '#F4F4F5', color: '#64646E' };
    }
  };

  const statusConfig = getStatusConfig(status);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Select a file to upload.');
      return;
    }
    setErrorMsg('');
    setUploading(true);

    try {
      await onUploadSuccess(documentItem, selectedFile);
      setSelectedFile(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="p-3.5 h-100 d-flex flex-column justify-content-between transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E4E4E7',
        borderRadius: '4px'
      }}
    >
      <div>
        {/* Document Header & Status Pill */}
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2 pb-2 border-bottom border-dark">
          <div>
            <div className="fw-bold text-dark fs-6 mb-0">
              {docName}
            </div>
            <div className="font-mono text-uppercase text-muted" style={{ fontSize: '0.6875rem' }}>
              {isMandatory ? 'REQUIRED' : 'OPTIONAL'}
            </div>
          </div>

          <span
            className="font-mono px-2 py-0.5 flex-shrink-0"
            style={{
              backgroundColor: statusConfig.bg,
              color: statusConfig.color,
              border: '1px solid #000000',
              borderRadius: '2px',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}
          >
            {statusConfig.symbol} {statusConfig.label}
          </span>
        </div>

        {documentItem.description && (
          <p className="text-secondary small mb-2" style={{ fontSize: '0.8rem', lineHeight: 1.35 }}>
            {documentItem.description}
          </p>
        )}

        {/* Upload File State */}
        {documentItem.file_name ? (
          <div className="p-2.5 mb-2 border bg-light rounded-1 font-mono">
            <div className="d-flex align-items-center justify-content-between">
              <div className="overflow-hidden me-2">
                <div className="fw-bold text-dark text-truncate small" title={documentItem.file_name}>
                  {documentItem.file_name}
                </div>
                <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                  {documentItem.file_size ? `${(documentItem.file_size / 1024).toFixed(1)} KB` : 'Uploaded'}
                  {uploadedAt && ` • ${uploadedAt}`}
                </div>
              </div>
              {documentItem.file_url && (
                <a
                  href={documentItem.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-ox-white font-mono px-2 py-1 text-decoration-none text-nowrap"
                  style={{ fontSize: '0.6875rem' }}
                >
                  VIEW →
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 mb-2 text-center border border-dashed bg-light rounded-1 font-mono text-muted small">
            NO FILE ATTACHED
          </div>
        )}

        {/* Reviewer Comment Warning Callout */}
        {reviewerComment && (
          <div className="p-2.5 mb-2 border border-dark bg-dark text-white rounded-1 font-mono">
            <div className="small opacity-75 fw-bold mb-0.5">FEEDBACK:</div>
            <div className="small opacity-90">"{reviewerComment}"</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2 mb-2 border border-dark bg-dark text-white small font-mono">
            ERROR: {errorMsg}
          </div>
        )}
      </div>

      {/* Upload/Replace Form */}
      {isEditable && isReplaceable && (
        <form onSubmit={handleUploadSubmit} className="mt-2 border-top pt-2">
          <div className="mb-2">
            <input
              type="file"
              className="form-control form-control-sm font-mono"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-ox-black font-mono w-100 py-1.5 text-center"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'UPLOADING...' : (documentItem.file_name ? 'REPLACE DOCUMENT →' : 'UPLOAD DOCUMENT →')}
          </button>
        </form>
      )}
    </div>
  );
};

export default DocumentCard;
