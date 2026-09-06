import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import JourneyStepper from '../../components/JourneyStepper';

const PartnerApplication = () => {
  const { addToast } = useToast();
  const [activeApp, setActiveApp] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_email: '',
    contact_phone: '',
    business_details: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplicationData();
  }, []);

  const fetchApplicationData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const appsRes = await axios.get('/onboarding/applications/');
      const appsList = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.results && Array.isArray(appsRes.data.results) ? appsRes.data.results : []);
      if (appsList.length > 0) {
        const app = appsList[0];
        setActiveApp(app);
        setFormData({
          business_name: app.business_name || '',
          contact_email: app.contact_email || '',
          contact_phone: app.contact_phone || '',
          business_details: app.business_details || '',
        });
      }
    } catch (err) {
      console.error("Error fetching application details:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load application.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!activeApp) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await axios.patch(`/onboarding/applications/${activeApp.id}/`, formData);
      setActiveApp(res.data);
      addToast("Application draft saved!");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to save draft.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!activeApp) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await axios.post(`/onboarding/applications/${activeApp.id}/submit/`);
      addToast("Application submitted for compliance review!");
      fetchApplicationData();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to submit application.";
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING APPLICATION DETAILS...
      </div>
    );
  }

  if (!activeApp) {
    return (
      <div className="p-5 border border-dark bg-white text-center my-4 rounded-1">
        <h3 className="ox-section-title mb-2">NO ACTIVE APPLICATION</h3>
        <p className="font-mono text-muted small mb-3">Initialize an application from your dashboard.</p>
        <button onClick={() => navigate('/partner')} className="btn btn-ox-black font-mono text-uppercase">
          GO TO DASHBOARD →
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }} className="pb-5 animate-fade-in-up">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="ox-section-title mb-0">APPLICATION DETAILS</h2>
            <span className="font-mono small border border-dark px-2 py-0.5">
              ID: {activeApp.application_number}
            </span>
            <StatusBadge status={activeApp.status} />
          </div>
          <p className="font-mono text-muted small mb-0">
            VIEW AND UPDATE BUSINESS COMPLIANCE METADATA.
          </p>
        </div>

        {activeApp.is_editable && (
          <button
            onClick={handleSubmitApplication}
            disabled={submitting}
            className="btn btn-ox-black font-mono text-uppercase px-4 py-2"
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW →'}
          </button>
        )}
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

      {/* Visual Journey Card */}
      <div className="p-4 border border-dark bg-white mb-4 rounded-1">
        <JourneyStepper status={activeApp.status} />
      </div>

      {/* Main Details Form */}
      <div className="p-4 border border-dark bg-white rounded-1">
        <form onSubmit={handleSaveDraft}>
          <div className="row g-3 mb-3 font-mono">
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                BUSINESS / COMPANY NAME
              </label>
              <input
                type="text"
                name="business_name"
                className="form-control font-mono"
                value={formData.business_name}
                onChange={handleChange}
                disabled={!activeApp.is_editable}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                CONTACT EMAIL
              </label>
              <input
                type="email"
                name="contact_email"
                className="form-control font-mono"
                value={formData.contact_email}
                onChange={handleChange}
                disabled={!activeApp.is_editable}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3 font-mono">
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                CONTACT PHONE NUMBER
              </label>
              <input
                type="text"
                name="contact_phone"
                className="form-control font-mono"
                value={formData.contact_phone}
                onChange={handleChange}
                disabled={!activeApp.is_editable}
              />
            </div>
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                BLUEPRINT CATEGORY
              </label>
              <input
                type="text"
                className="form-control font-mono bg-light"
                value={activeApp.blueprint_details?.title || ''}
                disabled
              />
            </div>
          </div>

          <div className="mb-4 font-mono">
            <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
              ADDITIONAL BUSINESS OPERATIONS DETAILS
            </label>
            <textarea
              name="business_details"
              rows="4"
              className="form-control font-mono"
              placeholder="Enter details..."
              value={formData.business_details}
              onChange={handleChange}
              disabled={!activeApp.is_editable}
            ></textarea>
          </div>

          {activeApp.is_editable ? (
            <div className="d-flex justify-content-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-ox-white font-mono text-uppercase px-4 py-2"
              >
                {saving ? 'SAVING...' : 'SAVE DRAFT CHANGES'}
              </button>
            </div>
          ) : (
            <div className="p-3 border border-dark bg-light font-mono small text-muted">
              LOCKED: Application is currently in <strong className="text-dark">{activeApp.status}</strong> mode and cannot be edited.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PartnerApplication;
