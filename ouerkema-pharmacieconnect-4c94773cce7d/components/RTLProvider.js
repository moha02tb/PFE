import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLanguage } from '../screens/LanguageContext';
import RTLUtils from '../utils/RTLUtils';

// RTL Provider that handles instant layout updates
export const RTLProvider = ({ children, style = {} }) => {
  const { isRTL } = useLanguage();

  // Apply RTL transform to the entire view for instant switching
  const rtlStyle = {
    ...style,
    direction: isRTL ? 'rtl' : 'ltr',
    // Apply transformation for better RTL support
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };

  return <View style={rtlStyle}>{children}</View>;
};

export default RTLProvider;
