import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

export const RatingContext = createContext();

const RATINGS_KEY = '@PharmaConnect_Ratings';

export const RatingProvider = ({ children }) => {
  const [ratings, setRatings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load ratings on mount
  useEffect(() => {
    let isMounted = true;
    const loadRatingsAsync = async () => {
      try {
        const saved = await AsyncStorage.getItem(RATINGS_KEY);
        if (isMounted && saved) {
          setRatings(JSON.parse(saved));
        }
        if (isMounted) setIsLoading(false);
      } catch (error) {
        logger.error('RatingContext', 'Error loading ratings', error);
        if (isMounted) setIsLoading(false);
      }
    };
    loadRatingsAsync();
    return () => { isMounted = false; };
  }, []);



  const setRating = useCallback(
    async (pharmacyId, rating, comment = '') => {
      if (rating < 1 || rating > 5) {
        logger.warn('RatingContext', 'Rating must be between 1 and 5');
        return;
      }

      try {
        setRatings((prev) => {
          const updated = {
            ...prev,
            [pharmacyId]: {
              rating,
              comment,
              timestamp: new Date().toISOString(),
            },
          };
          AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(updated)).catch((error) =>
            logger.error('RatingContext', 'Error saving rating', error)
          );
          return updated;
        });
      } catch (error) {
        logger.error('RatingContext', 'Error setting rating', error);
      }
    },
    []
  );

  const getRating = useCallback(
    (pharmacyId) => {
      return ratings[pharmacyId] || null;
    },
    []
  );

  const removeRating = useCallback(
    async (pharmacyId) => {
      try {
        setRatings((prev) => {
          const updated = { ...prev };
          delete updated[pharmacyId];
          AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(updated)).catch((error) =>
            logger.error('RatingContext', 'Error saving rating', error)
          );
          return updated;
        });
      } catch (error) {
        logger.error('RatingContext', 'Error removing rating', error);
      }
    },
    []
  );

  const value = {
    ratings,
    setRating,
    getRating,
    removeRating,
    isLoading,
  };

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>;
};

export const useRating = () => {
  const context = React.useContext(RatingContext);
  if (!context) {
    throw new Error('useRating must be used within RatingProvider');
  }
  return context;
};
