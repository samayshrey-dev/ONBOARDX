import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetData, setResetData] = useState(null);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post('auth/password-reset/', { email });
      setSubmitted(true);
      setResetData(res.data);
      addToast('Password reset token generated successfully.', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to process password reset request.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{ backgroundColor: '#FFFFFF' }}

    >
      <div className="w-100" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <Link to="/" className="text-decoration-none">
            <div
              className="d-inline-flex align-items-center justify-content-center text-white mb-2 fw-bold"
              style={{ width: 44, height: 44, backgroundColor: '#000000', borderRadius: '2px', fontSize: '1.25rem' }}
            >
              ●
            </div>
            <h2 className="font-mono fw-bold mb-1 tracking-tight text-uppercase text-dark">
              ONBOARDX
            </h2>
          </Link>
          <p className="font-mono text-muted small">PASSWORD RECOVERY SYSTEM</p>
        </div>

        <div className="p-4 border border-dark bg-white rounded-1 shadow-sm">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <h5 className="font-mono fw-bold text-dark text-uppercase mb-2">FORGOT YOUR PASSWORD?</h5>
              <p className="font-mono text-muted small mb-4" style={{ fontSize: '0.8125rem' }}>
                Enter your registered partner or staff email address. We will generate secure password reset instructions.
              </p>

              <div className="mb-4">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                  ACCOUNT EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  className="form-control font-mono"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-ox-black font-mono text-uppercase w-100 py-2.5"
                disabled={submitting}
              >
                {submitting ? 'GENERATING TOKEN...' : 'REQUEST PASSWORD RESET →'}
              </button>
            </form>
          ) : (
            <div>
              <div className="p-3 mb-4 border border-dark bg-light font-mono rounded-1">
                <div className="fw-bold text-dark text-uppercase small mb-1">✓ RESET LINK GENERATED</div>
                <div className="text-muted small mb-3">
                  A reset token has been cryptographically signed for <strong>{email}</strong>.
                </div>
                {resetData?.uidb64 && resetData?.token && (
                  <div className="bg-white p-2 border border-dark rounded-1 mb-2">
                    <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>DIRECT RESET TOKEN LINK:</div>
                    <Link
                      to={`/reset-password?uidb64=${resetData.uidb64}&token=${resetData.token}`}
                      className="font-mono text-dark fw-bold small text-decoration-underline text-break"
                    >
                      Click here to reset password →
                    </Link>
                  </div>
                )}
              </div>
              <Link to="/login" className="btn btn-ox-white font-mono text-uppercase w-100 py-2">
                RETURN TO LOGIN
              </Link>
            </div>
          )}
        </div>

        <div className="text-center mt-4 font-mono text-muted small">
          REMEMBERED YOUR PASSWORD?{' '}
          <Link to="/login" className="fw-bold text-dark text-decoration-underline ms-1">
            SIGN IN →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
