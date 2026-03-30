import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with credentials support
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // CRITICAL: Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add headers
api.interceptors.request.use(
    (config) => {
        // Add CSRF token if available
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf_token='))
            ?.split('=')[1];
        
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 401 and not already retrying, try refresh
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/api/auth/refresh'
        ) {
            originalRequest._retry = true;
            
            try {
                // Get refresh token from secure storage
                const refreshToken = localStorage.getItem('refresh_token');
                
                if (!refreshToken) {
                    // No refresh token, redirect to login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                
                // Try to refresh
                const { data } = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    { refresh_token: refreshToken },
                    { withCredentials: true }
                );
                
                // Update refresh token
                localStorage.setItem('refresh_token', data.refresh_token);
                
                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
