import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const isUsableStoredToken = (token) => {
    if (!token || typeof token !== 'string') return false;
    const trimmed = token.trim();
    if (!trimmed || trimmed.startsWith('mock_')) return false;
    return trimmed.split('.').length === 3;
};

export const authTokenStore = {
    setTokens(tokens = {}) {
        if (tokens.access_token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        }
        if (tokens.refresh_token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
        }
    },
    clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
    getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },
    hasUsableRefreshToken() {
        return isUsableStoredToken(this.getRefreshToken());
    },
};

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = authTokenStore.getAccessToken();
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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
            !originalRequest.url?.includes('/api/auth/login') &&
            authTokenStore.hasUsableRefreshToken()
        ) {
            originalRequest._retry = true;
            
            try {
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    { refresh_token: authTokenStore.getRefreshToken() },
                    { withCredentials: true }
                );
                authTokenStore.setTokens(refreshResponse.data);
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;

                return api(originalRequest);
            } catch (refreshError) {
                authTokenStore.clearTokens();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
