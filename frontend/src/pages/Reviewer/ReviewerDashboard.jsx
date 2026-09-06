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
      const queueList = Array.isArray(res.data) ? res.data : (res.data?.results && Array.isArray(res.data.results) ? res.data.results : []);
      setQueueApplications(queueList);
    } catch (err) {
      console.error("Error fetching review queue:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  };

  const safeQueue = Array.isArray(queueApplications) ? queueApplications : [];

  const filteredQueue = safeQueue.filter((app) => {
    if (!app) return false;
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

      {/* Applications Queue Table */}
      {filteredQueue.length === 0 ? (
        <div className="p-5 border border-dark bg-white text-center font-mono text-muted">
          NO APPLICATIONS PENDING COMPLIANCE REVIEW.
        </div>
      ) : (
        <div className="border border-dark bg-white rounded-1 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 font-mono small">
              <thead className="bg-dark text-white text-uppercase" style={{ fontSize: '0.75rem' }}>
                <tr>
                  <th className="py-3 px-3">APPLICATION REF</th>
                  <th className="py-3 px-3">BUSINESS NAME</th>
                  <th className="py-3 px-3">PARTNER NAME</th>
                  <th className="py-3 px-3">BLUEPRINT</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-end">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((app) => (
                  <tr key={app.id} className="cursor-pointer" onClick={() => navigate(`/reviewer/application/${app.id}`)}>
                    <td className="py-3 px-3 fw-bold text-dark">
                      {app.application_number}
                    </td>
                    <td className="py-3 px-3 text-dark fw-bold">
                      {app.business_name || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {app.partner_name || 'Partner'}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {app.blueprint_name || 'Standard Blueprint'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-3 text-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reviewer/application/${app.id}`);
                        }}
                        className="btn btn-sm btn-ox-black font-mono text-uppercase px-3 py-1"
                      >
                        REVIEW DOCS →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboard;
