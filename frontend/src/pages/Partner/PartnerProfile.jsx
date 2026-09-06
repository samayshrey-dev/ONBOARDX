import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PartnerProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    business_name: '',
    phone: '',
    address: '',
    preferred_partner_type: '',
    registration_number: '',
    website: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get('/auth/profile/');
      if (res.data) {
        setProfileData({
          business_name: res.data.business_name || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          preferred_partner_type: res.data.preferred_partner_type || '',
          registration_number: res.data.registration_number || '',
          website: res.data.website || '',
        });
      }
    } catch (err) {
      console.error("Error fetching partner profile:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load partner profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.patch('/auth/profile/', profileData);
      setSuccessMsg("Business profile updated!");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING BUSINESS PROFILE...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 850 }} className="pb-5 animate-fade-in-up">
      {/* Header Banner */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-dark">
        <div>
          <h2 className="ox-section-title mb-0">BUSINESS PROFILE</h2>
          <p className="font-mono text-muted small mb-0">
            ORGANIZATION DETAILS AND COMPLIANCE CREDENTIALS.
          </p>
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

      {/* Owner Header */}
      <div className="p-4 mb-4 border border-dark bg-dark text-white rounded-1 font-mono">
        <div className="text-uppercase small text-white-50 mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>ACCOUNT OWNER</div>
        <h4 className="fw-bold mb-1 text-white" style={{ color: '#FFFFFF' }}>{user?.company_name || profileData.business_name || user?.username}</h4>
        <div className="small text-white-50" style={{ color: '#E4E4E7' }}>{user?.first_name} {user?.last_name} • {user?.email}</div>
      </div>

      {/* Profile Form */}
      <div className="p-4 border border-dark bg-white rounded-1">
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3 font-mono">
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                BUSINESS / CORPORATE NAME
              </label>
              <input
                type="text"
                name="business_name"
                className="form-control font-mono"
                value={profileData.business_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                PRIMARY BUSINESS PHONE
              </label>
              <input
                type="text"
                name="phone"
                className="form-control font-mono"
                value={profileData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-3 font-mono">
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                REGISTRATION / TAX ID
              </label>
              <input
                type="text"
                name="registration_number"
                className="form-control font-mono"
                value={profileData.registration_number}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
                CORPORATE WEBSITE URL
              </label>
              <input
                type="url"
                name="website"
                className="form-control font-mono"
                value={profileData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-4 font-mono">
            <label className="text-uppercase small fw-bold text-dark mb-1 d-block">
              REGISTERED BUSINESS ADDRESS
            </label>
            <textarea
              name="address"
              rows="3"
              className="form-control font-mono"
              value={profileData.address}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-ox-black font-mono text-uppercase px-4 py-2"
            >
              {saving ? 'UPDATING...' : 'SAVE PROFILE DETAILS →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerProfile;
