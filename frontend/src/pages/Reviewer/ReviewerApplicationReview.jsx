import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import ActivityTimeline from '../../components/ActivityTimeline';

const ReviewerApplicationReview = () => {
  const { id: appId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);

  const [reviewerComment, setReviewerComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchReviewData();
  }, [appId]);

  const fetchReviewData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const appRes = await axios.get(`/onboarding/applications/${appId}/`);
      setApplication(appRes.data);

      const docsRes = await axios.get(`/documents/application/${appId}/`);
      const docsList = docsRes.data || [];
      setDocuments(docsList);

      if (docsList.length > 0) {
        const pendingDoc = docsList.find(d => d.status === 'UPLOADED' || d.status === 'UNDER_REVIEW') || docsList[0];
        setActiveDoc(pendingDoc);
        setReviewerComment(pendingDoc.reviewer_comment || '');
      }

      const actRes = await axios.get(`/activity/applications/${appId}/`);
      setActivities(actRes.data || []);
    } catch (err) {
      console.error("Error fetching application for review:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load application for review.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (doc) => {
    setActiveDoc(doc);
    setReviewerComment(doc.reviewer_comment || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleReviewDecision = async (decisionStatus) => {
    if (!activeDoc) return;

    if (decisionStatus === 'REJECTED' && !reviewerComment.trim()) {
      setErrorMsg("A feedback comment is strictly required when requesting changes.");
      addToast("Feedback comment required to request changes", "error");
      return;
    }

    setReviewing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axios.patch(`/documents/${activeDoc.id}/review/`, {
        status: decisionStatus,
        reviewer_comment: reviewerComment.trim(),
      });

      const actionText = decisionStatus === 'APPROVED' ? 'Document approved' : 'Changes requested';
      addToast(`${actionText} for ${activeDoc.document_name}`);

      const appRes = await axios.get(`/onboarding/applications/${appId}/`);
      setApplication(appRes.data);

      const docsRes = await axios.get(`/documents/application/${appId}/`);
      const updatedDocs = docsRes.data || [];
      setDocuments(updatedDocs);

      const updatedActive = updatedDocs.find(d => d.id === activeDoc.id);
      if (updatedActive) {
        setActiveDoc(updatedActive);
        setReviewerComment(updatedActive.reviewer_comment || '');
      }

      const actRes = await axios.get(`/activity/applications/${appId}/`);
      setActivities(actRes.data || []);

    } catch (err) {
      console.error("Review decision error:", err);
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to record review decision.";
      setErrorMsg(msg);
      addToast(msg, "error");
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING REVIEW WORKSPACE...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-5 border border-dark bg-white text-center font-mono text-muted">
        APPLICATION NOT FOUND.
        <div className="mt-3">
          <Link to="/reviewer" className="btn btn-ox-black font-mono text-uppercase">
            RETURN TO QUEUE →
          </Link>
        </div>
      </div>
    );
  }

  const totalMandatory = documents.filter(d => d.is_mandatory).length;
  const approvedMandatory = documents.filter(d => d.is_mandatory && d.status === 'APPROVED').length;

  return (
    <div className="pb-5 animate-fade-in-up">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/reviewer" className="btn btn-sm btn-ox-white font-mono text-uppercase px-2.5 py-1 text-nowrap me-2">
              ← QUEUE
            </Link>
            <h2 className="ox-section-title mb-0">{application.business_name}</h2>
            <span className="font-mono small border border-dark px-2 py-0.5">
              {application.application_number}
            </span>
            <StatusBadge status={application.status} />
          </div>
          <p className="font-mono text-muted small mb-0">
            BLUEPRINT: <strong className="text-dark">{application.blueprint_details?.title}</strong> • SUBMITTED BY: <strong className="text-dark">{application.partner_name}</strong>
          </p>
        </div>

        <div className="font-mono border border-dark bg-white px-3 py-1.5 rounded-1 text-uppercase small fw-bold">
          VERIFIED: {approvedMandatory} / {totalMandatory} MANDATORY
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

      {/* Document Selector Bar */}
      <div className="p-3 mb-4 border border-dark bg-white rounded-1">
        <div className="font-mono text-uppercase text-muted small fw-bold mb-2">
          CHECKLIST DOCUMENTS ({documents.length})
        </div>
        <div className="d-flex flex-wrap gap-2">
          {documents.map((doc) => {
            const isSelected = activeDoc && activeDoc.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                className={`btn btn-sm font-mono text-uppercase ${
                  isSelected ? 'btn-ox-black' : 'btn-ox-white'
                }`}
              >
                <span>{doc.document_name}</span>
                {doc.is_mandatory && <span className="ms-1">*</span>}
                <span className="ms-2 font-mono" style={{ fontSize: '0.7rem' }}>
                  {doc.status === 'APPROVED' ? '[●]' : doc.status === 'REJECTED' ? '[!]' : '[○]'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TWO-PANEL DOCUMENT REVIEW EXPERIENCE */}
      {activeDoc && (
        <div className="row g-4 mb-4">
          {/* LEFT PANEL: Document Preview */}
          <div className="col-lg-7">
            <div className="p-4 border border-dark bg-white h-100 rounded-1 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between border-bottom border-dark pb-2 mb-3">
                  <div>
                    <div className="font-mono text-uppercase text-muted small">DOCUMENT REQUIREMENT</div>
                    <div className="font-mono fw-bold text-dark fs-5 text-uppercase">{activeDoc.document_name}</div>
                  </div>
                  {activeDoc.file_url && (
                    <a
                      href={activeDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-ox-white font-mono text-uppercase"
                    >
                      OPEN FILE →
                    </a>
                  )}
                </div>

                {activeDoc.file_url ? (
                  <div className="border border-dark bg-dark d-flex align-items-center justify-content-center mb-3 rounded-1" style={{ minHeight: 380, maxHeight: 500 }}>
                    {activeDoc.file_type && ['.jpg', '.jpeg', '.png'].includes(activeDoc.file_type.toLowerCase()) ? (
                      <img src={activeDoc.file_url} alt={activeDoc.document_name} className="img-fluid object-fit-contain" style={{ maxHeight: 450 }} />
                    ) : (
                      <iframe src={activeDoc.file_url} title={activeDoc.document_name} className="w-100 vh-50 border-0"></iframe>
                    )}
                  </div>
                ) : (
                  <div className="p-5 text-center border border-dashed border-dark bg-light font-mono text-muted mb-3">
                    NO DOCUMENT FILE UPLOADED YET
                  </div>
                )}

                <div className="p-3 border border-dark bg-light font-mono text-dark small">
                  <div>FILE NAME: <strong>{activeDoc.file_name || 'NONE'}</strong></div>
                  <div>UPLOADED: <strong>{activeDoc.uploaded_at ? new Date(activeDoc.uploaded_at).toLocaleString() : 'NOT UPLOADED'}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Review Actions & Feedback */}
          <div className="col-lg-5">
            <div className="p-4 border border-dark bg-white h-100 rounded-1 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between border-bottom border-dark pb-2 mb-3">
                  <h4 className="font-mono fw-bold text-uppercase small text-dark mb-0">
                    DECISION & FEEDBACK
                  </h4>
                  <span className="font-mono small border border-dark px-2 py-0.5">
                    {activeDoc.status}
                  </span>
                </div>

                <div className="mb-4 font-mono">
                  <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                    REVIEWER FEEDBACK COMMENT
                  </label>
                  <textarea
                    rows="4"
                    className="form-control font-mono"
                    placeholder="Enter review feedback..."
                    value={reviewerComment}
                    onChange={(e) => setReviewerComment(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons (Strictly Monochrome) */}
              <div className="d-flex flex-column gap-3 mt-3">
                <button
                  onClick={() => handleReviewDecision('APPROVED')}
                  disabled={reviewing || !activeDoc.file_name}
                  className="btn btn-ox-black font-mono text-uppercase py-3"
                >
                  {reviewing ? 'RECORDING...' : '● APPROVE DOCUMENT'}
                </button>

                <button
                  onClick={() => handleReviewDecision('REJECTED')}
                  disabled={reviewing || !activeDoc.file_name}
                  className="btn btn-ox-white font-mono text-uppercase py-3 border-dark"
                >
                  {reviewing ? 'RECORDING...' : '! REQUEST CHANGES'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Activity Stream */}
      <div className="p-4 border border-dark bg-white rounded-1">
        <h4 className="font-mono fw-bold text-uppercase small text-dark mb-3 border-bottom border-dark pb-2">
          AUDIT LOG HISTORY
        </h4>
        <ActivityTimeline activities={activities} />
      </div>
    </div>
  );
};

export default ReviewerApplicationReview;
