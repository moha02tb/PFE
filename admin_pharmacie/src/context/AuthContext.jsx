import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // Check if user was previously authenticated
        return !!localStorage.getItem('refresh_token');
    });
    const [user, setUser] = useState(() => {
        // Restore user from localStorage if it exists
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // No initial auth check - rely on stored tokens

    // Login function
    const login = useCallback(async (email, password) => {
        setError(null);
        setLoading(true);

        try {
            // Call login endpoint
            const response = await api.post('/api/auth/login', {
                email,
                password,
            });

            // Store refresh token in localStorage
            localStorage.setItem('refresh_token', response.data.refresh_token);

            // Create user object from login response
            const userData = {
                id: response.data.user_id || 1,
                email: email,
                role: response.data.role || 'ADMIN',
            };

            // Store user data
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
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
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            
            // Call logout endpoint if it exists
            if (refreshToken) {
                await api.post('/api/auth/logout', {
                    refresh_token: refreshToken,
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Clear client state and storage
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('refresh_token');
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
