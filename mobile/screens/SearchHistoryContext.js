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
    let isMounted = true;
    const loadSearchHistoryAsync = async () => {
      try {
        const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (isMounted && saved) {
          setSearchHistory(JSON.parse(saved));
        }
        if (isMounted) setIsLoading(false);
      } catch (error) {
        logger.error('SearchHistoryContext', 'Error loading search history', error);
        if (isMounted) setIsLoading(false);
      }
    };
    loadSearchHistoryAsync();
    return () => { isMounted = false; };
  }, []);



  const addToHistory = useCallback(
    async (searchTerm) => {
      if (!searchTerm || searchTerm.trim().length === 0) return;

      try {
        setSearchHistory((prev) => {
          // Remove duplicate if exists
          let updated = prev.filter((item) => item !== searchTerm.trim());

          // Add to beginning
          updated.unshift(searchTerm.trim());

          // Keep only recent searches
          updated = updated.slice(0, MAX_SEARCH_HISTORY);

          // Save to storage
          AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)).catch((error) =>
            logger.error('SearchHistoryContext', 'Error saving to history', error)
          );

          return updated;
        });
      } catch (error) {
        logger.error('SearchHistoryContext', 'Error adding to history', error);
      }
    },
    []
  );

  const removeFromHistory = useCallback(
    async (searchTerm) => {
      try {
        setSearchHistory((prev) => {
          const updated = prev.filter((item) => item !== searchTerm);
          AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)).catch((error) =>
            logger.error('SearchHistoryContext', 'Error saving to history', error)
          );
          return updated;
        });
      } catch (error) {
        logger.error('SearchHistoryContext', 'Error removing from history', error);
      }
    },
    []
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
