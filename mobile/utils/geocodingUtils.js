import axios from 'axios';
import logger from './logger';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

/**
 * Geocode a place name to coordinates using Nominatim (OpenStreetMap)
 * Prioritizes Tunisia but can search globally as fallback
 * @param {string} placeName - Name of place/city to geocode
 * @returns {Promise<{latitude: number, longitude: number, displayName: string} | null>}
 */
export const geocodePlace = async (placeName) => {
  const trimmedPlace = `${placeName || ''}`.trim();
  if (!trimmedPlace) return null;

  // Try multiple search queries with decreasing specificity
  const queries = [
    { q: `${trimmedPlace}, Tunisia`, countrycodes: 'tn' },
    { q: `${trimmedPlace}, Tunisia` },
    { q: trimmedPlace, countrycodes: 'tn' },
    { q: trimmedPlace },
  ];

  for (const query of queries) {
    try {
      logger.debug('geocodingUtils', `Geocoding query: ${JSON.stringify(query)}`);

      const response = await axios.get(NOMINATIM_API, {
        params: {
          q: query.q,
          format: 'json',
          limit: 1,
          countrycodes: query.countrycodes || undefined,
        },
        timeout: 8000,
      });

      const result = response.data?.[0];
      if (result) {
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          logger.debug(
            'geocodingUtils',
            `Geocoding success: ${placeName}`,
            {
              latitude,
              longitude,
              display_name: result.display_name,
            }
          );

          return {
            latitude,
            longitude,
            displayName: result.display_name,
          };
        }
      }
    } catch (error) {
      logger.warn(
        'geocodingUtils',
        `Geocoding attempt failed for query: ${query.q}`,
        error
      );
      // Continue to next query
    }
  }

  logger.warn('geocodingUtils', `Could not geocode place: ${placeName}`);
  return null;
};
