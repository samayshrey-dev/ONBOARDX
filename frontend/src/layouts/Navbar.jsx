import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleMobile }) => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return { label: 'Admin Hub', bg: '#000000', color: '#FFFFFF' };
      case 'REVIEWER':
        return { label: 'Review Queue', bg: '#FFFFFF', color: '#000000' };
      default:
        return { label: 'Partner Workspace', bg: '#F4F4F5', color: '#64646E' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <header
      className="d-flex align-items-center justify-content-between px-4 border-bottom"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E4E4E7', height: 64 }}
    >
      <div className="d-flex align-items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="btn btn-sm btn-ox-white d-md-none font-mono text-uppercase px-2 py-1"
          aria-label="Toggle navigation menu"
        >
          ☰ MENU
        </button>

        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none text-dark">
          <div
            className="d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 32, height: 32, backgroundColor: '#000000', borderRadius: '2px', fontSize: '0.9rem' }}
          >
            ●
          </div>
          <span className="font-mono h5 mb-0 fw-bold tracking-tight text-uppercase">
            ONBOARDX
          </span>
        </Link>

        <span
          className="font-mono border border-dark px-2 py-0.5 text-uppercase"
          style={{
            backgroundColor: badge.bg,
            color: badge.color,
            fontSize: '0.65rem',
            fontWeight: 700,
            borderRadius: '2px'
          }}
        >
          {badge.label}
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="text-end d-none d-sm-block font-mono">
          <div className="fw-bold small text-uppercase" style={{ fontSize: '0.78125rem' }}>
            {user?.username || 'USER'}
          </div>
          <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
            {user?.email}
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-sm btn-ox-white font-mono text-uppercase px-3 py-1.5"
          style={{ fontSize: '0.75rem' }}
          title="Sign Out"
        >
          LOGOUT →
        </button>
      </div>
    </header>
  );
};

export default Navbar;
