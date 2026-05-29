import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_HISTORY_KEY = '@pharmacy_app_location_history';
const MAX_HISTORY_ITEMS = 5;

/**
 * Custom hook for managing location search history
 * Persists last 5 searched governorates using AsyncStorage
 * 
 * @returns {Object} {
 *   history: string[] - Array of governorate names in recent order,
 *   addToHistory: (governorate: string) => Promise<void> - Add/move governorate to front,
 *   clearHistory: () => Promise<void> - Clear all history,
 *   isLoading: boolean - Whether history is being loaded
 * }
 *
 * @example
 * const { history, addToHistory } = useLocationHistory();
 * // Use history to display recently searched locations
 * // Call addToHistory when user selects a location
 */
export const useLocationHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from AsyncStorage on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load location history:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const addToHistory = async (governorate) => {
    try {
      // Remove if already exists to add at front
      const updated = history.filter((item) => item !== governorate);
      
      // Add to front and keep max 5 items
      const newHistory = [governorate, ...updated].slice(0, MAX_HISTORY_ITEMS);
      
      setHistory(newHistory);
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.warn('Failed to update location history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem(LOCATION_HISTORY_KEY);
    } catch (error) {
      console.warn('Failed to clear location history:', error);
    }
  };

  return {
    history,
    addToHistory,
    clearHistory,
    isLoading,
  };
};

export default useLocationHistory;
