import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Forbidden = () => {
  const { role, user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (role === 'PARTNER') return '/partner';
    if (role === 'REVIEWER') return '/reviewer';
    if (role === 'ADMIN') return '/admin';
    return '/';
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center px-4 text-center"
      style={{ backgroundColor: '#FFFFFF' }}

    >
      <div
        className="p-5 border border-dark bg-white shadow-sm max-w-lg w-100 rounded-1"
        style={{ maxWidth: 500 }}
      >
        <div className="font-mono text-uppercase text-muted small fw-bold mb-2">
          ONBOARDX • ACCESS CONTROL
        </div>
        <div className="ox-editorial-num text-dark mb-2" style={{ fontSize: '5rem' }}>
          403
        </div>
        <h2 className="font-mono fw-bold text-dark text-uppercase mb-3" style={{ fontSize: '1.25rem' }}>
          YOU DON'T HAVE ACCESS TO THIS PAGE.
        </h2>
        <p className="text-secondary small font-mono mb-4">
          Your current role permissions ({role || 'GUEST'}) do not grant authorization to view this section of ONBOARDX.
        </p>
        <Link
          to={getDashboardPath()}
          className="btn btn-ox-black font-mono text-uppercase px-4 py-2 text-decoration-none w-100"
        >
          RETURN TO DASHBOARD →
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;
