import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-vh-100 bg-white font-mono text-dark d-flex flex-column">
      {/* Header Bar */}
      <header className="border-bottom border-dark px-4 py-3 bg-white sticky-top">
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center justify-content-center text-white fw-bold"
              style={{ width: 32, height: 32, backgroundColor: '#000000', borderRadius: '2px', fontSize: '1rem' }}
            >
              ●
            </div>
            <span className="fw-bold fs-5 tracking-tight text-dark">ONBOARDX</span>
          </Link>
          <Link to="/login" className="btn btn-sm btn-ox-black text-uppercase">
            SIGN IN →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container my-5 py-3 flex-grow-1" style={{ maxWidth: 800 }}>
        <div className="border-bottom border-dark pb-3 mb-4">
          <span className="badge bg-black text-white text-uppercase rounded-0 mb-2 px-2 py-1">LEGAL DOCUMENTATION</span>
          <h1 className="fw-bold text-uppercase text-dark tracking-tight mb-2">PRIVACY POLICY</h1>
          <p className="text-muted small">LAST UPDATED: SEPTEMBER 2026 • REVISION 2.4</p>
        </div>

        <section className="mb-4">
          <h5 className="fw-bold text-uppercase border-bottom border-dark pb-2 mb-3">1. INFORMATION COLLECTION</h5>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            ONBOARDX collects business partner information required strictly for partner onboarding, verification, compliance audit, and risk management. This includes account credentials, corporate identification numbers, phone numbers, contact addresses, and verification documents (such as PAN cards, GST Certificates, and Incorporation documents).
          </p>
        </section>

        <section className="mb-4">
          <h5 className="fw-bold text-uppercase border-bottom border-dark pb-2 mb-3">2. DOCUMENT SECURITY & STORAGE</h5>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            All documents submitted via the ONBOARDX partner portal are stored securely on restricted media storage. Access is restricted strictly to assigned Reviewers and Administrators using server-side role-based access control (RBAC). Private partner documents are never publicly exposed or indexed by search engines.
          </p>
        </section>

        <section className="mb-4">
          <h5 className="fw-bold text-uppercase border-bottom border-dark pb-2 mb-3">3. DATA RETENTION & COMPLIANCE</h5>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            Partner activity logs and audit trails are retained to maintain verification integrity. Partners may update their profile details at any time via the Partner Workspace.
          </p>
        </section>

        <div className="pt-4 border-top border-dark mt-5 d-flex justify-content-between align-items-center">
          <Link to="/" className="btn btn-ox-white text-uppercase font-mono">
            ← BACK TO HOME
          </Link>
          <Link to="/terms" className="btn btn-ox-black text-uppercase font-mono">
            VIEW TERMS OF SERVICE →
          </Link>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-top border-dark py-4 text-center text-muted small bg-light mt-auto">
        ONBOARDX COMPLIANCE & PRIVACY SYSTEM • ALL RIGHTS RESERVED
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
