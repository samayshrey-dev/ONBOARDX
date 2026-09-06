import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const navContent = (
    <div className="d-flex flex-column h-100 justify-content-between">
      <div>
        <div className="d-flex align-items-center justify-content-between px-2 mb-3">
          <div className="font-mono text-uppercase text-muted tracking-wider" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
            NAVIGATION
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-sm btn-ox-ghost d-md-none p-1 font-mono"
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="d-flex flex-column gap-1">
          {role === 'PARTNER' && (
            <>
              <NavLink to="/partner" end onClick={handleNavClick} className={({ isActive }) => `ox-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-compass"></i>
                <span>Journey</span>
              </NavLink>
              <NavLink to="/partner/application" onClick={handleNavClick} className={({ isActive }) => `ox-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-file-earmark-text"></i>
                <span>Application</span>
              </NavLink>
              <NavLink to="/partner/documents" onClick={handleNavClick} className={({ isActive }) => `ox-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-folder-check"></i>
                <span>Checklist</span>
              </NavLink>
              <NavLink to="/partner/activity" onClick={handleNavClick} className={({ isActive }) => `ox-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-clock-history"></i>
                <span>Timeline</span>
              </NavLink>
              <NavLink to="/partner/profile" onClick={handleNavClick} className={({ isActive }) => `ox-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-building"></i>
                <span>Profile</span>
              </NavLink>
            </>
          )}

          {(role === 'REVIEWER' || role === 'ADMIN') && (
            <>
              <NavLink to="/reviewer" end onClick={handleNavClick} className={({ isActive }) => `ox-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-list-task"></i>
                <span>Review Queue</span>
              </NavLink>
            </>
          )}

          {role === 'ADMIN' && (
            <>
              <NavLink to="/admin" end onClick={handleNavClick} className={({ isActive }) => `ox-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-sliders"></i>
                <span>Admin Center</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div>
        <hr className="my-4 border-subtle" />
        <div className="p-3 border bg-light rounded-1">
          <div className="fw-bold text-dark mb-1 font-mono" style={{ fontSize: '0.75rem' }}>
            ONBOARDX Enterprise
          </div>
          <div className="text-muted" style={{ fontSize: '0.7rem', lineHeight: 1.4 }}>
            Stage-gated partner onboarding and approval workflow engine.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="p-3 border-end d-none d-md-block"
        style={{
          width: 240,
          minWidth: 240,
          backgroundColor: '#FFFFFF',
          borderColor: '#E4E4E7',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
          style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        >
          <div
            className="h-100 p-3 bg-white border-end shadow-lg"
            style={{ width: 260, maxWidth: '80vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
