import { useMemo } from 'react';
import { COLORS, getColors } from './colors';
import { BORDER_RADIUS, SPACING, LAYOUT } from './spacing';
import { TEXT_STYLES, TYPOGRAPHY } from './typography';
import { getContextualShadow } from './shadows';
import { useTheme } from '../screens/ThemeContext';
import { useLanguage } from '../screens/LanguageContext';

export const DESIGN_SYSTEM = {
  colors: COLORS,
  spacing: SPACING,
  radius: BORDER_RADIUS,
  layout: LAYOUT,
  typography: TYPOGRAPHY,
  textStyles: TEXT_STYLES,
};

export const getTheme = (isDarkMode = false) => {
  const colors = getColors(isDarkMode);

  return {
    isDarkMode,
    colors,
    spacing: SPACING,
    radius: BORDER_RADIUS,
    layout: LAYOUT,
    typography: TYPOGRAPHY,
    textStyles: TEXT_STYLES,
    shadows: {
      subtle: getContextualShadow(1, isDarkMode),
      card: getContextualShadow(2, isDarkMode),
      raised: getContextualShadow(3, isDarkMode),
      floating: getContextualShadow(4, isDarkMode),
      modal: getContextualShadow(5, isDarkMode),
    },
  };
};

export const useAppTheme = () => {
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();

  return useMemo(() => ({ ...getTheme(isDarkMode), isRTL }), [isDarkMode, isRTL]);
};

export const alignStart = (isRTL) => ({ textAlign: isRTL ? 'right' : 'left' });
export const rowDirection = (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row' });
