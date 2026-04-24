jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('../config/api', () => ({
  API_CONFIG: {
    baseURL: 'http://test-api',
    timeout: 1000,
    endpoints: {
      pharmacies: '/api/pharmacies',
      pharmaciesSearch: '/api/pharmacies/search',
      pharmaciesNearby: '/api/pharmacies/nearby',
      analyticsSearchEvents: '/api/analytics/search-events',
      gardes: '/api/gardes',
    },
  },
}));

import axios from 'axios';
import {
  createLocationSearchTarget,
  getGovernorateSearchConfig,
} from '../constants/locations';
import {
  filterPharmacies,
  loadPharmaciesAsync,
  searchPharmaciesAsync,
} from '../utils/pharmacyDataLoader';

describe('pharmacy location search helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns governorate search config from normalized names', () => {
    const config = getGovernorateSearchConfig('béja');

    expect(config).toEqual({
      id: 7,
      name: 'Beja',
      coords: { latitude: 36.7256, longitude: 9.1817 },
      radiusKm: 35,
      cities: ['Beja', 'Testour', 'Medjez el Bab'],
    });
  });

  it('creates a city search target for a zone like Zarzis', () => {
    const target = createLocationSearchTarget('zarzis');

    expect(target).toEqual({
      type: 'city',
      label: 'Zarzis',
      queryText: 'Zarzis',
      governorate: 'Medenine',
      radiusKm: 29,
      fallbackLatitude: 33.3549,
      fallbackLongitude: 10.5055,
    });
  });

  it('loads nearby pharmacies from a selected place and applies the fallback governorate label', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          id: 11,
          name: 'Pharmacie Centre',
          address: null,
          phone: null,
          latitude: 34.74,
          longitude: 10.76,
          governorate: null,
          osm_id: 987,
          osm_type: 'node',
          distance_km: 2.3,
        },
      ],
    });

    const result = await loadPharmaciesAsync(
      (value) => value,
      true,
      {
        searchCoords: { latitude: 34.7406, longitude: 10.7603 },
        radiusKm: 38,
        limit: 200,
        fallbackGovernorate: 'Sfax',
      }
    );

    expect(axios.get).toHaveBeenCalledWith('http://test-api/api/pharmacies/nearby', {
      params: {
        lat: 34.7406,
        lon: 10.7603,
        radius_km: 38,
        limit: 200,
      },
      timeout: 1000,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 11,
      governorate: 'Sfax',
      distanceKm: 2.3,
      address: 'No address available',
    });
  });

  it('filters pharmacies by governorate even when address is missing', () => {
    const result = filterPharmacies(
      [
        { id: 1, name: 'Pharmacie Centre', address: null, governorate: 'Tunis' },
        { id: 2, name: 'Pharmacie Sud', address: 'Avenue 5', governorate: 'Sfax' },
      ],
      'tunis'
    );

    expect(result).toEqual([
      { id: 1, name: 'Pharmacie Centre', address: null, governorate: 'Tunis' },
    ]);
  });

  it('searches pharmacies from the API with an optional governorate filter', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          id: 22,
          name: 'Pharmacie Centrale Tunis',
          address: 'Centre Ville',
          phone: '12345678',
          latitude: 36.8,
          longitude: 10.1,
          governorate: 'Tunis',
          osm_id: 77,
          osm_type: 'node',
        },
      ],
    });

    const result = await searchPharmaciesAsync('centrale', {
      governorate: 'Tunis',
      limit: 25,
    });

    expect(axios.get).toHaveBeenCalledWith('http://test-api/api/pharmacies/search', {
      params: {
        query: 'centrale',
        governorate: 'Tunis',
        limit: 25,
      },
      timeout: 1000,
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 22,
        name: 'Pharmacie Centrale Tunis',
        governorate: 'Tunis',
      }),
    ]);
  });
});
