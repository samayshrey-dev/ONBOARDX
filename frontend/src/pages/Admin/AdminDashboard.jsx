import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import ActivityTimeline from '../../components/ActivityTimeline';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonCard, SkeletonTable } from '../../components/SkeletonLoader';

const AdminDashboard = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'applications' | 'blueprints'

  const [applications, setApplications] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDocuments, setAppDocuments] = useState([]);
  const [appActivities, setAppActivities] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showBpModal, setShowBpModal] = useState(false);
  const [bpForm, setBpForm] = useState({ title: '', partner_type_code: '', description: '', is_active: true });

  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({ id: null, document_name: '', description: '', is_mandatory: true, order: 1 });

  const [deleteModal, setDeleteModal] = useState({ show: false, reqId: null, name: '' });
  const [decisionModal, setDecisionModal] = useState({ show: false, decision: 'APPROVED', comment: '' });

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');


  useEffect(() => {
    fetchAdminData();
  }, []);

  // Escape key handler to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (decisionModal.show) setDecisionModal({ show: false, decision: 'APPROVED', comment: '' });
        else if (selectedApp) setSelectedApp(null);
        else if (showBpModal) setShowBpModal(false);
        else if (showReqModal) setShowReqModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [decisionModal.show, selectedApp, showBpModal, showReqModal]);

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const appsRes = await axios.get('/onboarding/applications/');
      const appsList = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.results && Array.isArray(appsRes.data.results) ? appsRes.data.results : []);
      setApplications(appsList);

      const bpRes = await axios.get('/onboarding/blueprints/');
      const bpList = Array.isArray(bpRes.data) ? bpRes.data : (bpRes.data?.results && Array.isArray(bpRes.data.results) ? bpRes.data.results : []);
      setBlueprints(bpList);
      if (bpList.length > 0) {
        setSelectedBlueprint(bpList[0]);
      }
    } catch (err) {
      console.error("Error loading admin control data:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load admin management data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInspectApp = async (app) => {
    setSelectedApp(app);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const docsRes = await axios.get(`/documents/application/${app.id}/`);
      setAppDocuments(Array.isArray(docsRes.data) ? docsRes.data : []);

      const actRes = await axios.get(`/activity/applications/${app.id}/`);
      setAppActivities(Array.isArray(actRes.data) ? actRes.data : []);
    } catch (err) {
      console.error("Error inspecting application:", err);
    }
  };

  const safeApps = Array.isArray(applications) ? applications : [];
  const safeBlueprints = Array.isArray(blueprints) ? blueprints : [];

  const totalApps = safeApps.length;
  const pendingReviewApps = safeApps.filter(a => a && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')).length;
  const awaitingApprovalApps = safeApps.filter(a => a && a.status === 'PENDING_APPROVAL').length;
  const approvedApps = safeApps.filter(a => a && a.status === 'APPROVED').length;
  const rejectedApps = safeApps.filter(a => a && (a.status === 'REJECTED' || a.status === 'CORRECTION_REQUIRED')).length;

  const filteredApps = safeApps.filter((app) => {
    if (!app) return false;
    const matchesSearch =
      (app.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.partner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.application_number || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateBlueprint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await axios.post('/onboarding/blueprints/', bpForm);
      addToast(`Blueprint "${res.data.title}" created!`);
      setShowBpModal(false);
      setBpForm({ title: '', partner_type_code: '', description: '', is_active: true });
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create blueprint.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRequirement = async (e) => {
    e.preventDefault();
    if (!selectedBlueprint) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (reqForm.id) {
        await axios.patch(`/onboarding/requirements/${reqForm.id}/`, reqForm);
        addToast(`Updated requirement "${reqForm.document_name}"`);
      } else {
        await axios.post(`/onboarding/blueprints/${selectedBlueprint.id}/requirements/`, reqForm);
        addToast(`Added requirement "${reqForm.document_name}"`);
      }
      setShowReqModal(false);

      const bpRes = await axios.get('/onboarding/blueprints/');
      const updatedList = bpRes.data.results || bpRes.data || [];
      setBlueprints(updatedList);
      const current = updatedList.find(b => b.id === selectedBlueprint.id);
      if (current) setSelectedBlueprint(current);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to save requirement.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteRequirement = (req) => {
    setDeleteModal({ show: true, reqId: req.id, name: req.document_name });
  };

  const executeDeleteRequirement = async () => {
    if (!deleteModal.reqId) return;
    setSubmitting(true);
    try {
      await axios.delete(`/onboarding/requirements/${deleteModal.reqId}/`);
      addToast("Requirement removed successfully");
      const bpRes = await axios.get('/onboarding/blueprints/');
      const updatedList = bpRes.data.results || bpRes.data || [];
      setBlueprints(updatedList);
      const current = updatedList.find(b => b.id === selectedBlueprint.id);
      if (current) setSelectedBlueprint(current);
      setDeleteModal({ show: false, reqId: null, name: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to delete requirement.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const handleExecutiveDecision = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await axios.post(`/approvals/applications/${selectedApp.id}/decide/`, {
        decision: decisionModal.decision,
        comment: decisionModal.comment,
      });

      const decisionLabel = decisionModal.decision === 'APPROVED' ? 'Application approved' : 'Decision recorded';
      addToast(`${decisionLabel} for #${selectedApp.application_number}`);
      setDecisionModal({ show: false, decision: 'APPROVED', comment: '' });
      setSelectedApp(null);
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to record executive decision.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING ADMIN CONTROL CENTER...
      </div>
    );
  }

  return (
    <div className="pb-5 animate-fade-in-up">
      {/* Header & Tab Switcher */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <h1 className="ox-section-title mb-1">ADMIN CONTROL CENTER</h1>
          <p className="font-mono text-muted small mb-0">
            BLUEPRINT MANAGEMENT, COMPLIANCE METRICS, AND EXECUTIVE DECISION SIGN-OFF.
          </p>
        </div>

        <div className="d-flex gap-1 p-1 border border-dark bg-white rounded-1">
          {[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'applications', label: `APPLICATIONS (${applications.length})` },
            { id: 'blueprints', label: 'BLUEPRINTS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm font-mono text-uppercase px-3 py-1.5 ${
                activeTab === tab.id ? 'btn-ox-black' : 'btn-ox-white'
              }`}
            >
              {tab.label}
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

      {/* AREA 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Typographic Large Numbers Overview */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-lg-2.4">
              <div className="p-4 border border-dark bg-white h-100 rounded-1">
                <div className="font-mono text-uppercase text-muted small">TOTAL APPLICATIONS</div>
                <div className="ox-editorial-num text-dark my-1">{totalApps < 10 ? `0${totalApps}` : totalApps}</div>
                <div className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>REGISTERED SUBMISSIONS</div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2.4">
              <div className="p-4 border border-dark bg-white h-100 rounded-1">
                <div className="font-mono text-uppercase text-muted small">PENDING REVIEW</div>
                <div className="ox-editorial-num text-dark my-1">{pendingReviewApps < 10 ? `0${pendingReviewApps}` : pendingReviewApps}</div>
                <div className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>IN REVIEWER QUEUE</div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2.4">
              <div className="p-4 border border-dark bg-dark text-white h-100 rounded-1">
                <div className="font-mono text-uppercase opacity-75 small">AWAITING APPROVAL</div>
                <div className="ox-editorial-num text-white my-1">{awaitingApprovalApps < 10 ? `0${awaitingApprovalApps}` : awaitingApprovalApps}</div>
                <div className="font-mono opacity-75" style={{ fontSize: '0.7rem' }}>NEEDS FINAL SIGN-OFF</div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2.4">
              <div className="p-4 border border-dark bg-white h-100 rounded-1">
                <div className="font-mono text-uppercase text-muted small">APPROVED</div>
                <div className="ox-editorial-num text-dark my-1">{approvedApps < 10 ? `0${approvedApps}` : approvedApps}</div>
                <div className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>FULLY ONBOARDED</div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2.4">
              <div className="p-4 border border-dark bg-white h-100 rounded-1">
                <div className="font-mono text-uppercase text-muted small">REJECTED / ACTION</div>
                <div className="ox-editorial-num text-dark my-1">{rejectedApps < 10 ? `0${rejectedApps}` : rejectedApps}</div>
                <div className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>CORRECTION REQUESTED</div>
              </div>
            </div>
          </div>

          {/* Executive Action Ready Callout */}
          <div className="p-4 border border-dark bg-white rounded-1 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2 font-mono">
              <h4 className="font-mono fw-bold text-uppercase small text-dark mb-0">
                APPLICATIONS READY FOR EXECUTIVE SIGN-OFF
              </h4>
              <span className="border border-dark px-2 py-0.5 small fw-bold">
                {awaitingApprovalApps} PENDING
              </span>
            </div>

            {applications.filter(a => a.status === 'PENDING_APPROVAL').length === 0 ? (
              <div className="p-4 font-mono text-muted text-center small border border-dashed border-dark">
                NO APPLICATIONS CURRENTLY AWAITING EXECUTIVE SIGN-OFF.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {applications.filter(a => a.status === 'PENDING_APPROVAL').map((app) => (
                  <div key={app.id} className="p-3 border border-dark bg-light d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 font-mono">
                    <div>
                      <div className="fw-bold text-dark">{app.business_name} ({app.application_number})</div>
                      <div className="text-muted small">BLUEPRINT: {app.blueprint_details?.title} • PARTNER: {app.partner_name}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <StatusBadge status={app.status} />
                      <button
                        onClick={() => handleInspectApp(app)}
                        className="btn btn-sm btn-ox-black font-mono text-uppercase px-3 py-1"
                      >
                        INSPECT & SIGN-OFF →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AREA 2: APPLICATIONS LIST */}
      {activeTab === 'applications' && (
        <div>
          <div className="p-3 border border-dark bg-white mb-4 rounded-1 font-mono">
            <div className="row g-2 align-items-center">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="SEARCH PARTNER, BUSINESS OR APP ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <div className="d-flex flex-wrap gap-1 justify-content-md-end">
                  {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`btn btn-sm font-mono text-uppercase ${statusFilter === st ? 'btn-ox-black' : 'btn-ox-white'}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-dark bg-white rounded-1 overflow-hidden">
            <div className="table-responsive">
              <table className="table font-mono align-middle mb-0">
                <thead>
                  <tr>
                    <th>APP ID</th>
                    <th>PARTNER / BUSINESS</th>
                    <th>BLUEPRINT</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th className="text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        NO MATCHING APPLICATIONS FOUND.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id}>
                        <td className="fw-bold">{app.application_number}</td>
                        <td>
                          <div className="fw-bold text-dark">{app.business_name}</div>
                          <div className="text-muted small">{app.partner_name}</div>
                        </td>
                        <td>{app.blueprint_details?.title}</td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="text-muted small">{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            onClick={() => handleInspectApp(app)}
                            className="btn btn-sm btn-ox-white font-mono text-uppercase px-2.5 py-1"
                          >
                            INSPECT →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AREA 3: BLUEPRINTS */}
      {activeTab === 'blueprints' && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="p-4 border border-dark bg-white h-100 rounded-1">
              <div className="d-flex align-items-center justify-content-between border-bottom border-dark pb-3 mb-3 font-mono">
                <div>
                  <h4 className="fw-bold text-dark mb-0 text-uppercase small">ONBOARDING BLUEPRINTS</h4>
                </div>
                <button
                  onClick={() => setShowBpModal(true)}
                  className="btn btn-sm btn-ox-black font-mono text-uppercase px-2.5 py-1"
                >
                  + NEW BLUEPRINT
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {blueprints.map((bp) => {
                  const isSelected = selectedBlueprint && selectedBlueprint.id === bp.id;
                  const reqs = bp.requirements || [];

                  return (
                    <div
                      key={bp.id}
                      onClick={() => setSelectedBlueprint(bp)}
                      className={`p-3 border border-dark rounded-1 cursor-pointer transition-all ${
                        isSelected ? 'bg-dark text-white' : 'bg-white text-dark'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2 font-mono">
                        <span className="fw-bold text-uppercase">{bp.title}</span>
                        <span className="border border-dark px-1.5 py-0.5 small">{bp.partner_type_code}</span>
                      </div>
                      <div className="font-mono text-uppercase small mb-2 opacity-75">
                        {reqs.length < 10 ? `0${reqs.length}` : reqs.length} REQUIREMENTS
                      </div>
                      <div className="d-flex flex-wrap gap-1 font-mono">
                        {reqs.slice(0, 4).map((r, i) => (
                          <span key={i} className={`border px-1.5 py-0.5 ${isSelected ? 'border-white text-white' : 'border-dark text-dark'}`} style={{ fontSize: '0.65rem' }}>
                            {r.document_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            {selectedBlueprint ? (
              <div className="p-4 border border-dark bg-white h-100 rounded-1">
                <div className="d-flex align-items-center justify-content-between border-bottom border-dark pb-3 mb-3 font-mono">
                  <div>
                    <div className="text-uppercase text-muted small">CHECKLIST CONFIGURATION</div>
                    <h4 className="fw-bold text-dark mb-0 uppercase">{selectedBlueprint.title}</h4>
                  </div>
                  <button
                    onClick={() => {
                      setReqForm({ id: null, document_name: '', description: '', is_mandatory: true, order: (selectedBlueprint.requirements?.length || 0) + 1 });
                      setShowReqModal(true);
                    }}
                    className="btn btn-sm btn-ox-black font-mono text-uppercase px-3 py-1.5"
                  >
                    + ADD REQUIREMENT
                  </button>
                </div>

                {!selectedBlueprint.requirements || selectedBlueprint.requirements.length === 0 ? (
                  <div className="p-4 border border-dashed border-dark bg-light text-center font-mono text-muted small">
                    NO REQUIREMENTS DEFINED YET FOR THIS BLUEPRINT.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2 font-mono">
                    {selectedBlueprint.requirements.map((req) => (
                      <div key={req.id} className="p-3 border border-dark bg-light d-flex align-items-center justify-content-between rounded-1">
                        <div>
                          <div className="fw-bold text-dark text-uppercase">{req.document_name}</div>
                          <div className="text-muted small">{req.is_mandatory ? '● MANDATORY REQUIREMENT' : '○ OPTIONAL REQUIREMENT'}</div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            onClick={() => {
                              setReqForm(req);
                              setShowReqModal(true);
                            }}
                            className="btn btn-sm btn-ox-white font-mono text-uppercase px-2.5 py-1"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => confirmDeleteRequirement(req)}
                            className="btn btn-sm btn-ox-white font-mono text-uppercase px-2.5 py-1 text-danger border-danger"
                          >
                            DELETE
                          </button>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {selectedApp && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border border-dark rounded-1">
              <div className="modal-header border-bottom border-dark bg-white font-mono">
                <div>
                  <h4 className="modal-title fw-bold text-uppercase">
                    INSPECTION: {selectedApp.business_name} ({selectedApp.application_number})
                  </h4>
                  <div className="text-muted small">PARTNER: {selectedApp.partner_name}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedApp(null)}></button>
              </div>

              <div className="modal-body p-4 bg-white font-mono">
                <div className="p-3 border border-dark mb-4 bg-light d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small">STATUS: </span>
                    <StatusBadge status={selectedApp.status} />
                  </div>
                  <div>
                    <span className="text-muted small">BLUEPRINT: </span>
                    <strong className="text-dark">{selectedApp.blueprint_details?.title}</strong>
                  </div>
                </div>

                <h5 className="fw-bold mb-3 border-bottom border-dark pb-2">CHECKLIST DOCUMENTS ({appDocuments.length})</h5>
                <div className="row g-3 mb-4">
                  {appDocuments.map((doc) => (
                    <div key={doc.id} className="col-md-6">
                      <div className="p-3 border border-dark bg-white">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-bold">{doc.document_name}</span>
                          <span className="border border-dark px-1.5 py-0.5 text-uppercase small">{doc.status}</span>
                        </div>
                        <div className="text-muted small mb-2">{doc.file_name || 'No file attached'}</div>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ox-white font-mono text-uppercase px-2 py-1">
                            VIEW FILE →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <h5 className="fw-bold mb-3 border-bottom border-dark pb-2">AUDIT ACTIVITY LOG</h5>
                <ActivityTimeline activities={appActivities} />
              </div>

              <div className="modal-footer border-top border-dark bg-white font-mono d-flex justify-content-between">
                <button type="button" className="btn btn-ox-white font-mono text-uppercase" onClick={() => setSelectedApp(null)}>
                  CLOSE INSPECTION
                </button>

                <div className="d-flex gap-2">
                  <button
                    onClick={() => setDecisionModal({ show: true, decision: 'CORRECTION_REQUIRED', comment: '' })}
                    className="btn btn-ox-white font-mono text-uppercase border-dark"
                  >
                    REQUEST CORRECTIONS
                  </button>
                  <button
                    onClick={() => setDecisionModal({ show: true, decision: 'REJECTED', comment: '' })}
                    className="btn btn-ox-white font-mono text-uppercase border-dark"
                  >
                    REJECT APPLICATION
                  </button>
                  <button
                    onClick={() => setDecisionModal({ show: true, decision: 'APPROVED', comment: '' })}
                    className="btn btn-ox-black font-mono text-uppercase"
                  >
                    ● GRANT FINAL APPROVAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DECISION SUB-MODAL */}
      {decisionModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-dark rounded-1 font-mono">
              <form onSubmit={handleExecutiveDecision}>
                <div className="modal-header border-bottom border-dark">
                  <h5 className="modal-title fw-bold text-uppercase">
                    EXECUTIVE DECISION: {decisionModal.decision}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setDecisionModal({ show: false, decision: 'APPROVED', comment: '' })}></button>
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                      FEEDBACK COMMENT
                    </label>
                    <textarea
                      rows="3"
                      className="form-control font-mono"
                      placeholder="Enter executive comments..."
                      value={decisionModal.comment}
                      onChange={(e) => setDecisionModal({ ...decisionModal, comment: e.target.value })}
                      required={decisionModal.decision !== 'APPROVED'}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top border-dark">
                  <button type="button" className="btn btn-ox-white font-mono text-uppercase" onClick={() => setDecisionModal({ show: false, decision: 'APPROVED', comment: '' })}>
                    CANCEL
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-ox-black font-mono text-uppercase">
                    {submitting ? 'RECORDING...' : 'CONFIRM DECISION →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BLUEPRINT MODAL */}
      {showBpModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content border border-dark font-mono rounded-1">
              <form onSubmit={handleCreateBlueprint}>
                <div className="modal-header border-bottom border-dark">
                  <h5 className="modal-title fw-bold text-uppercase">CREATE BLUEPRINT</h5>
                  <button type="button" className="btn-close" onClick={() => setShowBpModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="text-uppercase small fw-bold text-dark mb-1 d-block">TITLE</label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      placeholder="e.g. Franchisee Blueprint"
                      value={bpForm.title}
                      onChange={(e) => setBpForm({ ...bpForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="text-uppercase small fw-bold text-dark mb-1 d-block">PARTNER TYPE CODE</label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      placeholder="e.g. FRANCHISEE"
                      value={bpForm.partner_type_code}
                      onChange={(e) => setBpForm({ ...bpForm, partner_type_code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-dark">
                  <button type="button" className="btn btn-ox-white font-mono text-uppercase" onClick={() => setShowBpModal(false)}>CANCEL</button>
                  <button type="submit" disabled={submitting} className="btn btn-ox-black font-mono text-uppercase">CREATE →</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT REQUIREMENT MODAL */}
      {showReqModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content border border-dark font-mono rounded-1">
              <form onSubmit={handleSaveRequirement}>
                <div className="modal-header border-bottom border-dark">
                  <h5 className="modal-title fw-bold text-uppercase">
                    {reqForm.id ? 'EDIT REQUIREMENT' : 'ADD REQUIREMENT'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowReqModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="text-uppercase small fw-bold text-dark mb-1 d-block">DOCUMENT NAME</label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      placeholder="e.g. PAN Card"
                      value={reqForm.document_name}
                      onChange={(e) => setReqForm({ ...reqForm, document_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="req_mandatory_check"
                      checked={reqForm.is_mandatory}
                      onChange={(e) => setReqForm({ ...reqForm, is_mandatory: e.target.checked })}
                    />
                    <label className="form-check-label text-uppercase small fw-bold" htmlFor="req_mandatory_check">
                      MANDATORY REQUIREMENT
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-top border-dark">
                  <button type="button" className="btn btn-ox-white font-mono text-uppercase" onClick={() => setShowReqModal(false)}>CANCEL</button>
                  <button type="submit" disabled={submitting} className="btn btn-ox-black font-mono text-uppercase">SAVE →</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        title="REMOVE CHECKLIST REQUIREMENT"
        message={`Are you sure you want to permanently delete requirement "${deleteModal.name}" from this blueprint? Active partner applications created prior will retain their snapshot.`}
        confirmText="DELETE REQUIREMENT"
        cancelText="CANCEL"
        isDanger={true}
        loading={submitting}
        onConfirm={executeDeleteRequirement}
        onClose={() => setDeleteModal({ show: false, reqId: null, name: '' })}
      />
    </div>
  );
};


export default AdminDashboard;
