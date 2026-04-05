import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const FavoritesContext = createContext();

const FAVORITES_STORAGE_KEY = '@PharmaConnect_Favorites';

export const useFavorites = () => {
  const context = useContext(FavoritesContext);

  if (!context) {
    logger.warn(
      'FavoritesContext',
      'useFavorites called outside of FavoritesProvider. Returning defaults.'
    );

    return {
      favorites: [],
      toggleFavorite: () => {},
      isFavorite: () => false,
      isLoading: false,
    };
  }

  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
      setIsLoading(false);
    } catch (error) {
      logger.error('FavoritesContext', 'Error loading favorites', error);
      setIsLoading(false);
    }
  };

  const saveFavorites = async (favs) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
    } catch (error) {
      logger.error('FavoritesContext', 'Error saving favorites', error);
    }
  };

  const toggleFavorite = async (pharmacyId) => {
    const newFavorites = isFavorite(pharmacyId)
      ? favorites.filter((id) => id !== pharmacyId)
      : [...favorites, pharmacyId];

    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const isFavorite = (pharmacyId) => {
    return favorites.includes(pharmacyId);
  };

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
    isLoading,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export default FavoritesProvider;
