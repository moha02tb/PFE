import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.baseURL;

export const fetchMedicinesFromAPI = async (q = '', skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_CONFIG.endpoints.medicines}`, {
      params: { q: q || undefined, skip, limit },
      timeout: API_CONFIG.timeout,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('[API] Error fetching medicines from API:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    return null;
  }
};

export const fetchMedicineCountFromAPI = async (q = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_CONFIG.endpoints.medicinesCount}`, {
      params: { q: q || undefined },
      timeout: API_CONFIG.timeout,
    });
    return response.data?.total ?? 0;
  } catch (error) {
    console.error('[API] Error fetching medicine count:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    return 0;
  }
};

export const fetchMedicineByCodePct = async (codePct) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_CONFIG.endpoints.medicineByCodePct(codePct)}`,
      {
        timeout: API_CONFIG.timeout,
      }
    );
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching medicine detail:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    return null;
  }
};
