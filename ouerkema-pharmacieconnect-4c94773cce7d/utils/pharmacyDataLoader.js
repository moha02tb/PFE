import pharmaciesData from '../data/pharmacies.json';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Get API base URL from configuration
const API_BASE_URL = API_CONFIG.baseURL;

console.log(`[Pharmacy Loader] Initialized with API URL: ${API_BASE_URL}`);

const formatDateParam = (value) => {
  if (!(value instanceof Date)) return value;

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetch pharmacies from backend API
 * @param {number} skip - Number of records to skip (pagination)
 * @param {number} limit - Number of records to fetch (pagination)
 * @returns {Promise<Array>} Array of pharmacy objects from API
 */
export const fetchPharmaciesFromAPI = async (skip = 0, limit = 100) => {
  try {
    console.log(`[API] Fetching pharmacies from: ${API_BASE_URL}${API_CONFIG.endpoints.pharmacies}`);
    
    const response = await axios.get(`${API_BASE_URL}${API_CONFIG.endpoints.pharmacies}`, {
      params: { skip, limit },
      timeout: API_CONFIG.timeout,
    });

    console.log(`[API] Successfully fetched ${response.data?.length || 0} pharmacies`);
    
    // Transform API data to match mobile app format
    return response.data.map((pharmacy, index) => ({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address || 'No address available',
      phone: pharmacy.phone || '',
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      governorate: pharmacy.governorate || 'Tunisia',
      osm_id: pharmacy.osm_id,
      osm_type: pharmacy.osm_type,
      isOpen: true, // Default to open - can be enhanced with operating hours data
      emergency: false, // Can be enhanced based on data
      coordinates: {
        latitude: pharmacy.latitude,
        longitude: pharmacy.longitude,
      },
    }));
  } catch (error) {
    console.error('[API] Error fetching pharmacies from API:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    return null;
  }
};

/**
 * Fetch nearby pharmacies from backend API.
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @param {number} limit - Max pharmacies to return
 * @returns {Promise<Array|null>} Nearby pharmacies or null on failure
 */
export const fetchNearbyPharmaciesFromAPI = async (
  latitude,
  longitude,
  radiusKm = 10,
  limit = 50
) => {
  try {
    console.log(
      `[API] Fetching nearby pharmacies from: ${API_BASE_URL}${API_CONFIG.endpoints.pharmaciesNearby}`
    );

    const response = await axios.get(`${API_BASE_URL}${API_CONFIG.endpoints.pharmaciesNearby}`, {
      params: {
        lat: latitude,
        lon: longitude,
        radius_km: radiusKm,
        limit,
      },
      timeout: API_CONFIG.timeout,
    });

    console.log(`[API] Successfully fetched ${response.data?.length || 0} nearby pharmacies`);

    return response.data.map((pharmacy) => ({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address || 'No address available',
      phone: pharmacy.phone || '',
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      governorate: pharmacy.governorate || 'Tunisia',
      osm_id: pharmacy.osm_id,
      osm_type: pharmacy.osm_type,
      distanceKm: pharmacy.distance_km,
      isOpen: true,
      emergency: false,
      coordinates: {
        latitude: pharmacy.latitude,
        longitude: pharmacy.longitude,
      },
    }));
  } catch (error) {
    console.error('[API] Error fetching nearby pharmacies:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    return null;
  }
};

export const trackSearchEvent = async ({
  eventType,
  queryText = null,
  locationLabel = null,
  governorate = null,
  latitude = null,
  longitude = null,
  resultCount = null,
}) => {
  try {
    await axios.post(
      `${API_BASE_URL}${API_CONFIG.endpoints.analyticsSearchEvents}`,
      {
        event_type: eventType,
        query_text: queryText,
        location_label: locationLabel,
        governorate,
        latitude,
        longitude,
        result_count: resultCount,
      },
      {
        timeout: API_CONFIG.timeout,
      }
    );
  } catch (error) {
    console.warn('[Analytics] Failed to track search event:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    });
  }
};

export const fetchCalendarPharmaciesFromAPI = async (date) => {
  try {
    const dateParam = formatDateParam(date);
    console.log(`[API] Fetching garde schedule from: ${API_BASE_URL}${API_CONFIG.endpoints.gardes}`);

    const response = await axios.get(`${API_BASE_URL}${API_CONFIG.endpoints.gardes}`, {
      params: { date_value: dateParam, limit: 200 },
      timeout: API_CONFIG.timeout,
    });

    console.log(`[API] Successfully fetched ${response.data?.length || 0} garde rows`);

    return response.data.map((garde, index) => {
      const pharmacy = garde.pharmacy || {};
      const scheduleLabel = garde.start_time && garde.end_time
        ? `${garde.start_time} - ${garde.end_time}`
        : 'Hours pending';

      return {
        id: pharmacy.id || `garde-${garde.id}-${index}`,
        gardeId: garde.id,
        name: pharmacy.name || garde.pharmacy_name,
        address: pharmacy.address || garde.city || garde.governorate || 'Address unavailable',
        phone: pharmacy.phone || '',
        latitude: pharmacy.latitude ?? null,
        longitude: pharmacy.longitude ?? null,
        governorate: pharmacy.governorate || garde.governorate || 'Tunisia',
        osm_id: pharmacy.osm_id,
        osm_type: pharmacy.osm_type,
        isOpen: true,
        emergency: true,
        openHours: scheduleLabel,
        shiftType: garde.shift_type || null,
        notes: garde.notes || null,
        coordinates: pharmacy.latitude != null && pharmacy.longitude != null
          ? {
            latitude: pharmacy.latitude,
            longitude: pharmacy.longitude,
          }
          : null,
      };
    });
  } catch (error) {
    console.error('[API] Error fetching garde schedule:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    return null;
  }
};

/**
 * Load pharmacy data from backend API with fallback to static data
 * @param {Function} t - Translation function from react-i18next
 * @param {boolean} useAPI - Whether to try fetching from API first
 * @returns {Promise<Array>} Array of pharmacy objects
 */
export const loadPharmaciesAsync = async (t, useAPI = true, userCoords = null) => {
  if (useAPI) {
    console.log('[Pharmacy] Attempting to load from API...');
    try {
      if (userCoords?.latitude && userCoords?.longitude) {
        const nearby = await fetchNearbyPharmaciesFromAPI(
          userCoords.latitude,
          userCoords.longitude,
          20,
          100
        );
        if (nearby && nearby.length > 0) {
          console.log(`[Pharmacy] ✓ Loaded ${nearby.length} nearby pharmacies from API`);
          return nearby;
        }
      }

      const apiPharmacies = await fetchPharmaciesFromAPI(0, 500);
      if (apiPharmacies && apiPharmacies.length > 0) {
        console.log(`[Pharmacy] ✓ Loaded ${apiPharmacies.length} pharmacies from API`);
        return apiPharmacies;
      } else {
        console.warn('[Pharmacy] API returned empty result');
      }
    } catch (error) {
      console.warn('[Pharmacy] Failed to load from API:', error.message);
    }
  }

  // Fallback to static data
  console.log('[Pharmacy] Falling back to static data...');
  try {
    const staticData = loadPharmacies(t);
    console.log(`[Pharmacy] ✓ Loaded ${staticData.length} static pharmacies`);
    return staticData;
  } catch (error) {
    console.error('[Pharmacy] Failed to load static data:', error);
    return [];
  }
};

/**
 * Load pharmacy data and process it with translations (Static data)
 * @param {Function} t - Translation function from react-i18next
 * @param {Date} date - Selected date (for future filtering by date)
 * @returns {Array} Array of pharmacy objects with translated names and addresses
 */
export const loadPharmacies = (t, date = new Date()) => {
  return pharmaciesData.map((pharmacy) => ({
    ...pharmacy,
    name: t(pharmacy.nameKey),
    address: t(pharmacy.addressKey),
    openHours: pharmacy.openHoursKey ? t(pharmacy.openHoursKey) : pharmacy.openHours,
  }));
};

/**
 * Get pharmacy by ID
 * @param {number} id - Pharmacy ID
 * @param {Function} t - Translation function
 * @returns {Object|null} Pharmacy object or null if not found
 */
export const getPharmacyById = (id, t) => {
  const pharmacy = pharmaciesData.find((p) => p.id === id);
  if (!pharmacy) return null;

  return {
    ...pharmacy,
    name: t(pharmacy.nameKey),
    address: t(pharmacy.addressKey),
    openHours: pharmacy.openHoursKey ? t(pharmacy.openHoursKey) : pharmacy.openHours,
  };
};

/**
 * Filter pharmacies by search term
 * @param {Array} pharmacies - Array of pharmacy objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered pharmacy array
 */
export const filterPharmacies = (pharmacies, searchTerm) => {
  if (!searchTerm.trim()) return pharmacies;

  const term = searchTerm.toLowerCase();
  return pharmacies.filter(
    (pharmacy) =>
      pharmacy.name.toLowerCase().includes(term) || pharmacy.address.toLowerCase().includes(term)
  );
};

/**
 * Get open pharmacies only
 * @param {Array} pharmacies - Array of pharmacy objects
 * @returns {Array} Array of open pharmacies
 */
export const getOpenPharmacies = (pharmacies) => {
  return pharmacies.filter((pharmacy) => pharmacy.isOpen);
};

/**
 * Get emergency pharmacies only
 * @param {Array} pharmacies - Array of pharmacy objects
 * @returns {Array} Array of emergency pharmacies
 */
export const getEmergencyPharmacies = (pharmacies) => {
  return pharmacies.filter((pharmacy) => pharmacy.emergency);
};
