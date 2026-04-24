/**
 * API Configuration for the mobile app.
 *
 * Resolution order for base URL:
 * 1) EXPO_PUBLIC_API_URL (if explicitly provided)
 * 2) Expo dev host IP (works on physical devices)
 * 3) Platform fallback (Android emulator: 10.0.2.2)
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = '8000';
const FALLBACK_DEV_IP = '192.168.1.6';

const getExpoHostIp = () => {
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.debuggerHost ||
    '';

  if (!hostUri) return null;
  return hostUri.split(':')[0] || null;
};

const resolveBaseURL = () => {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) {
    return explicit;
  }

  const expoHostIp = getExpoHostIp();
  if (expoHostIp) {
    return `http://${expoHostIp}:${API_PORT}`;
  }

  // Android emulator can use host loopback alias.
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }

  // On iOS devices, localhost points to the phone itself and causes timeouts.
  // Use LAN fallback unless EXPO_PUBLIC_API_URL is explicitly set.
  return `http://${FALLBACK_DEV_IP}:${API_PORT}`;
};

export const API_CONFIG = {
  // Base URL for all API requests
  baseURL: resolveBaseURL(),
  
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
  timeout: 10000,
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },
};

// Convenience export for the base URL
export const API_BASE_URL = API_CONFIG.baseURL;

// Log configuration on module load
console.log(`[API Config] Platform: ${Platform.OS}`);
console.log(`[API Config] Base URL: ${API_CONFIG.baseURL}`);
