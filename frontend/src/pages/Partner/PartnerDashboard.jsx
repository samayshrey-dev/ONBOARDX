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
      const appsList = appsRes.data.results || appsRes.data || [];
      setApplications(appsList);

      if (appsList.length > 0) {
        const app = appsList[0];
        setActiveApp(app);
        await loadAppData(app.id);
      } else {
        const bpRes = await axios.get('/onboarding/blueprints/');
        setBlueprints(bpRes.data.results || bpRes.data || []);
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
      setDocuments(docsRes.data || []);

      const actRes = await axios.get(`/activity/applications/${appId}/`);
      setActivities(actRes.data || []);
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

  const totalDocs = documents.length;
  const verifiedDocsCount = documents.filter(d => d.status === 'APPROVED').length;
  const progressPercent = totalDocs > 0 ? Math.round((verifiedDocsCount / totalDocs) * 100) : (activeApp ? 25 : 0);
  const docsNeedingAttention = documents.filter(d => d.status === 'REJECTED' || (d.is_mandatory && d.status === 'NOT_UPLOADED'));

  // Calculate Next Step Text
  const getNextStep = () => {
    if (!activeApp) return { text: "Create an application to begin onboarding", link: null };
    if (activeApp.status === 'APPROVED') return { text: "Your onboarding is complete. Partner account active.", link: null };
    if (activeApp.status === 'REJECTED') return { text: "Application rejected. Review feedback comments.", link: null };
    if (docsNeedingAttention.length > 0) return { text: `Upload required document: ${docsNeedingAttention[0].title || 'Pending file'}`, link: '/partner/documents' };
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
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold px-2 py-0.5 border border-white text-uppercase" style={{ fontSize: '0.7rem' }}>
              NEXT STEP
            </span>
            <span className="small">{nextStepInfo.text}</span>
          </div>
          {nextStepInfo.link && (
            <Link to={nextStepInfo.link} className="btn btn-sm btn-ox-white font-mono text-uppercase text-nowrap">
              CONTINUE →
            </Link>
          )}
          {nextStepInfo.action === 'submit' && (
            <button onClick={handleSubmitApplication} disabled={submittingApp} className="btn btn-sm btn-ox-white font-mono text-uppercase text-nowrap">
              {submittingApp ? 'SUBMITTING...' : 'SUBMIT NOW →'}
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 mb-4 border border-dark bg-dark text-white font-mono small rounded-1">
          ERROR: {errorMsg}
        </div>
      )}

      {/* Case 1: No Active Application */}
      {!activeApp && (
        <div className="p-5 border border-dark bg-white text-center my-4 rounded-1">
          <div className="font-mono text-uppercase text-muted small fw-bold mb-2">YOUR JOURNEY HASN'T STARTED</div>
          <h2 className="ox-section-title mb-2">CREATE AN APPLICATION TO BEGIN ONBOARDING</h2>
          <p className="font-mono text-muted small mx-auto mb-4" style={{ maxWidth: 500 }}>
            SELECT YOUR BUSINESS BLUEPRINT CATEGORY TO GENERATE COMPLIANCE CHECKLIST.
          </p>

          <form onSubmit={handleCreateApplication} className="mx-auto" style={{ maxWidth: 420 }}>
            <div className="mb-3 text-start">
              <label className="font-mono text-uppercase small fw-bold mb-1 d-block" style={{ fontSize: '0.75rem' }}>BLUEPRINT CATEGORY</label>
              <select
                className="form-select font-mono"
                value={selectedBlueprint}
                onChange={(e) => setSelectedBlueprint(e.target.value)}
                required
              >
                <option value="">-- SELECT PARTNER BLUEPRINT --</option>
                {blueprints.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.title} ({bp.partner_type_code})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={creatingApp}
              className="btn btn-ox-black font-mono text-uppercase w-100 py-2.5"
            >
              {creatingApp ? 'INITIALIZING...' : 'START APPLICATION →'}
            </button>
          </form>
        </div>
      )}

      {/* Case 2: Active Application Exists */}
      {activeApp && (
        <>
          {/* Signature Journey Stepper */}
          <div className="p-4 mb-4 border border-dark bg-white rounded-1">
            <JourneyStepper status={activeApp.status} />
          </div>

          {/* Documents Needing Attention */}
          <div className="mb-5">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2">
              <div>
                <h3 className="ox-section-title mb-0">
                  <ScrollFloat
                    animationDuration={1}
                    ease='back.inOut(2)'
                    scrollStart='center bottom+=50%'
                    scrollEnd='bottom bottom-=40%'
                    stagger={0.03}
                  >
                    WHAT NEEDS YOUR ATTENTION?
                  </ScrollFloat>
                </h3>
              </div>
              <Link to="/partner/documents" className="btn btn-sm btn-ox-white font-mono text-uppercase">
                CHECKLIST ({documents.length}) →
              </Link>
            </div>

            {docsNeedingAttention.length === 0 ? (
              <div className="p-4 border border-dark bg-light font-mono text-muted text-center small rounded-1">
                NOTHING NEEDS YOUR ATTENTION. You're completely caught up.
              </div>
            ) : (
              <div className="row g-3">
                {docsNeedingAttention.slice(0, 3).map((docItem) => (
                  <div key={docItem.id} className="col-md-6 col-lg-4">
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

          {/* Grid Row: Application Metadata & Activity Timeline */}
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="p-4 border border-dark bg-white h-100 rounded-1">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2">
                  <h4 className="font-mono fw-bold text-uppercase small text-dark mb-0">
                    APPLICATION METADATA
                  </h4>
                  <Link to="/partner/application" className="font-mono small text-dark fw-bold text-uppercase">
                    EDIT →
                  </Link>
                </div>

                <div className="row g-3 font-mono">
                  <div className="col-6">
                    <div className="text-muted small">BUSINESS NAME</div>
                    <div className="fw-bold text-dark">{activeApp.business_name || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">CONTACT EMAIL</div>
                    <div className="fw-bold text-dark">{activeApp.contact_email || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">BLUEPRINT</div>
                    <div className="fw-bold text-dark">{activeApp.blueprint_details?.title}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">STATE</div>
                    <div className="fw-bold text-dark">{activeApp.is_editable ? 'EDITABLE (DRAFT)' : 'LOCKED FOR REVIEW'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="p-4 border border-dark bg-white h-100 rounded-1">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2">
                  <h4 className="font-mono fw-bold text-uppercase small text-dark mb-0">
                    TIMELINE RECENT ACTIVITY
                  </h4>
                  <Link to="/partner/activity" className="font-mono small text-dark fw-bold text-uppercase">
                    FULL LOG →
                  </Link>
                </div>

                <ActivityTimeline activities={activities.slice(0, 3)} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PartnerDashboard;
