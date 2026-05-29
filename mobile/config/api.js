/**
 * API Configuration for the mobile app.
 *
 * Resolution order for base URL:
 * 1) EXPO_PUBLIC_API_URL / EXPO_PUBLIC_CHATBOT_API_URL (if explicitly provided)
 * 2) Expo dev host IP (works on physical devices when backend uses --host 0.0.0.0)
 * 3) Platform fallback (Android emulator: 10.0.2.2, local simulator/web: 127.0.0.1)
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = '8000';
const CHATBOT_API_PORT = '8001';
const ANDROID_EMULATOR_HOST = '10.0.2.2';
const LOCALHOST_HOST = '127.0.0.1';

const normalizeBaseURL = (url) => `${url || ''}`.trim().replace(/\/+$/, '');

const getExpoHostIp = () => {
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.debuggerHost ||
    '';

  if (!hostUri) return null;
  return hostUri.split(':')[0] || null;
};

const resolveBaseURL = (explicitUrl, port) => {
  const explicit = normalizeBaseURL(explicitUrl);
  if (explicit) {
    return explicit;
  }

  const expoHostIp = getExpoHostIp();
  if (expoHostIp) {
    return `http://${expoHostIp}:${port}`;
  }

  // Android emulator can use host loopback alias.
  if (Platform.OS === 'android') {
    return `http://${ANDROID_EMULATOR_HOST}:${port}`;
  }

  return `http://${LOCALHOST_HOST}:${port}`;
};

export const API_CONFIG = {
  // Base URL for all API requests
  baseURL: resolveBaseURL(process.env.EXPO_PUBLIC_API_URL, API_PORT),

  // API endpoints
  endpoints: {
    // Public endpoints (no authentication required)
    pharmacies: '/api/pharmacies',
    pharmaciesSearch: '/api/pharmacies/search',
    pharmaciesNearby: '/api/pharmacies/nearby',
    pharmaciesCount: '/api/pharmacies/count',
    pharmacyById: (id) => `/api/pharmacies/${id}`,
    gardes: '/api/gardes',
    medicines: '/api/medicines',
    medicinesCount: '/api/medicines/count',
    medicineByCodePct: (codePct) => `/api/medicines/${codePct}`,
    analyticsSearchEvents: '/api/analytics/search-events',

    // Admin endpoints (authentication required)
    adminPharmacies: '/api/admin/pharmacies',
    adminUpload: '/api/admin/upload',
  },

  // Request timeout in milliseconds
  timeout: 30000,

  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second base delay (exponential backoff)
  },
};

export const CHATBOT_API_CONFIG = {
  baseURL: resolveBaseURL(process.env.EXPO_PUBLIC_CHATBOT_API_URL, CHATBOT_API_PORT),

  endpoints: {
    answer: '/answer',
    health: '/health',
    ready: '/ready',
  },

  timeout: 20000,
};

// Convenience export for the base URL
export const API_BASE_URL = API_CONFIG.baseURL;

// Log configuration on module load
console.log(`[API Config] Platform: ${Platform.OS}`);
console.log(`[API Config] Base URL: ${API_CONFIG.baseURL}`);
console.log(`[API Config] Chatbot URL: ${CHATBOT_API_CONFIG.baseURL}`);
