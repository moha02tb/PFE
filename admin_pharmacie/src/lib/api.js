import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Always send access token in Authorization header
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('access_token');
        
        // Send access token in Authorization header for all requests
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 with token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Only attempt refresh once per request
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/api/auth/refresh') &&
            !originalRequest.url?.includes('/api/auth/login')
        ) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                
                if (!refreshToken) {
                    // No refresh token available, redirect to login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                
                // Refresh the token
                const { data } = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    { refresh_token: refreshToken },
                    { withCredentials: true }
                );
                
                // Store new tokens
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                
                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                
                // Retry original request with new token
                return api(originalRequest);
            } catch (refreshError) {
                // Token refresh failed, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
