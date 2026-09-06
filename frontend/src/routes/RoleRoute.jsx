import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import GridScan from '../components/GridScan';

const RoleRoute = ({ allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 font-mono position-relative">
        <GridScan />
        <div className="p-4 border border-dark bg-white rounded-1 shadow-sm text-center position-relative" style={{ zIndex: 1, maxWidth: 360 }}>
          <div className="spinner-border text-dark mb-3" style={{ width: '2rem', height: '2rem', borderWidth: '2px' }} role="status">
            <span className="visually-hidden">Loading ONBOARDX...</span>
          </div>
          <div className="small fw-bold text-uppercase tracking-wider">CHECKING ROLE PERMISSIONS...</div>
        </div>
      </div>
    );
  }


  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect user to their appropriate role home
    if (role === 'PARTNER') return <Navigate to="/partner" replace />;
    if (role === 'REVIEWER') return <Navigate to="/reviewer" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
