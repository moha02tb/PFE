# RTL (Right-to-Left) Testing Guide for Pharmacies de Garde App

## Overview

This guide explains how to test the RTL functionality for Arabic language support in the Pharmacies de Garde mobile application.

## What Has Been Implemented

### 1. Language Context with RTL Support

- ✅ Updated `LanguageContext.js` to track RTL state
- ✅ Added automatic RTL detection based on selected language
- ✅ Integrated with React Native's `I18nManager`
- ✅ Added app restart functionality for proper RTL layout

### 2. RTL Utility Helper

- ✅ Created `RTLUtils.js` with helper functions for RTL-aware styling
- ✅ Includes functions for text alignment, flex direction, margins, and padding
- ✅ Provides style transformation utilities

### 3. Screen Updates

- ✅ **HomeScreen**: All layouts, text alignment, and UI components
- ✅ **SettingsScreen**: Modal layouts, options, and text alignment
- ✅ **CalendarScreen**: Date inputs, cards, and text alignment
- ✅ **MapScreen**: Search container and input fields
- ✅ **App.js**: Navigation tab labels with RTL support

### 4. Translation Files

- ✅ Added missing translations for Arabic and French
- ✅ All UI text is properly translated

## Testing Steps

### Step 1: Initial Setup

1. Start the app in default French language
2. Navigate through all screens to see LTR layout
3. Note the layout direction and text alignment

### Step 2: Switch to Arabic

1. Go to Settings screen
2. Tap on "Language" option
3. Select "🇹🇳 العربية" (Arabic)
4. **Expected**: App should prompt to restart for RTL changes

### Step 3: After Restart

1. The app should now display in RTL mode:
   - ✅ Text should align to the right
   - ✅ UI elements should flow from right to left
   - ✅ Icons should appear on the right side of text
   - ✅ Navigation elements should be mirrored

### Step 4: Test Each Screen

#### Home Screen

- ✅ Title should be right-aligned
- ✅ Search bar icon should be on the right
- ✅ Search input should align text to the right
- ✅ Pharmacy cards should have right border accent
- ✅ Card content should flow RTL
- ✅ Action buttons should be left-aligned (RTL equivalent of right-aligned)

#### Settings Screen

- ✅ All option rows should flow RTL
- ✅ Icons should be on the right side
- ✅ Text should be right-aligned
- ✅ Modal content should be RTL
- ✅ Contact options should flow RTL

#### Calendar Screen

- ✅ Date input should be RTL
- ✅ Calendar icon should be on the left (RTL equivalent)
- ✅ Pharmacy cards should have RTL layout

#### Map Screen

- ✅ Search container should be RTL
- ✅ Search input should align text to the right

### Step 5: Switch Back to French/English

1. Go to Settings > Language
2. Select French or English
3. **Expected**: App should prompt to restart
4. After restart, layout should return to LTR

## Key RTL Features Implemented

### Text Alignment

```javascript
textAlign: isRTL ? 'right' : 'left';
```

### Flex Direction

```javascript
flexDirection: isRTL ? 'row-reverse' : 'row';
```

### Margins and Padding

```javascript
...(isRTL ? { marginRight: 8 } : { marginLeft: 8 })
```

### Border Positioning

```javascript
...(isRTL ? { borderRightWidth: 4 } : { borderLeftWidth: 4 })
```

### Writing Direction

```javascript
writingDirection: isRTL ? 'rtl' : 'ltr';
```

## Common RTL Issues to Watch For

1. **Icons not repositioning**: Check if flex-direction is properly set to row-reverse
2. **Text still left-aligned**: Verify textAlign property is set correctly
3. **Margins not switching**: Ensure conditional margin properties are used
4. **Layout not updating**: App restart may be required after language change

## Troubleshooting

### RTL Not Working After Language Change

- Make sure to restart the app when prompted
- Check that `I18nManager.forceRTL()` is being called
- Verify the language code is 'ar' for Arabic

### Partial RTL Implementation

- Check that all style functions accept `isRTL` parameter
- Ensure all components import and use `useLanguage` hook
- Verify conditional styling is applied correctly

### Navigation Issues

- Make sure tab bar labels have RTL writing direction
- Check that navigation options are properly configured

## Files Modified for RTL Support

1. `screens/LanguageContext.js` - Core RTL logic
2. `utils/RTLUtils.js` - RTL utility functions (new file)
3. `screens/HomeScreen.js` - RTL styling
4. `screens/SettingsScreen.js` - RTL styling
5. `screens/CalendarScreen.js` - RTL styling
6. `screens/MapScreen.js` - RTL styling
7. `App.js` - Navigation RTL support
8. `locales/fr.json` - Added missing translations
9. `locales/ar.json` - Added missing translations

## Performance Notes

- RTL switching requires app restart for complete layout update
- Style calculations are done at render time
- No significant performance impact expected

## Browser/Development Testing

For development testing, you can also manually force RTL mode:

```javascript
import { I18nManager } from 'react-native';
I18nManager.forceRTL(true);
```

Then restart your development server and app.
