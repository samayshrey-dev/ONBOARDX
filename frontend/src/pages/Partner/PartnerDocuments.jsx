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
      const appsList = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.results && Array.isArray(appsRes.data.results) ? appsRes.data.results : []);
      if (appsList.length > 0) {
        const app = appsList[0];
        setActiveApp(app);
        const docsRes = await axios.get(`/documents/application/${app.id}/`);
        const docsList = Array.isArray(docsRes.data) ? docsRes.data : [];
        setDocuments(docsList);
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
      const docsList = Array.isArray(docsRes.data) ? docsRes.data : [];
      setDocuments(docsList);
    } catch (err) {
      throw err;
    }
  };

  const safeDocs = Array.isArray(documents) ? documents : [];

  const filteredDocuments = safeDocs.filter((doc) => {
    if (!doc) return false;
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'APPROVED') return doc.status === 'APPROVED';
    if (filterStatus === 'IN_REVIEW') return doc.status === 'UPLOADED' || doc.status === 'UNDER_REVIEW';
    if (filterStatus === 'REJECTED') return doc.status === 'REJECTED';
    if (filterStatus === 'PENDING') return doc.status === 'PENDING' || doc.status === 'NOT_UPLOADED';
    return true;
  });

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING COMPLIANCE DOCUMENT CHECKLIST...
      </div>
    );
  }

  return (
    <div className="pb-5 animate-fade-in-up">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <h1 className="ox-section-title mb-1">COMPLIANCE CHECKLIST</h1>
          <p className="font-mono text-muted small mb-0">
            UPLOAD AND TRACK VERIFICATION STATUS FOR ALL MANDATORY REGULATORY CERTIFICATES.
          </p>
        </div>

        {activeApp && <StatusBadge status={activeApp.status} />}
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

      {/* Filter Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {[
          { key: 'ALL', label: `ALL DOCUMENTS (${safeDocs.length})` },
          { key: 'PENDING', label: 'PENDING UPLOAD' },
          { key: 'IN_REVIEW', label: 'UNDER REVIEW' },
          { key: 'APPROVED', label: 'APPROVED' },
          { key: 'REJECTED', label: 'REJECTED' },
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

      {/* Documents List */}
      {!activeApp ? (
        <div className="p-4 border border-dark bg-white text-center font-mono text-muted">
          NO ACTIVE APPLICATION FOUND. PLEASE START AN APPLICATION ON THE JOURNEY PAGE.
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-4 border border-dark bg-white text-center font-mono text-muted">
          NO DOCUMENTS MATCH THE SELECTED FILTER.
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredDocuments.map((docItem) => (
            <DocumentCard
              key={docItem.id}
              documentItem={docItem}
              onUpload={(file) => handleDocumentUpload(docItem, file)}
              isEditable={activeApp.is_editable}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerDocuments;
