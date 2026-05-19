import React, { createContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return false;
    });
    const [user, setUser] = useState(() => {
        // Restore user from localStorage if it exists
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const persistUser = useCallback((userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    useEffect(() => {
        let mounted = true;

        const restoreSession = async () => {
            setLoading(true);
            try {
                const response = await api.get('/api/auth/me');
                if (!mounted) return;
                persistUser(response.data);
                setIsAuthenticated(true);
            } catch {
                if (!mounted) return;
                setIsAuthenticated(false);
                setUser(null);
                localStorage.removeItem('user');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        restoreSession();

        return () => {
            mounted = false;
        };
    }, [persistUser]);

    const refreshUser = useCallback(async () => {
        const response = await api.get('/api/auth/me');
        return persistUser(response.data);
    }, [persistUser]);

    const updateProfile = useCallback(async (profileData) => {
        setError(null);
        setLoading(true);

        try {
            const response = await api.put('/api/auth/me', profileData);
            return { success: true, user: persistUser(response.data) };
        } catch (err) {
            const message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Unable to update profile. Please try again.';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [persistUser]);

    // Login function
    const login = useCallback(async (email, password) => {
        setError(null);
        setLoading(true);

        try {
            // Call login endpoint
            await api.post('/api/auth/login', {
                email,
                password,
            });

            // Fetch user data from /me endpoint with new token
            const meResponse = await api.get('/api/auth/me');
            const userData = meResponse.data;

            // Store user data
            persistUser(userData);
            setIsAuthenticated(true);

            return { success: true };
        } catch (err) {
            const baseURL = api?.defaults?.baseURL;
            const isNetworkError = !err.response;
            const message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                (isNetworkError
                    ? `Unable to reach backend API${baseURL ? ` (${baseURL})` : ''}. Check that the server is running and VITE_API_URL is correct.`
                    : err.message) ||
                'Login failed. Please try again.';
            setError(message);
            
            // Log full error details for debugging
            console.error('Backend login error:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                message: err.message,
                url: err.config?.url,
                baseURL,
            });
            
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [persistUser]);

    // Logout function
    const logout = useCallback(async () => {
        try {
            await api.post('/api/auth/logout', {});
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Clear client state and storage
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('user');
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                loading,
                error,
                login,
                logout,
                refreshUser,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
