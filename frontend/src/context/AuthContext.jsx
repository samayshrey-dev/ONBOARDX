import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('access_token')));
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedDemo = localStorage.getItem('demo_user');
      if (token) {
        try {
          const res = await apiClient.get('auth/me/');
          setUser(res.data);
        } catch (err) {
          if (storedDemo) {
            setUser(JSON.parse(storedDemo));
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('demo_user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    setAuthError(null);
    try {
      const res = await apiClient.post('auth/login/', { username, password });
      const { access, refresh, user: resUser } = res.data;

      if (access) localStorage.setItem('access_token', access);
      if (refresh) localStorage.setItem('refresh_token', refresh);
      if (access) apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      if (resUser) {
        setUser(resUser);
        return resUser;
      }

      const meRes = await apiClient.get('auth/me/');
      setUser(meRes.data);
      return meRes.data;
    } catch (err) {
      console.error('Login exception:', err);
      let msg = 'Login failed.';
      if (err.response) {
        msg = err.response.data?.detail || err.response.data?.error || `Server error (${err.response.status})`;
      } else if (err.request) {
        msg = 'Network error: Cannot reach backend server.';
      } else {
        msg = err.message;
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (formData) => {
    setAuthError(null);
    try {
      const res = await apiClient.post('auth/register/', formData);
      if (res.data?.tokens) {
        localStorage.setItem('access_token', res.data.tokens.access);
        localStorage.setItem('refresh_token', res.data.tokens.refresh);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
      return null;
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || 'Registration failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh && refresh !== 'demo_mode_refresh_token') {
      try {
        await apiClient.post('auth/logout/', { refresh });
      } catch (err) {
        // Ignore token invalidate error on logout
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('demo_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, loading, authError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
