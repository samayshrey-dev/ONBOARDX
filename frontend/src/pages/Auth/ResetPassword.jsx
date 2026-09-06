import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: 'NONE', color: '#DEE2E6' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  switch (score) {
    case 1:
      return { score: 25, label: 'WEAK', color: '#212529' };
    case 2:
      return { score: 50, label: 'FAIR', color: '#495057' };
    case 3:
      return { score: 75, label: 'STRONG', color: '#000000' };
    case 4:
      return { score: 100, label: 'EXCELLENT', color: '#000000' };
    default:
      return { score: 15, label: 'WEAK', color: '#212529' };
  }
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const uidb64 = searchParams.get('uidb64') || '';
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!uidb64 || !token) {
      setErrorMsg('Invalid or missing password reset token parameters.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('auth/password-reset-confirm/', {
        uidb64,
        token,
        new_password: newPassword,
      });
      addToast('Password reset successfully. You may now sign in.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to reset password. Token may be expired.';
      setErrorMsg(msg);
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
          <p className="font-mono text-muted small">CREATE NEW SECURE PASSWORD</p>
        </div>

        <div className="p-4 border border-dark bg-white rounded-1 shadow-sm">
          {errorMsg && (
            <div className="p-3 mb-4 border border-dark bg-dark text-white font-mono small rounded-1">
              RESET ERROR: {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-0 d-block" style={{ fontSize: '0.75rem' }}>
                  NEW PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-link p-0 text-muted font-mono text-decoration-none"
                  style={{ fontSize: '0.7rem' }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control font-mono mb-2"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              {/* Password Strength Indicator */}
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1 font-mono" style={{ fontSize: '0.6875rem' }}>
                  <span className="text-muted">STRENGTH:</span>
                  <span className="fw-bold text-dark text-uppercase">{strength.label}</span>
                </div>
                <div className="progress rounded-0" style={{ height: 4, backgroundColor: '#E9ECEF' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${strength.score}%`,
                      backgroundColor: strength.color,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                CONFIRM NEW PASSWORD
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control font-mono"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-ox-black font-mono text-uppercase w-100 py-2.5"
              disabled={submitting}
            >
              {submitting ? 'UPDATING PASSWORD...' : 'RESET PASSWORD →'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 font-mono text-muted small">
          REMEMBERED YOUR CREDENTIALS?{' '}
          <Link to="/login" className="fw-bold text-dark text-decoration-underline ms-1">
            SIGN IN →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
