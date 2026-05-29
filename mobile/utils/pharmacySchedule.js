/**
 * Tunisian Pharmacy Schedule Validator
 * Determines if a pharmacy is open based on Tunisian working hours
 * 
 * Schedule Categories:
 * - Category A (Normal): Mon-Fri 08:30-13:00, 15:00-19:30 | Sat 08:30-13:00 | Sun closed (unless garde)
 * - Category A de Garde (On Duty): 08:30-19:30 daily
 * - Category B (Night): 19:30-08:30 (passes midnight)
 */

/**
 * Get current Tunisia time instance
 * Tunisia uses UTC+1 year-round (no DST)
 */
const getTunisiaTime = (date = new Date()) => {
  // Create a date in UTC
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  // Add Tunisia offset (+1 hour)
  const tunisiaTime = new Date(utcDate.getTime() + 1 * 60 * 60 * 1000);
  return tunisiaTime;
};

/**
 * Convert time string "HH:MM" to minutes since midnight
 * Example: "14:30" => 870
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

/**
 * Check if current time falls within a time range
 * Handles ranges that don't cross midnight
 */
const isTimeInRange = (currentMinutes, startStr, endStr) => {
  const startMin = timeToMinutes(startStr);
  const endMin = timeToMinutes(endStr);
  if (startMin === null || endMin === null) return false;
  return currentMinutes >= startMin && currentMinutes < endMin;
};

/**
 * Check if current time falls within a range that crosses midnight
 * Example: 19:30-08:30 (night shift)
 */
const isTimeInNightRange = (currentMinutes, startStr, endStr) => {
  const startMin = timeToMinutes(startStr);
  const endMin = timeToMinutes(endStr);
  if (startMin === null || endMin === null) return false;
  // If start > end, range crosses midnight
  if (startMin >= endMin) {
    return currentMinutes >= startMin || currentMinutes < endMin;
  }
  return currentMinutes >= startMin && currentMinutes < endMin;
};

/**
 * Get working hours for a pharmacy
 * Priority:
 * 1. If pharmacy has explicit opening_hours field, use it
 * 2. If pharmacy is marked as garde/is_on_duty, use garde schedule
 * 3. If pharmacy is marked as night/nuit, use night schedule
 * 4. Default to regular Tunisian category A schedule
 */
const getPharmacyWorkingHours = (pharmacy) => {
  // Check if pharmacy has explicit garde marker
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

  // Check if pharmacy is a night pharmacy
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
      sunday: [], // Closed on Sunday unless it's a garde pharmacy
    },
  };
};

/**
 * Calculate next status change for a pharmacy
 * Returns: { text: string, minutesUntil: number }
 */
const getNextStatusChange = (pharmacy, currentDate = new Date()) => {
  const tunisiaTime = getTunisiaTime(currentDate);
  const dayOfWeek = tunisiaTime.getDay(); // 0=Sunday, 1=Monday, etc
  const currentMinutes = tunisiaTime.getHours() * 60 + tunisiaTime.getMinutes();

  const { type, schedule } = getPharmacyWorkingHours(pharmacy);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  // For normal pharmacies with split hours
  if (type === 'normal') {
    const todaySchedule = schedule[dayName];
    
    if (!Array.isArray(todaySchedule) || todaySchedule.length === 0) {
      // Pharmacy is closed today, find next opening
      const nextDay = new Date(tunisiaTime);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayOfWeek = nextDay.getDay();
      const nextDayName = dayNames[nextDayOfWeek];
      const nextDaySchedule = schedule[nextDayName];
      
      if (Array.isArray(nextDaySchedule) && nextDaySchedule.length > 0) {
        return {
          text: `Ouvre demain à ${nextDaySchedule[0].start}`,
          minutesUntil: null,
        };
      }
      return { text: 'Hours not available', minutesUntil: null };
    }

    // Check within today's schedule
    for (const period of todaySchedule) {
      const startMin = timeToMinutes(period.start);
      const endMin = timeToMinutes(period.end);

      if (currentMinutes < startMin) {
        // Before this period
        const minutesUntil = startMin - currentMinutes;
        return {
          text: `Ouvre à ${period.start}`,
          minutesUntil,
        };
      }

      if (currentMinutes < endMin) {
        // Inside this period
        const minutesUntil = endMin - currentMinutes;
        if (todaySchedule.indexOf(period) < todaySchedule.length - 1) {
          // More periods today
          const nextPeriod = todaySchedule[todaySchedule.indexOf(period) + 1];
          return {
            text: `Ferme à ${period.end}`,
            minutesUntil,
          };
        } else {
          // Last period of the day
          return {
            text: `Ferme à ${period.end}`,
            minutesUntil,
          };
        }
      }
    }

    // After all periods today
    const nextDay = new Date(tunisiaTime);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayOfWeek = nextDay.getDay();
    const nextDayName = dayNames[nextDayOfWeek];
    const nextDaySchedule = schedule[nextDayName];

    if (Array.isArray(nextDaySchedule) && nextDaySchedule.length > 0) {
      return {
        text: `Ouvre demain à ${nextDaySchedule[0].start}`,
        minutesUntil: null,
      };
    }
    return { text: 'Hours not available', minutesUntil: null };
  }

  // For garde and night pharmacies (24/7 or single range)
  const todaySchedule = schedule[dayName];
  if (todaySchedule) {
    const startMin = timeToMinutes(todaySchedule.start);
    const endMin = timeToMinutes(todaySchedule.end);

    if (currentMinutes < startMin) {
      const minutesUntil = startMin - currentMinutes;
      return {
        text: `Ouvre à ${todaySchedule.start}`,
        minutesUntil,
      };
    }

    if (todaySchedule.isCrossMidnight) {
      // Night range
      if (currentMinutes >= startMin || currentMinutes < endMin) {
        // Open
        const minutesUntil = currentMinutes >= startMin 
          ? (24 * 60 - currentMinutes) + (endMin - 0)
          : endMin - currentMinutes;
        return {
          text: `Ferme à ${todaySchedule.end}`,
          minutesUntil,
        };
      }
    } else {
      // Normal range
      if (currentMinutes < endMin) {
        const minutesUntil = endMin - currentMinutes;
        return {
          text: `Ferme à ${todaySchedule.end}`,
          minutesUntil,
        };
      }
    }
  }

  return { text: 'Hours not available', minutesUntil: null };
};

