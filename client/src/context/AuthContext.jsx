import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { getToken, setToken, clearToken, updateTokenInPlace } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent Boot Authentication Check Sequence
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const { data } = await apiClient.get('/users/me');
          setUser(data.data.user);
        } catch (error) {
          console.error('[Auth Context Boundary] Automatic initialization handshake failed.');
          clearToken();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginUser = async (email, password, rememberMe = true) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      setToken(data.accessToken, rememberMe);
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
      // No token yet — the account is unverified until the OTP is confirmed.
      return { success: true, email: data.data.email };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration sequence aborted.'
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-email', { email, otp });
      setToken(data.accessToken, true);
      setUser(data.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationOtp = async (email) => {
    try {
      const { data } = await apiClient.post('/auth/resend-verification-otp', { email });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Could not resend the OTP right now.'
      };
    }
  };

  const googleAuth = async (credential) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/google', { credential });
      setToken(data.accessToken, true);
      setUser(data.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google sign-in failed.'
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
      clearToken();
      setUser(null);
    }
  };

  const refreshUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, verifyEmailOtp, resendVerificationOtp, googleAuth, logoutUser, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth hook executed outside structural AuthProvider scope.');
  return context;
};
