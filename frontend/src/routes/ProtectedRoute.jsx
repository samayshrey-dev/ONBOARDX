import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GridScan from '../components/GridScan';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 font-mono position-relative">
        <GridScan />
        <div className="p-4 border border-dark bg-white rounded-1 shadow-sm text-center position-relative" style={{ zIndex: 1, maxWidth: 360 }}>
          <div className="spinner-border text-dark mb-3" style={{ width: '2rem', height: '2rem', borderWidth: '2px' }} role="status">
            <span className="visually-hidden">Loading ONBOARDX...</span>
          </div>
          <div className="small fw-bold text-uppercase tracking-wider">VERIFYING ONBOARDX SESSION...</div>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};


export default ProtectedRoute;
