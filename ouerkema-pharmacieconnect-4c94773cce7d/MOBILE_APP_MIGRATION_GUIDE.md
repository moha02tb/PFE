# Mobile App (ouerkema-pharmacieconnect) - Design Tokens Migration Guide

**Status**: Phase 3.1 - Colors Updated ✅

This guide helps apply the unified design tokens throughout the React Native application.

---

## Updated Components ✅

- [x] Color System (`utils/colors.js`) — Aligned with DESIGN_TOKENS.md
- [x] Color palette matches web app primary (#004AB7), secondary (#006B5B), tertiary (#415462)

---

## Token Usage Quick Reference

### Colors (React Native)

```javascript
import { DESIGN_TOKENS } from '../constants/tokens';

const theme = createTheme(isDarkMode);

// Primary Button
backgroundColor: theme.colors.primary;
color: theme.colors.onPrimary;

// Secondary Content
color: theme.colors.textSecondary;

// Error State
borderColor: theme.colors.error;
backgroundColor: theme.colors.errorContainer;

// Surface
backgroundColor: theme.colors.surface;
```

### Spacing (4px Grid)

```javascript
// All spacing based on 4px grid:
paddingHorizontal: 16,  // lg
paddingVertical: 12,    // md
marginBottom: 8,        // sm
gap: 16,               // lg

// From SPACING constants:
spacing.xs = 4,   // Extra small
spacing.sm = 8,   // Small
spacing.md = 12,  // Medium
spacing.lg = 16,  // Large
spacing.xl = 24,  // Extra large
spacing.xxl = 32, // 2x large
spacing.xxxl = 48 // 3x large
```

### Typography

```javascript
// Headers
...TYPOGRAPHY.h1     // 24px, 700 weight
...TYPOGRAPHY.h2     // 20px, 700 weight
...TYPOGRAPHY.h3     // 18px, 600 weight

// Body
...TYPOGRAPHY.body     // 16px, 400 weight
...TYPOGRAPHY.bodyBold // 16px, 600 weight

// Labels
...TYPOGRAPHY.subtitle   // 14px, 500 weight
...TYPOGRAPHY.label      // 12px, 500 weight

// Captions
...TYPOGRAPHY.small      // 11px, 400 weight
```

### Shadows

```javascript
// From SHADOW_PRESETS - use elevation levels:
// elevation1: Subtle shadows
// elevation2: Elevated cards
// elevation3: Floating buttons
// elevation4: Modals
// elevation5: Overlays

...SHADOWS.elevation1   // Light shadow
...SHADOWS.elevation2   // Medium shadow
```

---

## Migration Patterns

### Pattern 1: Touch Button Component

**Before:**

```javascript
<TouchableOpacity
  style={{
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  }}
>
  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Button</Text>
</TouchableOpacity>
```

**After:**

```javascript
const theme = createTheme(isDarkMode);

<TouchableOpacity
  style={{
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  }}
>
  <Text
    style={{
      color: theme.colors.onPrimary,
      ...theme.textStyles.labelLg,
    }}
  >
    Button
  </Text>
</TouchableOpacity>;
```

### Pattern 2: Card Component

**Before:**

```javascript
<View
  style={{
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }}
>
  <Text>{content}</Text>
</View>
```

**After:**

```javascript
const theme = createTheme(isDarkMode);

<View
  style={{
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.elevation2,
  }}
>
  <Text style={{ color: theme.colors.text }}>{content}</Text>
</View>;
```

### Pattern 3: Input Field

**Before:**

```javascript
<TextInput
  style={{
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
  }}
  placeholder="Enter text"
/>
```

**After:**

```javascript
const theme = createTheme(isDarkMode);

<TextInput
  style={{
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.textStyles.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  }}
  placeholder="Enter text"
  placeholderTextColor={theme.colors.textTertiary}
/>;
```

### Pattern 4: Status Badge

**Before:**

```javascript
const badgeColor = status === 'open' ? '#C8E6C9' : '#FFCCCC';
const textColor = status === 'open' ? '#1B5E20' : '#B71C1C';

<View style={{ backgroundColor: badgeColor, borderRadius: 20, padding: 8 }}>
  <Text style={{ color: textColor, fontWeight: '600' }}>{status}</Text>
</View>;
```

**After:**

```javascript
import { getBadgeColors } from '../utils/colors';

const badgeColors = getBadgeColors(status, isDarkMode);

<View
  style={{
    backgroundColor: badgeColors.background,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.sm,
  }}
>
  <Text
    style={{
      color: badgeColors.text,
      ...TEXT_STYLES.labelSm,
      fontWeight: '600',
    }}
  >
    {status}
  </Text>
</View>;
```

### Pattern 5: Text Hierarchy

**Before:**

```javascript
<Text style={{ fontSize: 24, fontWeight: 'bold', color: '#212121' }}>
  Heading
</Text>
<Text style={{ fontSize: 16, color: '#212121' }}>
  Body text
</Text>
<Text style={{ fontSize: 14, color: '#757575' }}>
  Secondary text
</Text>
```

**After:**

```javascript
const theme = createTheme(isDarkMode);

<Text style={{ ...theme.textStyles.h1, color: theme.colors.text }}>
  Heading
</Text>
<Text style={{ ...theme.textStyles.body, color: theme.colors.text }}>
  Body text
</Text>
<Text style={{ ...theme.textStyles.subtitle, color: theme.colors.textSecondary }}>
  Secondary text
</Text>
```

---

## Files to Update (Priority Order)

### High Priority (Core Components)

- [ ] `components/design-system/Button.js` — Button styling
- [ ] `components/design-system/Input.js` — Input styling
- [ ] `components/design-system/Card.js` — Card styling
- [ ] `components/design-system/Badge.js` — Badge styling
- [ ] `components/PharmacyCard.js` — Pharmacy card component
- [ ] `components/PharmacyDetailsModal.js` — Modal styling

### Medium Priority (Screens)

- [ ] `screens/HomeScreen.js` — Search and list styling
- [ ] `screens/MapboxMapScreen.js` — Map controls
- [ ] `screens/CalendarScreen.js` — Calendar styling
- [ ] `screens/SettingsScreen.js` — Settings controls

### Lower Priority (Supporting)

- [ ] `screens/FavoritesContext.js` — Context styling
- [ ] `screens/FilterContext.js` — Filter UI
- [ ] `components/RTLAnimatedView.js` — Animation colors
- [ ] `components/RTLProvider.js` — Provider styling

---

## Color Substitution Reference

When migrating components, use this reference:

| Old Color | New Token                     | RGB Value | Usage               |
| --------- | ----------------------------- | --------- | ------------------- |
| `#0066CC` | `theme.colors.primary`        | #004AB7   | Primary actions     |
| `#004D99` | `theme.colors.primaryDark`    | #0040A1   | Pressed primary     |
| `#4D9FFF` | `theme.colors.primaryLight`   | #E6EAFF   | Light backgrounds   |
| `#22AA66` | `theme.colors.secondary`      | #006B5B   | Secondary/success   |
| `#66CC99` | `theme.colors.secondaryLight` | #90F5DE   | Success backgrounds |
| `#757575` | `theme.colors.tertiary`       | #415462   | Secondary actions   |
| `#D32F2F` | `theme.colors.error`          | #BA1A1A   | Errors              |
| `#212121` | `theme.colors.text`           | #171C1F   | Primary text        |
| `#757575` | `theme.colors.textSecondary`  | #424654   | Secondary text      |
| `#BDBDBD` | `theme.colors.textTertiary`   | #BDBDBD   | Tertiary text       |
| `#FFFFFF` | `theme.colors.surface`        | #F6FAFE   | Light surface       |
| `#F5F5F5` | `theme.colors.surface`        | #F6FAFE   | Light background    |
| `#E0E0E0` | `theme.colors.border`         | #737786   | Borders             |

---

## Spacing Substitution Reference

| Old Value (px)   | New Token      | Constant     |
| ---------------- | -------------- | ------------ |
| 4                | `spacing.xs`   | SPACING.xs   |
| 8                | `spacing.sm`   | SPACING.sm   |
| 12               | `spacing.md`   | SPACING.md   |
| 16               | `spacing.lg`   | SPACING.lg   |
| 24               | `spacing.xl`   | SPACING.xl   |
| 32               | `spacing.xxl`  | SPACING.xxl  |
| 48               | `spacing.xxxl` | SPACING.xxxl |
| Avoid hardcoding | Use constants  | SPACING.\*   |

---

## Typography Usage Examples

### Text Size Chart

| Style     | Size | Weight | Usage           | Code                  |
| --------- | ---- | ------ | --------------- | --------------------- |
| Display   | 32px | 700    | Large headings  | `TYPOGRAPHY.display`  |
| H1        | 24px | 700    | Page titles     | `TYPOGRAPHY.h1`       |
| H2        | 20px | 700    | Section headers | `TYPOGRAPHY.h2`       |
| H3        | 18px | 600    | Subsections     | `TYPOGRAPHY.h3`       |
| Body      | 16px | 400    | Main content    | `TYPOGRAPHY.body`     |
| Body Bold | 16px | 600    | Emphasis        | `TYPOGRAPHY.bodyBold` |
| Subtitle  | 14px | 500    | Labels          | `TYPOGRAPHY.subtitle` |
| Label     | 12px | 500    | Small text      | `TYPOGRAPHY.label`    |
| Caption   | 11px | 400    | Captions        | `TYPOGRAPHY.small`    |

---

## Accessibility & Touch Targets

**React Native specific guidelines:**

```javascript
// Minimum touch target: 44x44 pt
const buttonHeight = 44;
const buttonMinWidth = 100;

// Padding to achieve touch targets
paddingVertical: 10,  // Total: 44pt with text/icon
paddingHorizontal: 16,

// Accessible colors
// All text colors should have sufficient contrast
// Use theme.colors for automatic dark mode support
```

---

## Dark Mode Implementation

The design system automatically handles dark mode:

```javascript
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { createTheme } from '../constants/tokens';

function MyComponent() {
  const { isDarkMode } = useContext(LanguageContext);
  const theme = createTheme(isDarkMode);

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text
        style={{
          color: theme.colors.text,
          ...theme.textStyles.body,
        }}
      >
        Content
      </Text>
    </View>
  );
}
```

**Never do this:**

```javascript
// ❌ WRONG - Manual color switching
const textColor = isDarkMode ? '#E0E0E0' : '#212121';

// ✅ RIGHT - Use theme
const textColor = theme.colors.text;
```

---

## Step-by-Step Update Process

### For Each Component:

1. **Import Theme**

   ```javascript
   import { DESIGN_TOKENS, createTheme } from '../constants/tokens';
   import { useContext } from 'react';
   import { LanguageContext } from '../context/LanguageContext';
   ```

2. **Get Theme**

   ```javascript
   function MyComponent() {
     const { isDarkMode } = useContext(LanguageContext);
     const theme = createTheme(isDarkMode);
     // ...
   }
   ```

3. **Apply to Styles**

   ```javascript
   backgroundColor: theme.colors.surface,
   color: theme.colors.text,
   padding: theme.spacing.lg,
   borderRadius: theme.borderRadius.md,
   ```

4. **Test**
   - Light mode looks good
   - Dark mode looks good
   - All text readable
   - Buttons distinct
   - No undefined theme values

---

## Validation Checklist

For each updated component:

- [ ] Imports DESIGN_TOKENS or createTheme
- [ ] Uses theme.colors instead of hardcoded colors
- [ ] Uses theme.spacing instead of hardcoded sizes
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Touch targets still 44x44pt minimum
- [ ] Text color contrasts verified
- [ ] No hardcoded color values remain in styles

---

## Common Issues & Solutions

**Issue: Undefined theme property**

```javascript
// ❌ theme.colors.backgroundColor doesn't exist
backgroundColor: theme.colors.backgroundColor;

// ✅ Use correct property name
backgroundColor: theme.colors.surface;
```

**Issue: Not updating with theme changes**

```javascript
// ❌ Not re-rendering when isDarkMode changes
const theme = createTheme(false); // Always uses light

// ✅ Read isDarkMode from context
const { isDarkMode } = useContext(LanguageContext);
const theme = createTheme(isDarkMode);
```

**Issue: Colors not matching design**

```javascript
// ❌ Using old color values
backgroundColor: '#0066CC'; // Old primary

// ✅ Use unified color
backgroundColor: theme.colors.primary; // #004AB7
```

---

## Next Steps

1. **Design System Components** — Update all design-system/ components
2. **High-Traffic Screens** — Update HomeScreen, DetailsModal, MapScreen
3. **Remaining Screens** — Update CalendarScreen, SettingsScreen, etc.
4. **Testing** — Full visual regression testing
5. **Device Testing** — Test on actual iOS and Android devices

---

## References

- [DESIGN_TOKENS.md](../../DESIGN_TOKENS.md) — Token definitions
- [BRAND_GUIDELINES.md](../../BRAND_GUIDELINES.md) — Usage guidelines
- [constants/tokens.js](../constants/tokens.js) — Available tokens
- [utils/colors.js](../utils/colors.js) — Color functions
- [utils/typography.js](../utils/typography.js) — Typography utilities
