import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
          <span className="badge bg-black text-white text-uppercase rounded-0 mb-2 px-2 py-1">LEGAL AGREEMENT</span>
          <h1 className="fw-bold text-uppercase text-dark tracking-tight mb-2">TERMS OF SERVICE</h1>
          <p className="text-muted small">EFFECTIVE DATE: SEPTEMBER 2026</p>
        </div>

        <section className="mb-4">
          <h5 className="fw-bold text-uppercase border-bottom border-dark pb-2 mb-3">1. ACCEPTANCE OF TERMS</h5>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            By creating an account or submitting an onboarding application on ONBOARDX, you agree to comply with all onboarding requirement specifications, document verification policies, and administrative guidelines outlined herein.
          </p>
        </section>

        <section className="mb-4">
          <h5 className="fw-bold text-uppercase border-bottom border-dark pb-2 mb-3">2. ACCURACY OF SUBMITTED DOCUMENTS</h5>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            Partners certify that all uploaded verification documents (including tax identity certificates, business registrations, and banking details) are authentic, accurate, and unedited. Submitting fraudulent or falsified documentation will result in immediate application rejection and account termination.
          </p>
        </section>

        <section className="mb-4">
          <h5 className="fw-bold text-uppercase border-bottom border-dark pb-2 mb-3">3. REVIEW & APPROVAL DISCRETION</h5>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            All applications are subject to mandatory document verification by authorized Reviewers and final decision by system Administrators. ONBOARDX reserves the right to request document replacements or additional information prior to approval.
          </p>
        </section>

        <div className="pt-4 border-top border-dark mt-5 d-flex justify-content-between align-items-center">
          <Link to="/" className="btn btn-ox-white text-uppercase font-mono">
            ← BACK TO HOME
          </Link>
          <Link to="/privacy" className="btn btn-ox-black text-uppercase font-mono">
            VIEW PRIVACY POLICY →
          </Link>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-top border-dark py-4 text-center text-muted small bg-light mt-auto">
        ONBOARDX COMPLIANCE & LEGAL SYSTEM • ALL RIGHTS RESERVED
      </footer>
    </div>
  );
};

export default TermsOfService;
