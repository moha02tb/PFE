/**
 * Typography system for Pharmacy Connect app
 * Defines font families, sizes, weights, and line heights
 */

// Font Family Configuration
export const FONT_FAMILY = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  fallback: "'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
};

/**
 * Typography scale with sizes, weights, and line heights
 * Following Material Design 3 principles
 */
export const TYPOGRAPHY = {
  // Display styles (large, prominent headings)
  display: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: 0,
  },

  // Heading styles (section headers)
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 0,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: 0,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0,
  },

  // Body text (main content)
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.5,
  },

  // Subtitle/Label text (secondary information)
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  subtitleBold: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.1,
  },

  // Caption/Small text (tertiary information, badges, etc.)
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.4,
  },

  // Button text
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Overline text (labels above content)
  overline: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 1.5,
  },
};

/**
 * Get font weight as numeric value
 * React Native requires numeric values
 * @param {number} weight - font weight value (400, 500, 600, 700)
 * @returns {number} numeric font weight
 */
export const getFontWeight = (weight = '400') => {
  const weights = {
    400: 400,
    500: 500,
    600: 600,
    700: 700,
  };
  return weights[weight] || 400;
};

/**
 * Create a responsive text style
 * @param {string} variant - typography variant (body, h1, h2, etc.)
 * @returns {object} text style object
 */
export const getTextStyle = (variant = 'body') => {
  const style = TYPOGRAPHY[variant] || TYPOGRAPHY.body;
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
  };
};

/**
 * Preset text styles for common use cases
 */
export const TEXT_STYLES = {
  headerLarge: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  headerMedium: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  headerSmall: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
};
