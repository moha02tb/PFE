# Design Tokens - Unified System

**Single source of truth for visual consistency across all Pharmacy Connect applications**

---

## Table of Contents
1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Shadows & Elevation](#shadows--elevation)
5. [Border Radius](#border-radius)
6. [Z-Index Hierarchy](#z-index-hierarchy)
7. [Component Specifications](#component-specifications)

---

## Color System

### Core Brand Colors

| Token | Light Mode | Dark Mode | Purpose | Usage |
|-------|-----------|-----------|---------|-------|
| `primary` | `#004AB7` | `#B2C5FF` | Primary brand color | CTAs, headers, main interactions |
| `primary-container` | `#1061E5` | `#1061E5` | Primary container | Elevated primary backgrounds |
| `primary-light` | `#E6EAFF` | `#001847` | Light primary | Hover/light backgrounds |
| `primary-dark` | `#0040A1` | `#4D9FFF` | Dark primary | Pressed states |

### Secondary Colors (Success & Actions)

| Token | Light Mode | Dark Mode | Purpose | Usage |
|-------|-----------|-----------|---------|-------|
| `secondary` | `#006B5B` | `#73D8C2` | Secondary brand | Positive states, open status |
| `secondary-container` | `#90F5DE` | `#005144` | Secondary container | Secondary backgrounds |
| `secondary-light` | `#66CC99` | `#1A7D4D` | Light secondary | Success states, hover |
| `secondary-dark` | `#1A7D4D` | `#90F5DE` | Dark secondary | Pressed states |

### Tertiary Colors (Professional & Neutral)

| Token | Light Mode | Dark Mode | Purpose | Usage |
|-------|-----------|-----------|---------|-------|
| `tertiary` | `#415462` | `#B5C9D9` | Tertiary accent | Secondary actions |
| `tertiary-container` | `#596C7A` | `#364956` | Tertiary container | Neutral backgrounds |
| `tertiary-light` | `#BDBDBD` | `#424242` | Light tertiary | Disabled/subtle elements |
| `tertiary-dark` | `#424242` | `#BDBDBD` | Dark tertiary | Secondary text |

### Semantic Colors

| Token | Light Mode | Dark Mode | Purpose | Usage |
|-------|-----------|-----------|---------|-------|
| `success` | `#22AA66` or `#006B5B` | `#73D8C2` | Success state | Positive confirmations, open pharmacies |
| `warning` | `#F57C00` | `#FFB74D` | Warning state | Caution, attention needed |
| `error` | `#BA1A1A` | `#FFB4B4` | Error state | Errors, alerts, deletions |
| `error-container` | `#FFDAD6` | `#93000A` | Error container | Light error backgrounds |
| `info` | `#1976D2` | `#90CAF9` | Information | Informational messages |

### Surface & Background Colors

| Token | Light Mode | Dark Mode | Purpose | Usage |
|-------|-----------|-----------|---------|-------|
| `background` | `#F6FAFE` | `#0A0E27` | Screen background | Primary background fill |
| `surface` | `#F6FAFE` | `#1A1F3A` | Surface color | Cards, components |
| `surface-variant` | `#DFE3E7` | `#252E4A` | Surface variant | Secondary surface |
| `surface-container` | `#EAEEF2` | `#1F2438` | Container | Contained surfaces |
| `surface-container-high` | `#E4E9ED` | `#2A3249` | High container | Elevated containers |
| `surface-dim` | `#D6DADE` | `#0F1319` | Dim surface | Depressed surfaces |
| `surface-bright` | `#F6FAFE` | `#2A2F45` | Bright surface | Lifted surfaces |

### Text & Foreground Colors

| Token | Light Mode | Dark Mode | Purpose | Usage |
|-------|-----------|-----------|---------|-------|
| `on-surface` | `#171C1F` | `#E0E0E0` | Primary text | Main body text |
| `on-surface-variant` | `#424654` | `#A0A0B0` | Secondary text | Secondary content |
| `on-background` | `#171C1F` | `#E0E0E0` | Background text | Text on backgrounds |
| `on-primary` | `#FFFFFF` | `#001847` | Text on primary | Text over primary colors |
| `on-secondary` | `#FFFFFF` | `#003D36` | Text on secondary | Text over secondary colors |
| `on-tertiary` | `#FFFFFF` | `#1C2938` | Text on tertiary | Text over tertiary colors |
| `on-error` | `#FFFFFF` | `#601410` | Text on error | Text over error colors |

### Neutral Colors

| Token | Value | Purpose |
|-------|-------|---------|
| `white` | `#FFFFFF` | Pure white |
| `black` | `#000000` | Pure black |
| `light-gray` | `#F5F5F5` | Light gray backgrounds |
| `medium-gray` | `#E0E0E0` | Medium gray borders |
| `dark-gray` | `#212121` | Dark gray text |

### Outline & Border Colors

| Token | Light Mode | Dark Mode | Purpose | Usage |
|-------|-----------|-----------|---------|-------|
| `outline` | `#737786` | `#8A8E9E` | Primary outline | Form borders, dividers |
| `outline-variant` | `#C2C6D7` | `#4A5060` | Outline variant | Secondary borders |
| `inverse-surface` | `#2C3134` | `#E4E9ED` | Inverse surface | Inverse backgrounds |
| `inverse-on-surface` | `#EDF1F5` | `#171C1F` | Inverse text | Text on inverse |
| `inverse-primary` | `#B2C5FF` | `#0056D2` | Inverse primary | Primary on inverse |

### Pharmacy Status Colors

| Status | Light Background | Light Text | Dark Background | Dark Text | Usage |
|--------|------------------|-----------|-----------------|-----------|-------|
| `open` | `#C8E6C9` | `#1B5E20` | `#1B5E20` | `#C8E6C9` | Open pharmacy indicator |
| `closed` | `#FFCCCC` | `#B71C1C` | `#B71C1C` | `#FFCCCC` | Closed pharmacy indicator |
| `emergency` | `#FFE0B2` | `#E65100` | `#E65100` | `#FFE0B2` | Emergency service indicator |
| `on-duty` | `#E1BEE7` | `#6A1B9A` | `#6A1B9A` | `#E1BEE7` | On-duty pharmacy indicator |

---

## Typography

### Font Families

```javascript
{
  "primary": "System, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  "heading": "Manrope, System, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
  "body": "Public Sans, System, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'",
  "monospace": "'Courier New', 'Courier', monospace"
}
```

### Font Weight

| Token | Weight | Usage |
|-------|--------|-------|
| `regular` | 400 | Body text, default |
| `medium` | 500 | Subtitles, secondary text |
| `semi-bold` | 600 | Tertiary headings, emphasis |
| `bold` | 700 | Primary headings, strong emphasis |

### Typography Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|-----------------|-------|
| `display-large` | 32px | 700 | 40px | 0px | Large prominent headings |
| `display-medium` | 28px | 700 | 36px | 0px | Medium prominent headings |
| `display-small` | 24px | 700 | 32px | 0px | Standard headings |
| `headline-lg` | 24px | 700 | 32px | 0px | Section headers |
| `headline-md` | 20px | 700 | 28px | 0px | Subsection headers |
| `headline-sm` | 18px | 600 | 26px | 0px | Small headers |
| `title-lg` | 18px | 500 | 24px | 0.1px | Card titles |
| `title-md` | 16px | 600 | 24px | 0.15px | Dialog titles |
| `title-sm` | 14px | 600 | 20px | 0.1px | List item titles |
| `body-lg` | 16px | 400 | 24px | 0.5px | Main body text |
| `body-md` | 14px | 400 | 20px | 0.25px | Secondary body text |
| `body-sm` | 12px | 400 | 16px | 0.4px | Small body text, captions |
| `label-lg` | 14px | 500 | 20px | 0.1px | Form labels, buttons |
| `label-md` | 12px | 500 | 16px | 0.5px | Secondary labels |
| `label-sm` | 11px | 500 | 16px | 0.5px | Small labels, badges |

---

## Spacing & Layout

### Base Unit: 4px Grid

```javascript
{
  "0": 0,
  "4": 4,      // xs
  "8": 8,      // sm
  "12": 12,    // md
  "16": 16,    // lg
  "20": 20,
  "24": 24,    // xl
  "28": 28,
  "32": 32,    // xxl
  "36": 36,
  "40": 40,
  "44": 44,
  "48": 48,    // xxxl
  "52": 52,
  "56": 56,
  "60": 60,
  "64": 64,
  "72": 72,
  "80": 80,
  "96": 96
}
```

### Component Spacing

| Component | External Margin | Internal Padding | Gap (children) |
|-----------|------------------|------------------|----------------|
| **Screen** | 0 | 16px (horizontal) | - |
| **Card** | 12px bottom | 16px | 8px |
| **List Item** | 0 | 12px (vert), 16px (horiz) | - |
| **Input** | 8px bottom | 12px (horiz), 10px (vert) | 8px (label to input) |
| **Form Section** | 0 | - | 16px (between sections) |
| **Button Group** | 0 | - | 8px |
| **Modal** | 0 | 24px | 16px |
| **Dialog** | 0 | 24px | 12px |
| **Divider** | 16px (vert) | 0 | - |

### Touch Targets (Minimum 44x44pt on mobile)

```javascript
{
  "button": "44px height × 100px min width",
  "input": "44px height",
  "tab": "48px height",
  "list-item": "48px height",
  "icon-button": "48x48px",
  "checkbox": "20x20px (with 44x44px padding)",
  "radio": "20x20px (with 44x44px padding)"
}
```

### Layout Constants

| Token | Value | Purpose |
|-------|-------|---------|
| `screen-h-pad` | 16px | Horizontal padding from screen edges |
| `screen-v-pad` | 16px | Vertical padding from top/bottom |
| `max-content-width` | 600px | Maximum width for content on tablet/desktop |
| `modal-padding` | 24px | Padding inside modals |
| `sheet-radius` | 20px | Border radius for bottom sheets |
| `card-radius` | 12px | Border radius for cards |

---

## Shadows & Elevation

### Shadow Elevation System (Material Design 3)

#### Light Mode

| Elevation | Shadow | Usage |
|-----------|-----------|-------|
| **0** | None | Flat elements |
| **1** | `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)` | Flat cards, buttons |
| **2** | `0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)` | Elevated cards, chips |
| **3** | `0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)` | Floating buttons, popovers |
| **4** | `0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)` | Modals, dialogs, tooltips |
| **5** | `0 20px 40px rgba(0,0,0,0.2)` | Top-level modals, overlays |

#### Dark Mode

| Elevation | Shadow | Usage |
|-----------|-----------|-------|
| **0** | None | Flat elements |
| **1** | `0 1px 3px rgba(0,0,0,0.3)` | Flat cards, buttons |
| **2** | `0 3px 6px rgba(0,0,0,0.4)` | Elevated cards, chips |
| **3** | `0 10px 20px rgba(0,0,0,0.4)` | Floating buttons, popovers |
| **4** | `0 15px 25px rgba(0,0,0,0.4)` | Modals, dialogs, tooltips |
| **5** | `0 20px 40px rgba(0,0,0,0.5)` | Top-level modals, overlays |

---

## Border Radius

### Scale

| Token | Value | Size Category | Usage |
|-------|-------|----------------|-------|
| `none` | 0px | - | Sharp corners |
| `xs` | 2px | Extra small | Minimal rounding |
| `sm` | 4px | Small | Small components, buttons |
| `md` | 8px | Medium | Input fields, small cards |
| `lg` | 12px | Large | Cards, medium components |
| `xl` | 16px | Extra large | Larger cards, containers |
| `2xl` | 20px | 2x large | Modals, sheets, large overlays |
| `3xl` | 24px | 3x large | Large modals, containers |
| `full` | 9999px | Full | Pills, circular badges, avatars |

---

## Z-Index Hierarchy

```javascript
{
  "dropdown": 100,              // Dropdown menus
  "sticky": 200,                // Sticky headers/footers
  "fixed": 300,                 // Fixed navigation
  "modal-backdrop": 400,        // Modal backdrops/overlays
  "modal": 500,                 // Modals, dialogs
  "popover": 600,               // Popovers, tooltips
  "notification": 700,          // Notifications, toasts
  "tooltip": 800,               // Tooltips
  "context-menu": 900,          // Context menus
  "dev-tools": 999999           // Development tools
}
```

---

## Component Specifications

### Button

**Sizing:**
- Height: 44px (mobile), 40px (web)
- Padding: 16px horizontal, 10px vertical
- Min Width: 100px

**States:**
- Default: Base colors from color system
- Hover: Lighter shade (+10% lightness)
- Pressed: Darker shade (-10% lightness)
- Disabled: 50% opacity, cursor: not-allowed
- Focus: Outline: 2px solid primary color, 2px offset

**Variants:**
- Primary: Primary color background, white text
- Secondary: Secondary color background, white text
- Tertiary: Tertiary color background, white text
- Outline: Transparent background, outline border, text color
- Ghost: Transparent background, no border
- Danger: Error color background, white text

### Input / Form Field

**Sizing:**
- Height: 44px (mobile), 40px (web)
- Padding: 12px horizontal, 10px vertical
- Border: 1px solid outline color

**States:**
- Default: outline-variant border
- Focused: outline border, 2px
- Error: error border, error text below
- Disabled: outline-variant border, 50% opacity
- Filled: surface-container background

**Label & Error:**
- Label Gap: 8px above input
- Error Gap: 4px below input
- Error Color: error color
- Error Text: label-sm size

### Card

**Sizing:**
- Padding: 16px
- Border Radius: lg (12px)
- Margin Bottom: 12px

**States:**
- Default: surface color, elevation 1
- Hover: elevation 2, subtle background lighten
- Pressed: elevation 1, background darken

### Modal / Dialog

**Sizing:**
- Padding: 24px
- Border Radius: 2xl (20px)
- Max Width: 90vw (web), full width - 32px (mobile)
- Min Width: 280px

**Backdrop:**
- Background: rgba(0, 0, 0, 0.5)
- Z-Index: 400 (backdrop), 500 (modal)
- Animation: Fade in 200ms ease-out

**Header:**
- Font: headline-lg
- Margin Bottom: 16px
- Close Button: Icon button, top-right

### Tab

**Sizing:**
- Height: 48px
- Padding: 12px horizontal
- Min Width: 90px

**States:**
- Active: Color primary, underline 2px
- Inactive: Color on-surface-variant, no underline
- Hover: Background surface-container

---

## Usage Examples

### Web App (React + Tailwind CSS)

```javascript
// In Tailwind config:
theme: {
  colors: {
    primary: '#004AB7',
    'primary-container': '#1061E5',
    secondary: '#006B5B',
    tertiary: '#415462',
    error: '#BA1A1A',
    success: '#22AA66',
    // ... all colors as defined above
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    // ... 4px grid scale
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    // ... as defined above
  }
}

// Usage in components:
<button className="bg-primary text-on-primary px-lg py-md rounded-md hover:bg-primary-dark">
  Primary Button
</button>

<div className="bg-surface rounded-lg p-lg shadow-md">
  Card content
</div>
```

### Mobile App (React Native)

```javascript
import { DESIGN_TOKENS, createTheme } from './constants/tokens';

const theme = createTheme(isDarkMode);

// Usage in components:
<TouchableOpacity style={{
  backgroundColor: theme.colors.primary,
  paddingHorizontal: theme.spacing.lg,
  paddingVertical: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  height: theme.layout.buttonHeight
}}>
  <Text style={{
    color: theme.colors.onPrimary,
    ...theme.textStyles.labelLg
  }}>
    Primary Button
  </Text>
</TouchableOpacity>

<View style={{
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.lg,
  padding: theme.spacing.lg,
  marginBottom: theme.spacing.md,
  ...theme.shadows.elevation2
}}>
  {/* Card content */}
</View>
```

---

## Implementation Checklist

### Web App (admin_pharmacie)

- [ ] Update `tailwind.config.js` to use unified color tokens
- [ ] Verify Material Design 3 colors align with DESIGN_TOKENS
- [ ] Update `src/styles/globals.css` with token-based utility classes
- [ ] Refactor all components to use token-based classes
- [ ] Test light and dark mode with token colors

### Mobile App (ouerkema-pharmacieconnect-4c94773cce7d)

- [ ] Update `constants/tokens.js` color exports to match unified palette
- [ ] Update `utils/colors.js`, `utils/typography.js`, `utils/spacing.js`
- [ ] Update `utils/shadows.js` to match elevation system
- [ ] Refactor all screens to use `createTheme()` from unified tokens
- [ ] Verify light and dark mode consistency

### Documentation

- [ ] Create visual style guide showing all colors with swatches
- [ ] Create typography scale with examples
- [ ] Document spacing grid with visual guide
- [ ] Create elevation/shadow visual hierarchy
- [ ] Generate component reference with token usage examples

---

## Maintenance

### Adding New Tokens

1. Add token definition in appropriate section above
2. Update both web and mobile implementations
3. Document usage example
4. Test in both light and dark modes
5. Update this document

### Token Changes

1. Update DESIGN_TOKENS.md with new values
2. Update both web and mobile token files
3. Run cross-platform visual regression tests
4. Document breaking changes in CHANGELOG

### Versioning

Current Version: **1.0.0** (Initial unified system)

---

## Related Documentation

- [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md) — Brand identity and usage rules
- [admin_pharmacie/README.md](./admin_pharmacie/README.md) — Web app implementation
- [ouerkema-pharmacieconnect-4c94773cce7d/README.md](./ouerkema-pharmacieconnect-4c94773cce7d/README.md) — Mobile app implementation
