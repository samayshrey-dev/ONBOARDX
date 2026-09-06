import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

const ReviewerDashboard = () => {
  const [queueApplications, setQueueApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const fetchReviewQueue = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get('/onboarding/reviewer/queue/');
      setQueueApplications(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching review queue:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queueApplications.filter((app) => {
    if (filterStatus === 'ALL') return true;
    return app.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING COMPLIANCE REVIEW QUEUE...
      </div>
    );
  }

  return (
    <div className="pb-5 animate-fade-in-up">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <h1 className="ox-section-title mb-1">COMPLIANCE REVIEW QUEUE</h1>
          <p className="font-mono text-muted small mb-0">
            WHAT NEEDS YOUR ATTENTION? VERIFY SUBMITTED DOCUMENTS AND PROCESS APPLICATIONS.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="d-flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: 'ALL PENDING' },
            { key: 'SUBMITTED', label: 'SUBMITTED' },
            { key: 'UNDER_REVIEW', label: 'UNDER REVIEW' },
            { key: 'CORRECTION_REQUIRED', label: 'CORRECTION REQUIRED' },
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

      {/* Workload Header Callout */}
      <div className="p-3 mb-4 border border-dark bg-white rounded-1 d-flex align-items-center justify-content-between font-mono">
        <div>
          <span className="fw-bold text-dark me-2">● ACTIVE WORKLOAD:</span>
          <span className="text-muted">{filteredQueue.length} APPLICATION(S) AWAITING VERIFICATION.</span>
        </div>
        <button onClick={fetchReviewQueue} className="btn btn-sm btn-ox-white font-mono text-uppercase px-3">
          REFRESH QUEUE →
        </button>
      </div>

      {/* Review Applications List */}
      {filteredQueue.length === 0 ? (
        <div className="p-5 border border-dark bg-white text-center font-mono text-muted">
          NOTHING NEEDS YOUR ATTENTION. YOU'RE COMPLETELY CAUGHT UP.
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredQueue.map((app) => {
            const items = app.checklist_items || [];
            const totalMandatory = items.filter(i => i.is_mandatory).length;
            const verifiedCount = items.filter(i => i.status === 'VERIFIED' || i.status === 'APPROVED').length;

            return (
              <div
                key={app.id}
                className="p-4 border border-dark bg-white rounded-1 transition-all"
              >
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center text-white font-mono fw-bold flex-shrink-0 mt-1"
                      style={{ width: 40, height: 40, backgroundColor: '#000000', borderRadius: '2px' }}
                    >
                      ●
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h4 className="font-mono fw-bold text-dark mb-0 fs-5 text-uppercase">
                          {app.business_name || app.partner_name}
                        </h4>
                        <span className="font-mono small border border-dark px-2 py-0.5">
                          {app.application_number}
                        </span>
                      </div>
                      <div className="font-mono text-muted small">
                        BLUEPRINT: <strong className="text-dark">{app.blueprint_details?.title || 'PARTNER BLUEPRINT'}</strong> • SUBMITTED: {new Date(app.submitted_at || app.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-4 font-mono">
                    <div>
                      <div className="text-muted small">CHECKLIST VERIFIED</div>
                      <div className="fw-bold text-dark">
                        {verifiedCount} / {totalMandatory || items.length} ITEMS
                      </div>
                    </div>

                    <div>
                      <div className="text-muted small">REVIEW STATE</div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => navigate(`/reviewer/application/${app.id}`)}
                      className="btn btn-ox-black font-mono text-uppercase px-4 py-2"
                    >
                      REVIEW APPLICATION →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboard;
