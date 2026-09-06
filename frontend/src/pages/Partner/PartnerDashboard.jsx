import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import JourneyStepper from '../../components/JourneyStepper';
import DocumentCard from '../../components/DocumentCard';
import ActivityTimeline from '../../components/ActivityTimeline';
import ScrollFloat from '../../components/ScrollFloat';
import { SkeletonCard } from '../../components/SkeletonLoader';

const PartnerDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [activeApp, setActiveApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState('');

  const [loading, setLoading] = useState(true);
  const [creatingApp, setCreatingApp] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const appsRes = await axios.get('/onboarding/applications/');
      const appsList = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.results && Array.isArray(appsRes.data.results) ? appsRes.data.results : []);
      setApplications(appsList);

      if (appsList.length > 0) {
        const app = appsList[0];
        setActiveApp(app);
        await loadAppData(app.id);
      } else {
        const bpRes = await axios.get('/onboarding/blueprints/');
        const bpList = Array.isArray(bpRes.data) ? bpRes.data : (bpRes.data?.results && Array.isArray(bpRes.data.results) ? bpRes.data.results : []);
        setBlueprints(bpList);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to load onboarding dashboard.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadAppData = async (appId) => {
    try {
      const docsRes = await axios.get(`/documents/application/${appId}/`);
      const docsList = Array.isArray(docsRes.data) ? docsRes.data : [];
      setDocuments(docsList);

      const actRes = await axios.get(`/activity/applications/${appId}/`);
      const actList = Array.isArray(actRes.data) ? actRes.data : [];
      setActivities(actList);
    } catch (err) {
      console.error("Error loading app details:", err);
    }
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    if (!selectedBlueprint) {
      setErrorMsg("Select a partner blueprint category.");
      return;
    }
    setCreatingApp(true);
    setErrorMsg('');
    try {
      await axios.post('/onboarding/applications/', {
        blueprint: selectedBlueprint,
        business_name: user?.company_name || user?.profile?.business_name || `${user?.username}'s Business`,
        contact_email: user?.email || '',
        contact_phone: user?.phone_number || user?.profile?.phone || '',
      });
      addToast("Application created successfully!");
      fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create application.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setCreatingApp(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!activeApp) return;
    setSubmittingApp(true);
    setErrorMsg('');
    try {
      await axios.post(`/onboarding/applications/${activeApp.id}/submit/`);
      addToast("Application submitted for compliance review!");
      fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to submit application.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleDocumentUpload = async (docItem, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const checklistItemId = docItem.checklist_item || docItem.id;
      await axios.post(`/documents/items/${checklistItemId}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast(`Document uploaded: ${docItem.title || 'File'}`);
      loadAppData(activeApp.id);
    } catch (err) {
      addToast(err.response?.data?.detail || "Upload failed", 'error');
    }
  };

  const safeDocs = Array.isArray(documents) ? documents : [];
  const totalDocs = safeDocs.length;
  const verifiedDocsCount = safeDocs.filter(d => d && d.status === 'APPROVED').length;
  const progressPercent = totalDocs > 0 ? Math.round((verifiedDocsCount / totalDocs) * 100) : (activeApp ? 25 : 0);
  const docsNeedingAttention = safeDocs.filter(d => d && (d.status === 'REJECTED' || (d.is_mandatory && d.status === 'NOT_UPLOADED')));

  // Calculate Next Step Text
  const getNextStep = () => {
    if (!activeApp) return { text: "Create an application to begin onboarding", link: null };
    if (activeApp.status === 'APPROVED') return { text: "Your onboarding is complete. Partner account active.", link: null };
    if (activeApp.status === 'REJECTED') return { text: "Application rejected. Review feedback comments.", link: null };
    if (docsNeedingAttention.length > 0) return { text: `Upload required document: ${docsNeedingAttention[0]?.title || 'Pending file'}`, link: '/partner/documents' };
    if (activeApp.is_editable) return { text: "Submit your application for compliance review", action: 'submit' };
    return { text: "Awaiting compliance officer verification", link: null };
  };

  const nextStepInfo = getNextStep();

  if (loading) {
    return (
      <div className="pb-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="pb-5 animate-fade-in-up">
      {/* Editorial Partner Hero */}
      <div className="p-4 mb-4 border border-dark bg-white rounded-1 hover-lift">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom border-dark pb-3 mb-3">
          <div>
            <div className="font-mono text-uppercase text-muted small fw-bold">
              PARTNER ONBOARDING DASHBOARD
            </div>
            <h1 className="ox-display-title text-dark mb-0">
              YOUR ONBOARDING
            </h1>
          </div>

          {activeApp && activeApp.is_editable && (
            <button
              onClick={handleSubmitApplication}
              disabled={submittingApp}
              className="btn btn-ox-black font-mono text-uppercase px-4 py-2.5 text-nowrap"
            >
              {submittingApp ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW →'}
            </button>
          )}
        </div>

        {activeApp && (
          <div className="row align-items-center g-3">
            <div className="col-md-6">
              <div className="font-mono text-uppercase small text-muted mb-1">
                COMPLIANCE PROGRESS
              </div>
              <div className="ox-editorial-num text-dark">
                {progressPercent}% COMPLETE
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="font-mono text-uppercase small text-muted mb-1">
                APPLICATION REF: <span className="text-dark fw-bold">{activeApp.application_number}</span>
              </div>
              <StatusBadge status={activeApp.status} />
            </div>
          </div>
        )}
      </div>

      {/* Next Action Bar */}
      {activeApp && (
        <div className="p-3 mb-4 border border-dark bg-dark text-white rounded-1 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 font-mono">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-white text-dark px-2 py-1 text-uppercase fw-bold">NEXT STEP</span>
            <span className="small text-white">{nextStepInfo.text}</span>
          </div>

          {nextStepInfo.link && (
            <Link to={nextStepInfo.link} className="btn btn-sm btn-ox-white text-nowrap">
              CONTINUE CHECKLIST →
            </Link>
          )}

          {nextStepInfo.action === 'submit' && (
            <button onClick={handleSubmitApplication} disabled={submittingApp} className="btn btn-sm btn-ox-white text-nowrap">
              SUBMIT NOW →
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 mb-4 border border-dark bg-dark text-white font-mono small">
          ERROR: {errorMsg}
        </div>
      )}

      {/* Primary Onboarding Stepper */}
      {activeApp ? (
        <div className="mb-5">
          <JourneyStepper status={activeApp.status} />
        </div>
      ) : (
        /* Create New Application Card */
        <div className="p-4 border border-dark bg-white rounded-1 mb-5">
          <h2 className="ox-section-title mb-2">INITIALIZE PARTNER APPLICATION</h2>
          <p className="font-mono text-muted small mb-4">
            SELECT A BLUEPRINT CATEGORY BELOW TO GENERATE YOUR ONBOARDING COMPLIANCE CHECKLIST.
          </p>

          <form onSubmit={handleCreateApplication} className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block">
                PARTNER BLUEPRINT CATEGORY
              </label>
              <select
                className="form-select font-mono"
                value={selectedBlueprint}
                onChange={(e) => setSelectedBlueprint(e.target.value)}
                required
              >
                <option value="">-- Select Partner Blueprint --</option>
                {Array.isArray(blueprints) && blueprints.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.title} ({bp.partner_type_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <button
                type="submit"
                disabled={creatingApp}
                className="btn btn-ox-black font-mono text-uppercase w-100 py-2"
              >
                {creatingApp ? 'INITIALIZING...' : 'START ONBOARDING →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Two Column Layout: Checklist Cards & Activity Log */}
      {activeApp && (
        <div className="row g-4">
          {/* Column 1: Document Checklist */}
          <div className="col-lg-8">
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-dark">
              <div>
                <h2 className="ox-section-title mb-0">REQUIRED COMPLIANCE DOCUMENTS</h2>
                <div className="font-mono text-muted small">
                  SUBMIT MANDATORY LEGAL & REGULATORY CERTIFICATES
                </div>
              </div>

              <Link to="/partner/documents" className="font-mono small text-dark fw-bold text-decoration-none">
                VIEW ALL ({totalDocs}) →
              </Link>
            </div>

            {safeDocs.length === 0 ? (
              <div className="p-4 border border-dark bg-white text-center font-mono text-muted">
                NO COMPLIANCE DOCUMENTS ATTACHED YET.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {safeDocs.map((docItem) => (
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

          {/* Column 2: Audit Timeline */}
          <div className="col-lg-4">
            <div className="pb-3 mb-3 border-bottom border-dark">
              <h2 className="ox-section-title mb-0">AUDIT TIMELINE</h2>
              <div className="font-mono text-muted small">IMMUTABLE ACTIVITY LOG</div>
            </div>

            <div className="p-3 border border-dark bg-white rounded-1">
              <ActivityTimeline activities={Array.isArray(activities) ? activities : []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
