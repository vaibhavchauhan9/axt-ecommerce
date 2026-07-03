import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent Boot Authentication Check Sequence
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('axt_token');
      if (token) {
        try {
          const { data } = await apiClient.get('/users/me');
          setUser(data.data.user);
        } catch (error) {
          console.error('[Auth Context Boundary] Automatic initialization handshake failed.');
          localStorage.removeItem('axt_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('axt_token', data.accessToken);
      setUser(data.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Authentication sequence failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password, phoneNumber) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', { name, email, password, phoneNumber });
      localStorage.setItem('axt_token', data.accessToken);
      setUser(data.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration sequence aborted.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('[Auth Context Boundary] Server session cleanup error.');
    } finally {
      localStorage.removeItem('axt_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logoutUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth hook executed outside structural AuthProvider scope.');
  return context;
};