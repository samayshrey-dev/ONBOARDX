import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center px-3 font-mono text-center"
      style={{ backgroundColor: '#FFFFFF' }}

    >
      <div className="p-4 p-md-5 border border-dark bg-white rounded-1 shadow-sm" style={{ maxWidth: 520 }}>
        <div className="display-1 fw-bold text-dark mb-2 tracking-tight">500</div>
        <div className="badge bg-black text-white text-uppercase rounded-0 px-2.5 py-1 mb-3">INTERNAL SERVER ERROR</div>
        <h4 className="fw-bold text-uppercase text-dark mb-3">UNEXPECTED SYSTEM INTERRUPTION</h4>
        <p className="text-muted small mb-4" style={{ lineHeight: 1.6 }}>
          We encountered an unexpected server exception while processing your onboarding request. Our system logs have recorded this incident.
        </p>

        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="btn btn-ox-white text-uppercase py-2 px-3"
          >
            ↻ RETRY REQUEST
          </button>
          <Link to="/dashboard" className="btn btn-ox-black text-uppercase py-2 px-3">
            RETURN TO DASHBOARD →
          </Link>
        </div>
      </div>
      <div className="mt-4 text-muted small">ONBOARDX MONITORING & RESILIENCE ENGINE</div>
    </div>
  );
};

export default ServerError;
