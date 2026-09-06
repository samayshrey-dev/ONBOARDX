import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const ContactSupport = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'ONBOARDING_INQUIRY', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      addToast('Support inquiry submitted successfully.', 'success');
    }, 600);
  };

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
      <main className="container my-5 py-3 flex-grow-1" style={{ maxWidth: 720 }}>
        <div className="border-bottom border-dark pb-3 mb-4">
          <span className="badge bg-black text-white text-uppercase rounded-0 mb-2 px-2 py-1">SUPPORT CENTER</span>
          <h1 className="fw-bold text-uppercase text-dark tracking-tight mb-2">CONTACT ONBOARDX TEAM</h1>
          <p className="text-muted small">GET IN TOUCH WITH COMPLIANCE & TECHNICAL SUPPORT</p>
        </div>

        {!submitted ? (
          <div className="p-4 border border-dark rounded-1 bg-white shadow-sm">
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                    YOUR NAME
                  </label>
                  <input
                    type="text"
                    className="form-control font-mono"
                    placeholder="Rajesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    className="form-control font-mono"
                    placeholder="rajesh@company.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                  INQUIRY CATEGORY
                </label>
                <select
                  className="form-select font-mono"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="ONBOARDING_INQUIRY">PARTNER ONBOARDING ASSISTANCE</option>
                  <option value="DOCUMENT_VERIFICATION">DOCUMENT VERIFICATION ISSUE</option>
                  <option value="TECHNICAL_SUPPORT">PORTAL TECHNICAL SUPPORT</option>
                  <option value="ADMIN_REVIEW">REVIEW STATUS CHECK</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                  MESSAGE DETAILS
                </label>
                <textarea
                  className="form-control font-mono"
                  rows={4}
                  placeholder="Describe your request or document issue..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-ox-black font-mono text-uppercase w-100 py-2.5"
                disabled={submitting}
              >
                {submitting ? 'SENDING INQUIRY...' : 'SUBMIT SUPPORT TICKET →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 border border-dark rounded-1 bg-light text-center">
            <div className="fs-3 mb-2">✓</div>
            <h5 className="fw-bold text-uppercase text-dark mb-2">SUPPORT TICKET SUBMITTED</h5>
            <p className="text-muted small mb-4">
              Thank you for contacting ONBOARDX Support. Our compliance team will review your inquiry and respond within 24 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="btn btn-ox-white text-uppercase font-mono me-2"
            >
              SEND ANOTHER TICKET
            </button>
            <Link to="/" className="btn btn-ox-black text-uppercase font-mono">
              RETURN HOME
            </Link>
          </div>
        )}
      </main>

      <footer className="border-top border-dark py-4 text-center text-muted small bg-light mt-auto">
        ONBOARDX COMPLIANCE & SUPPORT DESK
      </footer>
    </div>
  );
};

export default ContactSupport;
