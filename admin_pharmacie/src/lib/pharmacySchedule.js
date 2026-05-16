/**
 * Tunisian Pharmacy Schedule Validator (Admin Version)
 * Determines if a pharmacy is open based on Tunisian working hours
 */

/**
 * Get current Tunisia time instance
 * Tunisia uses UTC+1 year-round (no DST)
 */
const getTunisiaTime = (date = new Date()) => {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const tunisiaTime = new Date(utcDate.getTime() + 1 * 60 * 60 * 1000);
  return tunisiaTime;
};

/**
 * Convert time string "HH:MM" to minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

/**
 * Check if current time falls within a normal time range
 */
const isTimeInRange = (currentMinutes, startStr, endStr) => {
  const startMin = timeToMinutes(startStr);
  const endMin = timeToMinutes(endStr);
  if (startMin === null || endMin === null) return false;
  return currentMinutes >= startMin && currentMinutes < endMin;
};

/**
 * Check if current time falls within a range that crosses midnight (night shift)
 */
const isTimeInNightRange = (currentMinutes, startStr, endStr) => {
  const startMin = timeToMinutes(startStr);
  const endMin = timeToMinutes(endStr);
  if (startMin === null || endMin === null) return false;
  if (startMin >= endMin) {
    return currentMinutes >= startMin || currentMinutes < endMin;
  }
  return currentMinutes >= startMin && currentMinutes < endMin;
};

/**
 * Get working hours for a pharmacy
 */
const getPharmacyWorkingHours = (pharmacy) => {
  if (pharmacy?.is_garde || pharmacy?.garde || pharmacy?.is_on_duty || pharmacy?.onDuty) {
    return {
      type: 'garde',
      schedule: {
        monday: { start: '08:30', end: '19:30' },
        tuesday: { start: '08:30', end: '19:30' },
        wednesday: { start: '08:30', end: '19:30' },
        thursday: { start: '08:30', end: '19:30' },
        friday: { start: '08:30', end: '19:30' },
        saturday: { start: '08:30', end: '19:30' },
        sunday: { start: '08:30', end: '19:30' },
      },
    };
  }

  if (pharmacy?.is_night || pharmacy?.nuit || pharmacy?.night) {
    return {
      type: 'night',
      schedule: {
        monday: { start: '19:30', end: '08:30', isCrossMidnight: true },
        tuesday: { start: '19:30', end: '08:30', isCrossMidnight: true },
        wednesday: { start: '19:30', end: '08:30', isCrossMidnight: true },
        thursday: { start: '19:30', end: '08:30', isCrossMidnight: true },
        friday: { start: '19:30', end: '08:30', isCrossMidnight: true },
        saturday: { start: '19:30', end: '08:30', isCrossMidnight: true },
        sunday: { start: '19:30', end: '08:30', isCrossMidnight: true },
      },
    };
  }

  // Default: Category A (Normal pharmacy)
  return {
    type: 'normal',
    schedule: {
      monday: [{ start: '08:30', end: '13:00' }, { start: '15:00', end: '19:30' }],
      tuesday: [{ start: '08:30', end: '13:00' }, { start: '15:00', end: '19:30' }],
      wednesday: [{ start: '08:30', end: '13:00' }, { start: '15:00', end: '19:30' }],
      thursday: [{ start: '08:30', end: '13:00' }, { start: '15:00', end: '19:30' }],
      friday: [{ start: '08:30', end: '13:00' }, { start: '15:00', end: '19:30' }],
      saturday: [{ start: '08:30', end: '13:00' }],
      sunday: [],
    },
  };
};

/**
 * Main function: Get pharmacy open/closed status
 * Returns: { isOpen, label, statusType, color }
 */
export const getPharmacyOpenStatus = (pharmacy, currentDate = new Date()) => {
  if (!pharmacy) {
    return {
      isOpen: null,
      label: 'Unknown',
      statusType: 'unknown',
      color: '#9CA3AF',
    };
  }

  const tunisiaTime = getTunisiaTime(currentDate);
  const dayOfWeek = tunisiaTime.getDay();
  const currentMinutes = tunisiaTime.getHours() * 60 + tunisiaTime.getMinutes();

  const { type, schedule } = getPharmacyWorkingHours(pharmacy);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const todaySchedule = schedule[dayName];

  let isOpen = false;
  let statusType = 'closed';
  let label = 'Fermée';
  let color = '#EF4444'; // Red for closed

  if (type === 'garde') {
    if (isTimeInRange(currentMinutes, '08:30', '19:30')) {
      isOpen = true;
      statusType = 'garde';
      label = 'De garde';
      color = '#F97316'; // Orange
    } else {
      isOpen = false;
      statusType = 'closed';
      label = 'Fermée';
      color = '#EF4444'; // Red
    }
  } else if (type === 'night') {
    if (isTimeInNightRange(currentMinutes, '19:30', '08:30')) {
      isOpen = true;
      statusType = 'night';
      label = 'Pharmacie de nuit';
      color = '#A78BFA'; // Purple
    } else {
      isOpen = false;
      statusType = 'closed';
      label = 'Fermée';
      color = '#EF4444'; // Red
    }
  } else if (type === 'normal') {
    if (Array.isArray(todaySchedule) && todaySchedule.length > 0) {
      isOpen = todaySchedule.some(period =>
        isTimeInRange(currentMinutes, period.start, period.end)
      );
      if (isOpen) {
        statusType = 'open';
        label = 'Ouverte';
        color = '#10B981'; // Green
      } else {
        statusType = 'closed';
        label = 'Fermée';
        color = '#EF4444'; // Red
      }
    } else {
      isOpen = false;
      statusType = 'closed';
      label = 'Fermée';
      color = '#EF4444'; // Red
    }
  }

  return {
    isOpen,
    label,
    statusType,
    color,
  };
};

/**
 * Get marker hex color for status
 */
export const getMarkerColorForStatus = (statusType) => {
  const colorMap = {
    open: '#10B981', // Green
    closed: '#EF4444', // Red
    garde: '#F97316', // Orange
    night: '#A78BFA', // Purple
    unknown: '#9CA3AF', // Gray
  };
  return colorMap[statusType] || colorMap.unknown;
};
