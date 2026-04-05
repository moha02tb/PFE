import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

export const SearchHistoryContext = createContext();

const SEARCH_HISTORY_KEY = '@PharmaConnect_SearchHistory';
const MAX_SEARCH_HISTORY = 10;

export const SearchHistoryProvider = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
      setIsLoading(false);
    } catch (error) {
      logger.error('SearchHistoryContext', 'Error loading search history', error);
      setIsLoading(false);
    }
  };

  const addToHistory = useCallback(
    async (searchTerm) => {
      if (!searchTerm || searchTerm.trim().length === 0) return;

      try {
        // Remove duplicate if exists
        let updated = searchHistory.filter((item) => item !== searchTerm.trim());

        // Add to beginning
        updated.unshift(searchTerm.trim());

        // Keep only recent searches
        updated = updated.slice(0, MAX_SEARCH_HISTORY);

        setSearchHistory(updated);
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        logger.error('SearchHistoryContext', 'Error adding to history', error);
      }
    },
    [searchHistory]
  );

  const removeFromHistory = useCallback(
    async (searchTerm) => {
      try {
        const updated = searchHistory.filter((item) => item !== searchTerm);
        setSearchHistory(updated);
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        logger.error('SearchHistoryContext', 'Error removing from history', error);
      }
    },
    [searchHistory]
  );

  const clearHistory = useCallback(async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      logger.error('SearchHistoryContext', 'Error clearing history', error);
    }
  }, []);

  const value = {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isLoading,
  };

  return <SearchHistoryContext.Provider value={value}>{children}</SearchHistoryContext.Provider>;
};

export const useSearchHistory = () => {
  const context = React.useContext(SearchHistoryContext);
  if (!context) {
    throw new Error('useSearchHistory must be used within SearchHistoryProvider');
  }
  return context;
};
