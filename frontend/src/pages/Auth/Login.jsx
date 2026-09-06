import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import GridScan from '../../components/GridScan';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const loggedUser = await login(username, password);
      addToast(`Session authenticated for ${loggedUser.username || 'user'}`);
      if (loggedUser.role === 'PARTNER') navigate('/partner');
      else if (loggedUser.role === 'REVIEWER') navigate('/reviewer');
      else if (loggedUser.role === 'ADMIN') navigate('/admin');
      else navigate('/partner');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 position-relative"
    >
      <GridScan />
      <div className="w-100 position-relative animate-fade-in-up" style={{ maxWidth: 420, zIndex: 1 }}>


        <div className="text-center mb-4">
          <Link to="/" className="text-decoration-none hover-scale d-inline-block">
            <div
              className="d-inline-flex align-items-center justify-content-center text-white mb-2 fw-bold shadow-sm"
              style={{ width: 44, height: 44, backgroundColor: '#000000', borderRadius: '4px', fontSize: '1.25rem' }}
            >
              ●
            </div>
            <h2 className="font-mono fw-bold mb-1 tracking-tight text-uppercase text-dark">
              ONBOARDX
            </h2>
          </Link>
          <p className="font-mono text-muted small">PARTNER ONBOARDING SYSTEM SIGN IN</p>
        </div>

        <div className="p-4 border border-dark bg-white rounded-1 hover-lift">
          {/* Quick Demo Credentials Bar */}
          <div className="mb-4 p-3 bg-light border border-dark rounded-1">
            <div className="font-mono text-uppercase text-muted mb-2 text-center small fw-bold" style={{ fontSize: '0.6875rem' }}>
              1-CLICK DEMO LOGIN:
            </div>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-sm btn-ox-white font-mono text-uppercase px-2.5 py-1"
                style={{ fontSize: '0.7rem' }}
                onClick={() => { setUsername('admin'); setPassword('AdminPassword123!'); }}
              >
                ● ADMIN
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ox-white font-mono text-uppercase px-2.5 py-1"
                style={{ fontSize: '0.7rem' }}
                onClick={() => { setUsername('reviewer'); setPassword('ReviewerPassword123!'); }}
              >
                ◐ REVIEWER
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ox-white font-mono text-uppercase px-2.5 py-1"
                style={{ fontSize: '0.7rem' }}
                onClick={() => { setUsername('partner'); setPassword('PartnerPassword123!'); }}
              >
                ○ PARTNER
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 border border-dark bg-dark text-white font-mono small rounded-1">
              AUTHENTICATION ERROR: {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                USERNAME OR EMAIL
              </label>
              <input
                type="text"
                className="form-control font-mono"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-0 d-block" style={{ fontSize: '0.75rem' }}>
                  PASSWORD
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
                className="form-control font-mono"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-end mt-1">
                <Link to="/forgot-password" className="font-mono text-muted small text-decoration-none" style={{ fontSize: '0.7rem' }}>
                  FORGOT PASSWORD?
                </Link>
              </div>
            </div>


            <button
              type="submit"
              className="btn btn-ox-black font-mono text-uppercase w-100 py-2.5"
              disabled={submitting}
            >
              {submitting ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 font-mono text-muted small">
          DON'T HAVE A PARTNER ACCOUNT?{' '}
          <Link to="/register" className="fw-bold text-dark text-decoration-underline ms-1">
            REGISTER PARTNER →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
