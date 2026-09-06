import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import DocumentCard from '../../components/DocumentCard';
import StatusBadge from '../../components/StatusBadge';

const PartnerDocuments = () => {
  const [activeApp, setActiveApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchDocumentsData();
  }, []);

  const fetchDocumentsData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const appsRes = await axios.get('/onboarding/applications/');
      const appsList = appsRes.data.results || appsRes.data || [];
      if (appsList.length > 0) {
        const app = appsList[0];
        setActiveApp(app);
        const docsRes = await axios.get(`/documents/application/${app.id}/`);
        setDocuments(docsRes.data || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load document checklist.");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (docItem, file) => {
    setSuccessMsg('');
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);

    const checklistItemId = docItem.checklist_item || docItem.id;
    try {
      await axios.post(`/documents/items/${checklistItemId}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg(`Uploaded "${file.name}" successfully!`);
      const docsRes = await axios.get(`/documents/application/${activeApp.id}/`);
      setDocuments(docsRes.data || []);
    } catch (err) {
      throw err;
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'APPROVED') return doc.status === 'APPROVED';
    if (filterStatus === 'IN_REVIEW') return doc.status === 'UPLOADED' || doc.status === 'UNDER_REVIEW';
    if (filterStatus === 'ATTENTION') return doc.status === 'REJECTED' || (doc.is_mandatory && doc.status === 'NOT_UPLOADED');
    if (filterStatus === 'WAITING') return doc.status === 'NOT_UPLOADED';
    return true;
  });

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING COMPLIANCE DOCUMENTS...
      </div>
    );
  }

  if (!activeApp) {
    return (
      <div className="p-5 border border-dark bg-white text-center my-4 rounded-1">
        <h3 className="ox-section-title mb-2">NO ACTIVE APPLICATION</h3>
        <p className="font-mono text-muted small mb-0">Create an onboarding application to view checklist requirements.</p>
      </div>
    );
  }

  return (
    <div className="pb-5 animate-fade-in-up">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="ox-section-title mb-0">DOCUMENT CHECKLIST</h2>
            <StatusBadge status={activeApp.status} />
          </div>
          <p className="font-mono text-muted small mb-0">
            BLUEPRINT REQUIREMENTS FOR {activeApp.blueprint_details?.title?.toUpperCase()}.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="d-flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: 'ALL REQUIREMENTS' },
            { key: 'ATTENTION', label: '! NEEDS ATTENTION' },
            { key: 'IN_REVIEW', label: '◐ IN REVIEW' },
            { key: 'APPROVED', label: '● VERIFIED' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`btn btn-sm font-mono text-uppercase ${filterStatus === f.key ? 'btn-ox-black' : 'btn-ox-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 border border-dark bg-dark text-white font-mono small">
          ERROR: {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 border border-dark bg-light font-mono text-dark small fw-bold">
          ● {successMsg}
        </div>
      )}

      {/* Grid Layout of Document Cards */}
      {filteredDocuments.length === 0 ? (
        <div className="p-5 border border-dark bg-white font-mono text-center text-muted small rounded-1">
          NO DOCUMENTS YET. Upload your first required document to continue.
        </div>
      ) : (
        <div className="row g-4">
          {filteredDocuments.map((docItem) => (
            <div key={docItem.id} className="col-12 col-md-6 col-xl-4">
              <DocumentCard
                documentItem={docItem}
                onUploadSuccess={handleDocumentUpload}
                isEditable={activeApp.is_editable}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerDocuments;