/**
 * Main function: Get pharmacy open/closed status
 * 
 * Returns:
 * {
 *   isOpen: boolean,
 *   label: string ('Ouverte', 'Fermée', 'De garde', 'Pharmacie de nuit'),
 *   statusType: string ('open', 'closed', 'garde', 'night'),
 *   nextStatusText: string (e.g., "Ferme à 13:00")
 * }
 */
export const getPharmacyOpenStatus = (pharmacy, currentDate = new Date()) => {
  if (!pharmacy) {
    return {
      isOpen: null,
      label: 'Information non disponible',
      statusType: 'unknown',
      nextStatusText: null,
    };
  }

  const tunisiaTime = getTunisiaTime(currentDate);
  const dayOfWeek = tunisiaTime.getDay(); // 0=Sunday, 1=Monday, etc
  const currentMinutes = tunisiaTime.getHours() * 60 + tunisiaTime.getMinutes();

  const { type, schedule } = getPharmacyWorkingHours(pharmacy);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const todaySchedule = schedule[dayName];

  let isOpen = false;
  let statusType = 'closed';
  let label = 'Fermée';

  if (type === 'garde') {
    // Garde pharmacy: always open 08:30-19:30
    if (isTimeInRange(currentMinutes, '08:30', '19:30')) {
      isOpen = true;
      statusType = 'garde';
      label = 'De garde';
    } else {
      isOpen = false;
      statusType = 'closed';
      label = 'Fermée';
    }
  } else if (type === 'night') {
    // Night pharmacy: 19:30-08:30 (crosses midnight)
    if (isTimeInNightRange(currentMinutes, '19:30', '08:30')) {
      isOpen = true;
      statusType = 'night';
      label = 'Pharmacie de nuit';
    } else {
      isOpen = false;
      statusType = 'closed';
      label = 'Fermée';
    }
  } else if (type === 'normal') {
    // Normal category A pharmacy
    if (Array.isArray(todaySchedule) && todaySchedule.length > 0) {
      // Check if current time falls in any of the periods
      isOpen = todaySchedule.some(period =>
        isTimeInRange(currentMinutes, period.start, period.end)
      );
      if (isOpen) {
        statusType = 'open';
        label = 'Ouverte';
      } else {
        statusType = 'closed';
        label = 'Fermée';
      }
    } else {
      // No schedule for today (Sundays for normal pharmacies)
      isOpen = false;
      statusType = 'closed';
      label = 'Fermée';
    }
  }

  const nextStatusText = getNextStatusChange(pharmacy, currentDate)?.text;

  return {
    isOpen,
    label,
    statusType,
    nextStatusText,
  };
};

/**
 * Legacy compatibility: Convert new status to old getStatus format
 */
export const getPharmacyStatusLegacy = (pharmacy, currentDate = new Date()) => {
  const { statusType, isOpen } = getPharmacyOpenStatus(pharmacy, currentDate);

  // Map new status types to legacy names
  if (statusType === 'garde') return 'onDuty';
  if (statusType === 'night') return 'emergency'; // Or create new 'night' type in colors
  if (isOpen) return 'open';
  return 'closed';
};
