import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import logger from '../utils/logger';
import { API_CONFIG } from '../config/api';

// Create Auth Context
const AuthContext = createContext({});

// Configuration
// Use machine IP for development (192.168.1.6:8000)
// Change this if your machine IP is different
const BACKEND_URL = API_CONFIG.baseURL;
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

// Create axios instance with auth
const createApiClient = (accessToken) => {
  const instance = axios.create({
    baseURL: BACKEND_URL,
    timeout: 10000,
  });

  // Add request interceptor to include auth token
  instance.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - should trigger logout
        // This will be handled by the context's refresh mechanism
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

  const clearAuthState = useCallback(async () => {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setPendingVerificationEmail(null);
  }, []);

  // Initialize auth from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUserData = await AsyncStorage.getItem(USER_DATA_KEY);

        if (storedAccessToken && storedRefreshToken) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          if (storedUserData) {
            setUser(JSON.parse(storedUserData));
          }

          // Always refresh current profile from backend when a session exists.
          try {
            const apiClient = createApiClient(storedAccessToken);
            const meResponse = await apiClient.get('/api/auth/me');
            const meData = meResponse.data;
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(meData));
            setUser(meData);
          } catch (refreshErr) {
            // Access token may be expired: try refresh token once, then retry /me.
            const is401 = refreshErr?.response?.status === 401;
            if (is401 && storedRefreshToken) {
              try {
                const apiClient = createApiClient(null);
                const refreshResp = await apiClient.post('/api/auth/refresh', {
                  refresh_token: storedRefreshToken,
                });
                const newAccessToken = refreshResp?.data?.access_token;

                if (!newAccessToken) {
                  throw new Error('No access token returned by refresh endpoint');
                }

                await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
                setAccessToken(newAccessToken);

                const apiClientWithNewToken = createApiClient(newAccessToken);
                const meRetry = await apiClientWithNewToken.get('/api/auth/me');
                const meData = meRetry.data;
                await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(meData));
                setUser(meData);
              } catch (retryErr) {
                logger.error('AuthContext', 'Session restore failed after refresh retry:', retryErr);
                await clearAuthState();
              }
            } else {
              logger.error('AuthContext', 'Failed to refresh profile during init:', refreshErr);
            }
          }
        }
      } catch (err) {
        logger.error('AuthContext', 'Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuthState]);

  // Email/Password Login handler
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const apiClient = createApiClient(null);

      // Login with email and password
      const response = await apiClient.post('/api/auth/login', {
        email: email,
        password: password,
      });

      const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;

      // Fetch user data using new token
      const apiClientWithToken = createApiClient(newAccessToken);
      const userResponse = await apiClientWithToken.get('/api/auth/me');
      const userData = userResponse.data;

      // Store tokens and user data
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

      // Update state
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      setPendingVerificationEmail(null);

      return { success: true, user: userData };
    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');
      const isNetwork = err.code === 'ERR_NETWORK';
      const errorMessage =
        err.response?.data?.detail ||
        (isTimeout
          ? 'Login timeout: please check backend URL and network connectivity.'
          : isNetwork
            ? 'Network error: backend not reachable from mobile app.'
            : err.message || 'Login failed');
      if (
        email &&
        typeof errorMessage === 'string' &&
        errorMessage.toLowerCase().includes('verify your email')
      ) {
        setPendingVerificationEmail(email);
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      await logout();
      return false;
    }

    try {
      const apiClient = createApiClient(null);
      const response = await apiClient.post('/api/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token: newAccessToken } = response.data;

      // Update stored token
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      setAccessToken(newAccessToken);

      return true;
    } catch (err) {
      logger.error('AuthContext', 'Token refresh failed:', err);
      await logout();
      return false;
    }
  }, [refreshToken]);

  // Email/Password Register handler
  const register = useCallback(async (email, password, username) => {
    setLoading(true);
    setError(null);

    try {
      const apiClient = createApiClient(null);

      // Register new user
      const response = await apiClient.post('/api/auth/register', {
        email: email,
        password: password,
        username: username || email,
      });

      return {
        success: true,
        requiresVerification: !!response.data?.requires_verification,
        email: response.data?.email || email,
        message:
          response.data?.message || 'Registration successful. Please verify your email before signing in.',
      };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEmailCode = useCallback(async (email, code) => {
    setLoading(true);
    setError(null);

    try {
      const apiClient = createApiClient(null);
      const response = await apiClient.post('/api/auth/verify-email', {
        email,
        code,
      });
      setPendingVerificationEmail(null);

      return {
        success: true,
        message: response.data?.message || 'Email verified successfully. You can now sign in.',
      };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const beginEmailVerification = useCallback((email) => {
    setPendingVerificationEmail(email || null);
  }, []);

  const clearPendingVerification = useCallback(() => {
    setPendingVerificationEmail(null);
  }, []);

  const resendVerificationEmail = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      const apiClient = createApiClient(null);
      const response = await apiClient.post('/api/auth/resend-verification', { email });
      return {
        success: true,
        message: response.data?.message || 'Verification email sent',
      };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unable to resend verification email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint if we have a token
      if (accessToken) {
        const apiClient = createApiClient(accessToken);
        try {
          await apiClient.post('/api/auth/logout', {
            refresh_token: refreshToken,
          });
        } catch (err) {
          // Even if logout fails on server, clear local state
          logger.error('AuthContext', 'Server logout failed:', err);
        }
      }

      // Clear stored data/state
      await clearAuthState();
      setError(null);
    } catch (err) {
      logger.error('AuthContext', 'Logout failed:', err);
    }
  }, [accessToken, refreshToken, clearAuthState]);

  // Create API client with current token
  const apiClient = accessToken ? createApiClient(accessToken) : null;

  // Update local user profile fields (mobile-side profile)
  const updateUserProfile = useCallback(
    async (updates) => {
      try {
        let serverUser = null;

        if (accessToken) {
          const client = createApiClient(accessToken);
          const response = await client.put('/api/auth/me', updates || {});
          serverUser = response.data;
        }

        const nextUser = { ...(user || {}), ...(updates || {}), ...(serverUser || {}) };
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
        return { success: true, user: nextUser };
      } catch (err) {
        logger.error('AuthContext', 'Failed to update profile:', err);
        return { success: false, error: err.response?.data?.detail || 'Failed to update profile' };
      }
    },
    [user, accessToken]
  );

  const value = {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    pendingVerificationEmail,
    isAuthenticated: !!user && !!accessToken,

    // Methods
    login,
    register,
    verifyEmailCode,
    resendVerificationEmail,
    beginEmailVerification,
    clearPendingVerification,
    refreshAccessToken,
    logout,
    updateUserProfile,
    apiClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
