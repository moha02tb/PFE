import { I18nManager, Animated } from 'react-native';

// Helper functions for RTL-aware styling
export const RTLUtils = {
  // Transform directions for RTL
  rtlTransform: (isRTL = I18nManager.isRTL) => {
    return isRTL ? 'rtl' : 'ltr';
  },

  // Get proper text alignment
  textAlign: (align, isRTL = I18nManager.isRTL) => {
    if (align === 'left' && isRTL) return 'right';
    if (align === 'right' && isRTL) return 'left';
    return align;
  },

  // RTL-aware padding/margin helpers
  paddingStart: (value) => ({
    paddingStart: value,
  }),

  paddingEnd: (value) => ({
    paddingEnd: value,
  }),

  marginStart: (value) => ({
    marginStart: value,
  }),

  marginEnd: (value) => ({
    marginEnd: value,
  }),

  // Flex direction helpers
  flexDirection: (direction, isRTL = I18nManager.isRTL) => {
    if (direction === 'row' && isRTL) return 'row-reverse';
    if (direction === 'row-reverse' && isRTL) return 'row';
    return direction;
  },

  // Position helpers
  left: (value, isRTL = I18nManager.isRTL) => (isRTL ? { right: value } : { left: value }),

  right: (value, isRTL = I18nManager.isRTL) => (isRTL ? { left: value } : { right: value }),

  // Transform helper for absolute positioning
  transform: (transforms, isRTL = I18nManager.isRTL) => {
    if (!isRTL) return transforms;

    return transforms.map((transform) => {
      if (transform.scaleX !== undefined) {
        return { scaleX: -transform.scaleX };
      }
      if (transform.translateX !== undefined) {
        return { translateX: -transform.translateX };
      }
      return transform;
    });
  },

  // Style object transformer
  rtlStyle: (style, isRTL = I18nManager.isRTL) => {
    if (!isRTL || !style) return style;

    const rtlStyle = { ...style };

    // Swap left/right properties
    if (style.paddingLeft !== undefined) {
      rtlStyle.paddingRight = style.paddingLeft;
      delete rtlStyle.paddingLeft;
    }
    if (style.paddingRight !== undefined) {
      rtlStyle.paddingLeft = style.paddingRight;
      delete rtlStyle.paddingRight;
    }
    if (style.marginLeft !== undefined) {
      rtlStyle.marginRight = style.marginLeft;
      delete rtlStyle.marginLeft;
    }
    if (style.marginRight !== undefined) {
      rtlStyle.marginLeft = style.marginRight;
      delete rtlStyle.marginRight;
    }
    if (style.left !== undefined) {
      rtlStyle.right = style.left;
      delete rtlStyle.left;
    }
    if (style.right !== undefined) {
      rtlStyle.left = style.right;
      delete rtlStyle.right;
    }

    // Handle text alignment
    if (style.textAlign === 'left') {
      rtlStyle.textAlign = 'right';
    } else if (style.textAlign === 'right') {
      rtlStyle.textAlign = 'left';
    }

    // Handle flex direction
    if (style.flexDirection === 'row') {
      rtlStyle.flexDirection = 'row-reverse';
    } else if (style.flexDirection === 'row-reverse') {
      rtlStyle.flexDirection = 'row';
    }

    return rtlStyle;
  },

  // Conditional style based on RTL
  conditionalStyle: (ltrStyle, rtlStyle, isRTL = I18nManager.isRTL) => {
    return isRTL ? rtlStyle : ltrStyle;
  },

  // Instant RTL animation helper
  createRTLAnimation: (isRTL) => {
    const scaleX = isRTL ? -1 : 1;
    return {
      transform: [{ scaleX }],
    };
  },

  // Quick RTL wrapper for any component
  rtlView: (isRTL, children) => {
    const style = isRTL ? { transform: [{ scaleX: -1 }] } : {};
    return { style, children };
  },

  // Get dynamic text direction
  getTextDirection: (isRTL = I18nManager.isRTL) => {
    return isRTL ? 'rtl' : 'ltr';
  },

  // Force re-render helper for instant updates
  forceUpdate: (isRTL, callback) => {
    if (callback) {
      callback(isRTL);
    }
  },
};

export default RTLUtils;
