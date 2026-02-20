import pharmaciesData from '../data/pharmacies.json';

/**
 * Load pharmacy data and process it with translations
 * @param {Function} t - Translation function from react-i18next
 * @param {Date} date - Selected date (for future filtering by date)
 * @returns {Array} Array of pharmacy objects with translated names and addresses
 */
export const loadPharmacies = (t, date = new Date()) => {
  return pharmaciesData.map(pharmacy => ({
    ...pharmacy,
    name: t(pharmacy.nameKey),
    address: t(pharmacy.addressKey),
    openHours: pharmacy.openHoursKey ? t(pharmacy.openHoursKey) : pharmacy.openHours
  }));
};

/**
 * Get pharmacy by ID
 * @param {number} id - Pharmacy ID
 * @param {Function} t - Translation function
 * @returns {Object|null} Pharmacy object or null if not found
 */
export const getPharmacyById = (id, t) => {
  const pharmacy = pharmaciesData.find(p => p.id === id);
  if (!pharmacy) return null;
  
  return {
    ...pharmacy,
    name: t(pharmacy.nameKey),
    address: t(pharmacy.addressKey),
    openHours: pharmacy.openHoursKey ? t(pharmacy.openHoursKey) : pharmacy.openHours
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
  return pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(term) ||
    pharmacy.address.toLowerCase().includes(term)
  );
};

/**
 * Get open pharmacies only
 * @param {Array} pharmacies - Array of pharmacy objects
 * @returns {Array} Array of open pharmacies
 */
export const getOpenPharmacies = (pharmacies) => {
  return pharmacies.filter(pharmacy => pharmacy.isOpen);
};

/**
 * Get emergency pharmacies only
 * @param {Array} pharmacies - Array of pharmacy objects
 * @returns {Array} Array of emergency pharmacies
 */
export const getEmergencyPharmacies = (pharmacies) => {
  return pharmacies.filter(pharmacy => pharmacy.emergency);
};