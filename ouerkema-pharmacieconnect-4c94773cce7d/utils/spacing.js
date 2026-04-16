/**
 * Spacing system for Pharmacy Connect app
 * Based on 4px base grid for consistent spacing
 */

export const SPACING = {
  // Base increments (4px grid)
  xs: 4, // Extra small
  sm: 8, // Small
  md: 12, // Medium
  lg: 16, // Large
  xl: 24, // Extra large
  xxl: 32, // 2x large
  xxxl: 48, // 3x large

  // Numeric values for precise control
  0: 0,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  36: 36,
  40: 40,
  44: 44,
  48: 48,
  52: 52,
  56: 56,
  60: 60,
  64: 64,
};

/**
 * Border radius system - used for rounding corners
 */
export const BORDER_RADIUS = {
  none: 0,
  sm: 4, // Small radius (minimal rounding)
  md: 8, // Medium radius (small components)
  lg: 12, // Large radius (medium components, cards)
  xl: 16, // Extra large radius (large containers)
  xxl: 20, // 2x large radius (modals, overlays)
  full: 9999, // Fully rounded (pills, circular badges)
};

/**
 * Layout and component spacing guidelines
 */
export const LAYOUT = {
  // Container & Screen padding
  screenHorizontalPadding: 16, // Padding from left/right screen edges
  screenVerticalPadding: 16, // Padding from top/bottom screen edges
  containerPadding: 16, // General purpose container padding

  // Card and component spacing
  cardPadding: 16, // Padding inside cards
  cardMarginBottom: 12, // Space between cards
  cardRadius: 12, // Card corner radius

  // List item spacing
  listItemPadding: 12, // Vertical padding in list items
  listItemHorizontalPadding: 16, // Horizontal padding in list items
  listItemHeight: 48, // Minimum touch target height

  // Input and form field spacing
  inputHeight: 44, // Standard input height (touch target)
  inputPadding: 12, // Horizontal padding in inputs
  inputBorderRadius: 8, // Input corner radius
  labelGap: 8, // Gap between label and input
  errorMessageGap: 4, // Gap between input and error text

  // Button spacing
  buttonHeight: 44, // Standard button height (touch target)
  buttonPadding: 16, // Horizontal padding in buttons
  buttonBorderRadius: 8, // Button corner radius
  buttonMinWidth: 100, // Minimum button width

  // Icon spacing
  iconSize: 20, // Standard icon size
  iconSmallSize: 16, // Small icon size
  iconLargeSize: 24, // Large icon size
  iconBadgeSize: 32, // Icon for badges/avatars

  // Gap between elements
  gap: 8, // Default gap between flex items
  gapSmall: 4, // Small gap
  gapMedium: 12, // Medium gap
  gapLarge: 16, // Large gap

  // Modal spacing
  modalPadding: 24, // Padding inside modals
  modalBorderRadius: 16, // Modal corner radius
};

/**
 * Get spacing value by key
 * @param {string|number} key - Spacing key (xs, sm, md, lg, xl, xxl, xxxl) or numeric value
 * @returns {number} spacing value in pixels
 */
export const getSpacing = (key) => {
  return SPACING[key] !== undefined ? SPACING[key] : 16;
};

/**
 * Create margin object for both horizontal and vertical
 * @param {number} h - horizontal margin
 * @param {number} v - vertical margin
 * @returns {object} margin object
 */
export const margin = (h = 0, v = h) => ({
  marginHorizontal: h,
  marginVertical: v,
});

/**
 * Create padding object for both horizontal and vertical
 * @param {number} h - horizontal padding
 * @param {number} v - vertical padding
 * @returns {object} padding object
 */
export const padding = (h = 0, v = h) => ({
  paddingHorizontal: h,
  paddingVertical: v,
});

/**
 * Create margin for RTL-aware spacing (uses start/end instead of left/right)
 * @param {number} horizontal - horizontal spacing
 * @param {number} vertical - vertical spacing
 * @returns {object} RTL-safe margin object
 */
export const marginRTL = (horizontal = 0, vertical = horizontal) => ({
  marginHorizontal: horizontal,
  marginVertical: vertical,
});

/**
 * Create padding for RTL-aware spacing
 * @param {number} horizontal - horizontal spacing
 * @param {number} vertical - vertical spacing
 * @returns {object} RTL-safe padding object
 */
export const paddingRTL = (horizontal = 0, vertical = horizontal) => ({
  paddingHorizontal: horizontal,
  paddingVertical: vertical,
});
