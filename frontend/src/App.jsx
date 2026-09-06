import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Public Landing, Legal & Auth Pages
import LandingHome from './pages/Public/LandingHome';
import PrivacyPolicy from './pages/Public/PrivacyPolicy';
import TermsOfService from './pages/Public/TermsOfService';
import ContactSupport from './pages/Public/ContactSupport';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Error Pages
import NotFound from './pages/Error/NotFound';
import Forbidden from './pages/Error/Forbidden';
import ServerError from './pages/Error/ServerError';


// Partner Pages
import PartnerDashboard from './pages/Partner/PartnerDashboard';
import PartnerApplication from './pages/Partner/PartnerApplication';
import PartnerDocuments from './pages/Partner/PartnerDocuments';
import PartnerActivity from './pages/Partner/PartnerActivity';
import PartnerProfile from './pages/Partner/PartnerProfile';

// Reviewer & Admin Pages
import ReviewerDashboard from './pages/Reviewer/ReviewerDashboard';
import ReviewerApplicationReview from './pages/Reviewer/ReviewerApplicationReview';
import AdminDashboard from './pages/Admin/AdminDashboard';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import GridScan from './components/GridScan';


const DashboardRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 font-mono position-relative">
        <GridScan />
        <div className="p-4 border border-dark bg-white rounded-1 shadow-sm text-center position-relative" style={{ zIndex: 1, maxWidth: 360 }}>
          <div className="spinner-border text-dark mb-3" style={{ width: '2rem', height: '2rem', borderWidth: '2px' }} role="status">
            <span className="visually-hidden">Loading ONBOARDX...</span>
          </div>
          <div className="small fw-bold text-uppercase tracking-wider">REDIRECTING WORKSPACE...</div>
        </div>
      </div>
    );
  }


  if (!user) return <Navigate to="/login" replace />;
  if (role === 'PARTNER') return <Navigate to="/partner" replace />;
  if (role === 'REVIEWER') return <Navigate to="/reviewer" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Home & Auth Routes */}
            <Route path="/" element={<LandingHome />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<ContactSupport />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/500" element={<ServerError />} />


            {/* Protected Application Routes inside Reusable Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>

                {/* Partner Routes */}
                <Route element={<RoleRoute allowedRoles={['PARTNER']} />}>
                  <Route path="/partner" element={<PartnerDashboard />} />
                  <Route path="/partner/application" element={<PartnerApplication />} />
                  <Route path="/partner/documents" element={<PartnerDocuments />} />
                  <Route path="/partner/activity" element={<PartnerActivity />} />
                  <Route path="/partner/profile" element={<PartnerProfile />} />
                </Route>

                {/* Reviewer Routes */}
                <Route element={<RoleRoute allowedRoles={['REVIEWER', 'ADMIN']} />}>
                  <Route path="/reviewer" element={<ReviewerDashboard />} />
                  <Route path="/reviewer/application/:id" element={<ReviewerApplicationReview />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

              </Route>
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
