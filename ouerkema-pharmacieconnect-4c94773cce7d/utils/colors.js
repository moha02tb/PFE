/**
 * Unified Design Tokens - Colors for Pharmacy Connect Mobile App
 * Aligned with web app (DESIGN_TOKENS.md)
 * Colors are organized by function: primary, secondary, semantic, and mode-specific
 */

export const COLORS = {
  // Primary Brand Colors (Clinical & Professional)
  primary: '#004AB7', // Primary Blue - CTAs, headers, main actions
  primaryLight: '#E6EAFF', // Lighter blue for backgrounds
  primaryDark: '#0040A1', // Darker blue for pressed states

  // Secondary Colors (Healing & Success)
  secondary: '#006B5B', // Secondary/Healing - positive states, open pharmacies
  secondaryLight: '#90F5DE', // Lighter green for backgrounds
  secondaryDark: '#1A7D4D', // Darker green for pressed states

  // Tertiary Colors (Professional & Neutral)
  tertiary: '#415462', // Professional - secondary actions
  tertiaryLight: '#BDBDBD', // Light gray for disabled/subtle elements
  tertiaryDark: '#424242', // Dark gray for secondary text

  // Semantic Colors
  success: '#22AA66', // Success state
  warning: '#F57C00', // Warning/Attention
  error: '#BA1A1A', // Error/Alert (aligned with design tokens)
  info: '#1976D2', // Information

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F5F5F5',
  mediumGray: '#E0E0E0',
  darkGray: '#212121',

  // Light Mode Colors (Aligned with DESIGN_TOKENS.md)
  light: {
    background: '#F6FAFE', // Light background
    surface: '#F6FAFE', // Light surface
    surfaceVariant: '#DFE3E7', // Light surface variant
    border: '#737786', // Light border/outline
    text: '#171C1F', // Light text
    textSecondary: '#424654', // Light secondary text
    textTertiary: '#BDBDBD', // Light tertiary text
    divider: '#DFE3E7', // Light divider
  },

  // Dark Mode Colors (Aligned with DESIGN_TOKENS.md)
  dark: {
    background: '#0A0E27', // Deep blue-black background
    surface: '#1A1F3A', // Elevated surface in dark mode
    surfaceVariant: '#252E4A', // Secondary surface
    border: '#8A8E9E', // Dark border/outline
    text: '#E0E0E0', // Light text for dark background
    textSecondary: '#A0A0B0', // Secondary text
    textTertiary: '#707080', // Tertiary text
    divider: '#2A2F45', // Divider color
  },

  // Transparent variants for overlays and focus states
  transparent: {
    black: 'rgba(0, 0, 0, 0.5)',
    white: 'rgba(255, 255, 255, 0.1)',
  },
};

/**
 * Get colors based on theme mode
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Color palette for the given theme
 */
export const getColors = (isDarkMode = false) => {
  return isDarkMode ? COLORS.dark : COLORS.light;
};

/**
 * Status-specific badge colors (Pharmacy status indicators)
 * Aligned with DESIGN_TOKENS.md pharmacy status colors
 */
export const BADGE_COLORS = {
  open: {
    light: { background: '#C8E6C9', text: '#1B5E20' },
    dark: { background: '#1B5E20', text: '#C8E6C9' },
  },
  closed: {
    light: { background: '#FFCCCC', text: '#B71C1C' },
    dark: { background: '#B71C1C', text: '#FFCCCC' },
  },
  emergency: {
    light: { background: '#FFE0B2', text: '#E65100' },
    dark: { background: '#E65100', text: '#FFE0B2' },
  },
  onDuty: {
    light: { background: '#E1BEE7', text: '#6A1B9A' },
    dark: { background: '#6A1B9A', text: '#E1BEE7' },
  },
};

/**
 * Get badge colors based on status and theme
 * @param {string} status - Badge status (open, closed, emergency, onDuty)
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} { background, text } colors for the badge
 */
export const getBadgeColors = (status, isDarkMode = false) => {
  const statusColors = BADGE_COLORS[status] || BADGE_COLORS.closed;
  return isDarkMode ? statusColors.dark : statusColors.light;
};
