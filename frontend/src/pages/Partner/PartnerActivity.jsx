import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import ActivityTimeline from '../../components/ActivityTimeline';
import StatusBadge from '../../components/StatusBadge';

const PartnerActivity = () => {
  const [activeApp, setActiveApp] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const appsRes = await axios.get('/onboarding/applications/');
      const appsList = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.results && Array.isArray(appsRes.data.results) ? appsRes.data.results : []);
      if (appsList.length > 0) {
        const app = appsList[0];
        setActiveApp(app);
        const actRes = await axios.get(`/activity/applications/${app.id}/`);
        setActivities(Array.isArray(actRes.data) ? actRes.data : []);
      }
    } catch (err) {
      console.error("Error fetching activity timeline:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load activity timeline.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 font-mono text-muted text-center">
        LOADING ACTIVITY TIMELINE...
      </div>
    );
  }

  if (!activeApp) {
    return (
      <div className="p-5 border border-dark bg-white text-center my-4 rounded-1">
        <h3 className="ox-section-title mb-2">NO ACTIVE APPLICATION</h3>
        <p className="font-mono text-muted small mb-0">Create an onboarding application to view history.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 850 }} className="pb-5 animate-fade-in-up">
      {/* Header Banner */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="ox-section-title mb-0">AUDIT ACTIVITY TIMELINE</h2>
            <StatusBadge status={activeApp.status} />
          </div>
          <p className="font-mono text-muted small mb-0">
            CHRONOLOGICAL AUDIT HISTORY FOR APPLICATION {activeApp.application_number}.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 border border-dark bg-dark text-white font-mono small">
          ERROR: {errorMsg}
        </div>
      )}

      {/* Activity Timeline Card */}
      <div className="p-4 border border-dark bg-white rounded-1">
        <ActivityTimeline activities={activities} emptyMessage="NO RECORDED ACTIVITY YET." />
      </div>
    </div>
  );
};

export default PartnerActivity;
