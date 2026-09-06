import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import GridScan from '../../components/GridScan';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company_name: '',
    phone_number: '',
    role: 'PARTNER'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const newUser = await register(formData);
      addToast('Partner account created successfully!');
      if (newUser.role === 'PARTNER') navigate('/partner');
      else if (newUser.role === 'REVIEWER') navigate('/reviewer');
      else if (newUser.role === 'ADMIN') navigate('/admin');
      else navigate('/partner');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed. Please check your information.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5 position-relative"
    >
      <GridScan />
      <div className="w-100 position-relative animate-fade-in-up" style={{ maxWidth: 480, zIndex: 1 }}>


        <div className="text-center mb-4">
          <Link to="/" className="text-decoration-none">
            <div
              className="d-inline-flex align-items-center justify-content-center text-white mb-2 fw-bold"
              style={{ width: 44, height: 44, backgroundColor: '#000000', borderRadius: '2px', fontSize: '1.25rem' }}
            >
              ●
            </div>
            <h2 className="font-mono fw-bold mb-1 tracking-tight text-uppercase text-dark">
              CREATE ACCOUNT
            </h2>
          </Link>
          <p className="font-mono text-muted small">REGISTER ONBOARDX PARTNER WORKSPACE</p>
        </div>

        <div className="p-4 border border-dark bg-white rounded-1">
          {errorMsg && (
            <div className="p-3 mb-4 border border-dark bg-dark text-white font-mono small rounded-1">
              REGISTRATION ERROR: {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                  FIRST NAME
                </label>
                <input
                  type="text"
                  name="first_name"
                  className="form-control font-mono"
                  placeholder="Rajesh"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-6">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                  LAST NAME
                </label>
                <input
                  type="text"
                  name="last_name"
                  className="form-control font-mono"
                  placeholder="Sharma"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                COMPANY NAME
              </label>
              <input
                type="text"
                name="company_name"
                className="form-control font-mono"
                placeholder="Apex Logistics India Pvt Ltd"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                  USERNAME
                </label>
                <input
                  type="text"
                  name="username"
                  className="form-control font-mono"
                  placeholder="apex_partner"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-6">
                <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                  PHONE NUMBER (+91)
                </label>
                <input
                  type="text"
                  name="phone_number"
                  className="form-control font-mono"
                  placeholder="+91 98765 43210"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                className="form-control font-mono"
                placeholder="partner@apexlogistics.in"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="font-mono text-uppercase small fw-bold text-dark mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                className="form-control font-mono mb-1"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1 font-mono" style={{ fontSize: '0.65rem' }}>
                    <span className="text-muted">STRENGTH:</span>
                    <span className="fw-bold text-dark text-uppercase">
                      {formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? 'STRONG' : 'WEAK / MEDIUM'}
                    </span>
                  </div>
                  <div className="progress rounded-0" style={{ height: 4, backgroundColor: '#E9ECEF' }}>
                    <div
                      className="progress-bar bg-black"
                      role="progressbar"
                      style={{
                        width: `${Math.min(100, (formData.password.length / 8) * 100)}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 form-check font-mono small">
              <input type="checkbox" className="form-check-input rounded-0 border-dark" id="termsCheck" required />
              <label className="form-check-label text-muted" htmlFor="termsCheck" style={{ fontSize: '0.75rem' }}>
                I AGREE TO THE <Link to="/terms" className="text-dark fw-bold">TERMS OF SERVICE</Link> AND <Link to="/privacy" className="text-dark fw-bold">PRIVACY POLICY</Link>
              </label>
            </div>


            <button
              type="submit"
              className="btn btn-ox-black font-mono text-uppercase w-100 py-2.5"
              disabled={submitting}
            >
              {submitting ? 'CREATING ACCOUNT...' : 'REGISTER PARTNER →'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 font-mono text-muted small">
          ALREADY REGISTERED?{' '}
          <Link to="/login" className="fw-bold text-dark text-decoration-underline ms-1">
            SIGN IN HERE →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
