/**
 * Shadow elevation system for Pharmacy Connect app
 * Provides consistent shadow depths for visual hierarchy
 */

/**
 * Shadow elevation levels following Material Design 3
 * Each level provides increasing visual depth
 */
export const SHADOWS = {
  // No shadow (flat)
  none: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },

  // Elevation 1 (subtle hover/interactive state)
  elevation1: {
    elevation: 1,
    shadowColor: '#10233A',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  // Elevation 2 (standard cards, buttons)
  elevation2: {
    elevation: 2,
    shadowColor: '#10233A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // Elevation 3 (pressed cards, medium depth)
  elevation3: {
    elevation: 3,
    shadowColor: '#10233A',
    shadowOpacity: 0.11,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },

  // Elevation 4 (floating buttons, overlays)
  elevation4: {
    elevation: 4,
    shadowColor: '#0C1B2A',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },

  // Elevation 5 (modals, dialogs)
  elevation5: {
    elevation: 5,
    shadowColor: '#07111F',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
  },
};

/**
 * Get shadow by elevation level
 * @param {number|string} level - Elevation level (0-5, or 'none', 'elevation1', etc.)
 * @returns {object} shadow style object
 */
export const getShadow = (level = 2) => {
  const levelMap = {
    0: SHADOWS.none,
    1: SHADOWS.elevation1,
    2: SHADOWS.elevation2,
    3: SHADOWS.elevation3,
    4: SHADOWS.elevation4,
    5: SHADOWS.elevation5,
    none: SHADOWS.none,
    elevation1: SHADOWS.elevation1,
    elevation2: SHADOWS.elevation2,
    elevation3: SHADOWS.elevation3,
    elevation4: SHADOWS.elevation4,
    elevation5: SHADOWS.elevation5,
  };

  return levelMap[level] || SHADOWS.elevation2;
};

/**
 * Preset shadow combinations for common components
 */
export const SHADOW_PRESETS = {
  // Card shadow - subtle depth
  card: SHADOWS.elevation2,

  // Button shadow - slight lift
  button: SHADOWS.elevation2,

  // Pressed button shadow - more depth
  buttonPressed: SHADOWS.elevation3,

  // Floating action button shadow
  fab: SHADOWS.elevation4,

  // Modal/dialog shadow (deep)
  modal: SHADOWS.elevation5,

  // Hover/focus state
  hover: SHADOWS.elevation3,

  // Input field focus (subtle)
  inputFocus: SHADOWS.elevation1,

  // Toolbar shadow (minimal)
  toolbar: SHADOWS.elevation2,
};

/**
 * Dark mode shadow adjustments
 * Shadows are more visible and use white tint in dark mode
 */
export const DARK_SHADOWS = {
  elevation1: {
    elevation: 1,
    shadowColor: '#020814',
    shadowOpacity: 0.24,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  elevation2: {
    elevation: 2,
    shadowColor: '#020814',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  elevation3: {
    elevation: 3,
    shadowColor: '#020814',
    shadowOpacity: 0.36,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },

  elevation4: {
    elevation: 4,
    shadowColor: '#020814',
    shadowOpacity: 0.42,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },

  elevation5: {
    elevation: 5,
    shadowColor: '#020814',
    shadowOpacity: 0.48,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
  },
};

/**
 * Get dark mode shadow by elevation level
 * @param {number|string} level - Elevation level
 * @returns {object} dark mode shadow style object
 */
export const getDarkShadow = (level = 2) => {
  const levelMap = {
    1: DARK_SHADOWS.elevation1,
    2: DARK_SHADOWS.elevation2,
    3: DARK_SHADOWS.elevation3,
    4: DARK_SHADOWS.elevation4,
    5: DARK_SHADOWS.elevation5,
  };

  return levelMap[level] || DARK_SHADOWS.elevation2;
};

/**
 * Get context-aware shadow based on theme
 * @param {number|string} level - Elevation level
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} shadow style object
 */
export const getContextualShadow = (level = 2, isDarkMode = false) => {
  return isDarkMode ? getDarkShadow(level) : getShadow(level);
};
