import React, { createContext, useState, useCallback } from 'react';
import logger from '../utils/logger';

export const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    maxDistance: 50, // km
    isOpen: false, // filter by open pharmacies only
    includeEmergency: false, // show emergency pharmacies only
    openHoursOnly: false, // show only pharmacies currently open
  });
  const [isFiltering, setIsFiltering] = useState(false);

  const updateFilter = useCallback((filterName, value) => {
    try {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [filterName]: value,
      }));
    } catch (error) {
      logger.error('FilterContext', 'Error updating filter', error);
    }
  }, []);

  const resetFilters = useCallback(() => {
    try {
      setFilters({
        maxDistance: 50,
        isOpen: false,
        includeEmergency: false,
        openHoursOnly: false,
      });
    } catch (error) {
      logger.error('FilterContext', 'Error resetting filters', error);
    }
  }, []);

  const applyFilters = useCallback(
    (pharmacies) => {
      try {
        let filtered = [...pharmacies];

        // Filter by open hours
        if (filters.openHoursOnly) {
          filtered = filtered.filter((p) => p.isOpen);
        }

        // Filter by emergency status
        if (filters.includeEmergency) {
          filtered = filtered.filter((p) => p.emergency);
        }

        // Filter by distance would require user location
        // This is typically handled in the screen component

        return filtered;
      } catch (error) {
        logger.error('FilterContext', 'Error applying filters', error);
        return pharmacies;
      }
    },
    [filters]
  );

  const value = {
    filters,
    updateFilter,
    resetFilters,
    applyFilters,
    isFiltering,
    setIsFiltering,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilter = () => {
  const context = React.useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
};
