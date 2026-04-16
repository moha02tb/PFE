/**
 * Design Tokens - Single source of truth for the entire design system
 * This file consolidates colors, typography, spacing, and shadows
 */

import { COLORS, getColors, BADGE_COLORS, getBadgeColors } from '../utils/colors';
import { TYPOGRAPHY, TEXT_STYLES, FONT_FAMILY } from '../utils/typography';
import { SPACING, BORDER_RADIUS, LAYOUT } from '../utils/spacing';
import { SHADOWS, SHADOW_PRESETS, DARK_SHADOWS, getShadow, getDarkShadow } from '../utils/shadows';

/**
 * Complete design tokens export
 */
export const DESIGN_TOKENS = {
  colors: {
    ...COLORS,
    getColors,
    getBadgeColors,
    BADGE_COLORS,
  },
  typography: {
    ...TYPOGRAPHY,
    TEXT_STYLES,
    FONT_FAMILY,
  },
  spacing: {
    ...SPACING,
    BORDER_RADIUS,
    LAYOUT,
  },
  shadows: {
    ...SHADOWS,
    SHADOW_PRESETS,
    DARK_SHADOWS,
    getShadow,
    getDarkShadow,
  },
};

/**
 * Create a complete theme object based on mode
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Complete theme object with all tokens
 */
export const createTheme = (isDarkMode = false) => {
  return {
    colors: getColors(isDarkMode),
    typography: TYPOGRAPHY,
    textStyles: TEXT_STYLES,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    layout: LAYOUT,
    shadows: isDarkMode ? DARK_SHADOWS : SHADOWS,
    shadowPresets: SHADOW_PRESETS,
    isDarkMode,
  };
};

// Export individual systems for direct import if preferred
export { COLORS, getColors, BADGE_COLORS, getBadgeColors } from '../utils/colors';
export { TYPOGRAPHY, TEXT_STYLES, FONT_FAMILY } from '../utils/typography';
export { SPACING, BORDER_RADIUS, LAYOUT } from '../utils/spacing';
export { SHADOWS, SHADOW_PRESETS, DARK_SHADOWS, getShadow, getDarkShadow } from '../utils/shadows';

// Default export
export default DESIGN_TOKENS;
