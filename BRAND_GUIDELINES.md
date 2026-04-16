# Brand Guidelines - Pharmacy Connect Design System

**Visual identity, design principles, and usage guidelines for a cohesive, modern pharmacy management platform**

---

## Table of Contents
1. [Brand Overview](#brand-overview)
2. [Design Philosophy](#design-philosophy)
3. [Color Usage Rules](#color-usage-rules)
4. [Typography Guidelines](#typography-guidelines)
5. [Spacing & Layout](#spacing--layout)
6. [Component Patterns](#component-patterns)
7. [Accessibility Standards](#accessibility-standards)
8. [Dark Mode Guidelines](#dark-mode-guidelines)
9. [Platform-Specific Considerations](#platform-specific-considerations)
10. [Design Anti-Patterns](#design-anti-patterns)

---

## Brand Overview

### Vision
Pharmacy Connect is a modern, professional platform that empowers pharmacy administrators and end-users to manage and discover pharmaceutical services with confidence and ease.

### Core Values
- **Professional**: Healthcare-focused design that inspires trust
- **Clear**: Information architecture that prioritizes clarity and scanability
- **Responsive**: Adaptable experiences across web and mobile platforms
- **Inclusive**: Accessible to all users regardless of ability
- **Modern**: Clean, contemporary aesthetics without sacrificing usability

### Target Audience
- Pharmacy Administrators (web app): Need structured dashboards and management tools
- End Users / Customers (mobile app): Need intuitive pharmacy discovery and information access

### Brand Personality
- Trustworthy and professional
- Approachable and helpful
- Modern but not trendy
- Efficient and practical
- Healthcare-conscious

---

## Design Philosophy

### Core Design Principles

#### 1. **Hierarchy Over Clutter**
Establish clear visual hierarchy through size, color, weight, and spacing. Users should immediately understand what's most important.

**Example:**
```
❌ WRONG: All elements equal weight
✅ RIGHT: Primary action larger, prominent color; secondary action smaller, muted color
```

#### 2. **Consistency Creates Confidence**
Standardize decisions across the platform. Consistent patterns help users build mental models faster.

**Guidelines:**
- Use the same color for the same semantic meaning across all screens
- Repeat successful component patterns
- Maintain consistent spacing throughout
- Use familiar interaction patterns

#### 3. **Accessibility First**
Design for everyone. Accessibility isn't an afterthought—it's foundational.

**Checklist:**
- Color contrast: WCAG AA minimum (4.5:1 for normal text, 3:1 for large)
- Keyboard navigation: All interactive elements accessible via keyboard
- Touch targets: Minimum 44x44px on mobile
- Semantic HTML: Proper heading hierarchy, form labels, ARIA roles
- Screen reader support: Meaningful alt text, proper announcements

#### 4. **Mobile-First, Responsive Always**
Design for mobile constraints first, then enhance for larger screens. Both web and mobile must be excellent.

**Implementation:**
- Start with mobile viewport (320px+)
- Test on real devices (not just browser emulation)
- Optimize touch interactions for fat fingers
- Provide alternate layouts for tablet/desktop
- Optimize for landscape orientation on mobile

#### 5. **Content Before Decoration**
Let content guide design decisions. Remove decorative elements that don't serve a purpose.

**Approach:**
- Data visualization: Use charts and graphs thoughtfully, not decoratively
- Icons: Use meaningful icons; avoid icon-only interactions
- Images: Include only when they add context
- Animations: Purposeful transitions that aid understanding

#### 6. **Progressive Disclosure**
Show only relevant information at each step. Hide complexity behind expandable sections, modals, or sequential flows.

**Patterns:**
- Collapse advanced options by default
- Use modals for secondary information
- Multi-step forms instead of overwhelming single-page forms
- Inline editing instead of full-page edits

---

## Color Usage Rules

### Primary Color (`#004AB7` / Light Blue)

**When to use:**
- Primary call-to-action buttons
- Main navigation (active state)
- Link text (underlined)
- Primary headings (if emphasis needed)
- Form focus states
- Primary interactive elements

**When NOT to use:**
- Large background areas (too saturated)
- Body text (too dark and overwhelming)
- Secondary actions (use secondary color instead)
- Disabled states (use tertiary color)

**Example hierarchy:**
```
[Primary Button] [Secondary Button] [Tertiary Button] [Ghost Button]
  Primary Color    Secondary Color   Tertiary Color    No Fill
```

### Secondary Color (`#006B5B` / Healing Green)

**When to use:**
- Positive states (success, available, open pharmacies)
- Secondary call-to-action buttons
- Confirmation dialogs and messages
- Progress indicators (completion)
- Success badges and status tags
- Secondary interactive elements

**When NOT to use:**
- Primary actions (use primary color)
- Error/warning states (independent semantic colors)
- Large text areas (overwhelming)
- Disabled states

**Example:** Open pharmacy badge in light green (`#90F5DE`) container with dark green text

### Tertiary Color (`#415462` / Professional Gray)

**When to use:**
- Secondary text and labels
- Disabled interactive elements
- Neutral badges and tags
- Secondary UI elements (icons, dividers)
- Form helper text
- Subtle backgrounds (surface-container)

**When NOT to use:**
- Primary actions or main content
- Large emphasis areas (not distinctive enough)
- High-contrast text on white (too low contrast)

### Error Color (`#BA1A1A` / Red)

**When to use:**
- Error messages and alerts
- Validation errors in forms
- Destructive actions (delete, close)
- Critical status indicators
- Error state borders on inputs
- Alert badges

**When NOT to use:**
- Any text or elements in normal flow (confusing if not critical)
- Multiple uses in healthy UI (dilutes urgency)

**Example pattern:**
```
❌ [Delete] button in red text foreground
✅ [Delete] button with red background, white text
```

### Success Color (`#22AA66` or `#006B5B`)

**When to use:**
- Confirmation messages
- Open/available status indicators
- Positive validation feedback
- Success state in multi-step flows
- Completion indicators (progress bars)

### Warning Color (`#F57C00` / Orange)

**When to use:**
- Cautionary messages
- Status that needs attention
- Deprecation notices
- Coming soon or limited availability

### Neutral Colors (Grays)

**Strategy:** Use a consistent neutral palette built from primary color variations for visual cohesion.

| Use Case | Token | Light | Dark |
|----------|-------|-------|------|
| Text | on-surface | `#171C1F` | `#E0E0E0` |
| Secondary text | on-surface-variant | `#424654` | `#A0A0B0` |
| Borders | outline | `#737786` | `#8A8E9E` |
| Disabled text | tertiary-light | `#BDBDBD` | `#424242` |
| Placeholder text | on-surface-variant | `#424654` | `#A0A0B0` |

### Accessibility in Color

**Rule: Never rely on color alone to communicate information.**

**Example:**
```
❌ WRONG: "Status is green (open) or red (closed)"
✅ RIGHT: "Status is open (green badge) or closed (red badge)" + icon indicator
```

**Color Contrast Minimums:**
- Body text: 4.5:1 (WCAG AA)
- Large text (18pt+): 3:1 (WCAG AA)
- UI components / icons: 3:1 (WCAG AA)
- Focus indicators: 3:1 minimum

**Testing:**
1. Use WebAIM Contrast Checker tool
2. Test with Chrome DevTools accessibility audit
3. Test with screen reader (NVDA, VoiceOver)
4. View in grayscale to catch color-only information

---

## Typography Guidelines

### Heading Hierarchy

Use headings to create a clear, scannable page structure. Each level should have distinct visual weight.

```
H1 (Display): Largest, used once per page (page title)
│
├─ H2 (Headline LG): Section headers
│   ├─ H3 (Headline MD): Subsection headers
│   └─ Body: Main content paragraphs
│
├─ H2 (Headline LG): Another section
│   └─ Body: Content
```

**Rules:**
- Start with H1 (one per page)
- Don't skip levels (H1 → H3 is wrong; go H1 → H2 → H3)
- Use semantic HTML (`<h1>`, `<h2>`, etc.) not for styling but for meaning
- Accompany visual hierarchy with semantic HTML hierarchy

**Example: Dashboard Page**
```
<h1>Dashboard</h1>          {/* Display Large: 32px, 700 weight */}

<h2>Key Metrics</h2>        {/* Headline LG: 24px, 700 weight */}
<div>Stat cards...</div>

<h2>Recent Activity</h2>    {/* Headline LG: 24px, 700 weight */}
<h3>Pharmacies</h3>         {/* Headline MD: 20px, 700 weight */}
<table>...</table>
```

### Text Styles by Context

| Context | Style | Size | Weight | Line Height | Usage |
|---------|-------|------|--------|-------------|-------|
| Page Title | Display | 32px | 700 | 40px | Main page heading |
| Section Heading | Headline LG | 24px | 700 | 32px | Major section headers |
| Subsection | Headline MD | 20px | 700 | 28px | Subsection headers |
| Small Header | Headline SM | 18px | 600 | 26px | Card titles, small sections |
| Main Body | Body LG | 16px | 400 | 24px | Paragraph text, descriptions |
| Secondary Body | Body MD | 14px | 400 | 20px | Secondary information |
| Small Text | Body SM | 12px | 400 | 16px | Captions, helper text |
| Form Labels | Label LG | 14px | 500 | 20px | Input labels |
| Button Text | Label LG | 14px | 500 | 20px | Button content |
| Badge Text | Label SM | 11px | 500 | 16px | Badge and tag text |

### Font Weight Usage

**Don't over-emphasize.** Three weights should be maximum on any page.

```
❌ WRONG: Regular, Medium, Semi-bold, Bold all on same page
✅ RIGHT: Regular (body) + Semi-bold (emphasis) + Bold (headings)
```

**Weights:**
- **400 (Regular)**: Body text, default text
- **500 (Medium)**: Form labels, subtitles, UI accents
- **600 (Semi-bold)**: Small headings, emphasis within body
- **700 (Bold)**: Main headings, strong emphasis

### Font Pairing

**Primary font: System stack** (optimized for each platform)
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial'
```

**Heading font: Manrope** (optional, for brand distinction)
```
Manrope, system fonts as fallback
```

**Why:** System fonts load instantly, match user OS aesthetics, and feel native to each platform.

---

## Spacing & Layout

### The 4px Grid

All spacing is based on multiples of 4px: 4, 8, 12, 16, 20, 24, 32, 48, 64...

**Benefits:**
- Maintains clarity across different screen sizes
- Creates visual rhythm and harmony
- Simplifies calculations and handoff between designers and developers
- Aligns with most framework default grid systems

### Spacing Rules

**Golden Rule: More space = less related**

```
Title        [8px gap]
Subtitle                    ← Items with small gap feel grouped

[16px gap]

Card 1                      ← Items with larger gap feel separated
[12px gap]
Card 2
```

### Common Spacing Patterns

| Component | Internal | External | Gap (children) |
|-----------|----------|----------|---|
| **Form Section** | 16px padding | 16px bottom margin | 8px (label to input) |
| **Card** | 16px padding | 12px bottom margin | 12px (between elements) |
| **List Item** | 12px vertical, 16px horizontal | 0 | - |
| **Modal** | 24px padding | 0 | 16px (sections) |
| **Button Group** | - | - | 8px (between buttons) |
| **Form Group** | - | - | 16px (between groups) |

### Responsive Spacing

**Mobile (320px - 768px):**
- Screen padding: 16px
- Card margin: 12px
- Section gap: 16px

**Tablet (768px - 1024px):**
- Screen padding: 20px
- Card margin: 16px
- Section gap: 20px

**Desktop (1024px+):**
- Screen padding: 24px
- Max content width: 1200px centered
- Card margin: 20px
- Section gap: 24px

---

## Component Patterns

### Buttons

**Anatomy:**
```
[Padding] [Icon?] [Text] [Icon?] [Padding]
  12px                                 12px
```

**Size variants:**
- **Small**: 36px height, 40px min width, 12px padding (mobile actions)
- **Medium**: 44px height, 100px min width, 16px padding (standard button)
- **Large**: 52px height, 120px min width, 20px padding (prominent actions)

**Variant purposes:**
- **Filled Primary**: Most important action per context
- **Filled Secondary**: Secondary related action
- **Outlined**: Tertiary action or alternative option
- **Ghost**: Least important action or cancel
- **Danger**: Destructive action (delete, logout)

**Button text rules:**
- Action verb + noun: "Create Pharmacy", "Add User", "Save Changes"
- Use title case: "Cancel", not "cancel"
- Concise: Max 2-3 words
- Avoid: "Submit", "OK", "Yes" (be specific)

### Forms

**Structure:**
```
[Label]
[Input field]
[Helper text OR Error message]

[Spacing between fields: 16px]

[Label]
[Input field]
[Error message]
```

**Anatomy of input field:**
- Height: 44px (touch target minimum)
- Padding: 12px horizontal, 10px vertical
- Border: 1px outline
- Focus: 2px border, outline + shadow

**States:**
```
DEFAULT:     Gray border, placeholder text visible
FOCUS:       Primary border (2px), cursor active
FILLED:      Success (secondary) or error (error) border
ERROR:       Error border, error text below in red
DISABLED:    Gray border, 50% opacity, cursor not-allowed
```

**Label placement:**
- Above input (mobile-first default)
- Optional: Floating labels can be used for web if space-constrained
- Never: Placeholder as label (inaccessible)

**Error messaging:**
- Always clear: "Email is required" not "Invalid input"
- Always actionable: "Username must be 4+ characters" not "Username error"
- Error text color: error (`#BA1A1A`)
- Error text size: Body SM (12px)
- Appear below input, not above

### Cards

**Structure:**
```
┌─────────────────┐
│     [Image]     │  ← Optional
├─────────────────┤
│  [Title]        │
│  [Description]  │
│  [Actions]      │
└─────────────────┘
```

**Elevation:**
- Default: Elevation 1 (subtle shadow)
- Hover: Elevation 2 (lifted appearance)
- Pressed: Elevation 1 (return to default)

**Content density:**
- Padding: 16px
- Between elements: 8-12px
- Margin below card: 12px

### Modals & Dialogs

**Key principles:**
- Must feel modal (distinct from page)
- Must have clear, tappable close button
- Must allow keyboard escape (ESC key)
- Backdrop: Darkened (rgba(0,0,0,0.5)) to emphasize focus

**Structure:**
```
┌────────────────────────┐
│ [Title]            [X] │  ← Close button
├────────────────────────┤
│ [Content]              │
│                        │
│                        │
├────────────────────────┤
│ [Cancel] [Action]      │  ← Buttons, right-aligned
└────────────────────────┘
```

**Sizing:**
- Mobile: Up to screen width - 32px padding (full width with margins)
- Web: Up to 600px width maximum centered
- Min height: Flexible based on content
- Padding: 24px

### Navigation

**Tab navigation:**
- Tab height: 48px
- Tab min width: 90px, max width: flexible
- Active indicator: Primary color bottom border (4px)
- Gap between tabs: 0 (flush against each other)
- Text: Label MD (14px, 500 weight)

**Sidebar navigation:**
- Item height: 44px minimum
- Item padding: 12px vertical, 16px horizontal
- Active state: Primary color background or left border
- Icon + text: Icon 24x24px, gap 12px, text Label LG
- Icon only (collapsed): Centered, 24x24px

### Lists & Tables

**List items:**
- Height: 48px minimum (touch target)
- Padding: 12px vertical, 16px horizontal
- Divider: 1px outline, full width
- Last item: No divider

**Table:**
- Header row: Secondary color background or elevated appearance
- Data rows: Alternating white and light-gray background (optional)
- Cell padding: 12px
- Row height: 44px minimum
- Dividers: 1px outline between rows

---

## Accessibility Standards

### Compliance Target: WCAG 2.1 Level AA

**Minimum requirements:**
- [ ] Color contrast: 4.5:1 for normal text, 3:1 for large text
- [ ] Touch targets: 44x44px minimum on mobile
- [ ] Keyboard navigation: All interactive elements accessible
- [ ] Focus indicators: Visible 2px outline, min 2:1 contrast
- [ ] Form labels: Associated with inputs via `<label>` tag
- [ ] Semantic HTML: Proper heading hierarchy, landmark elements
- [ ] Screen reader support: ARIA labels where needed, alt text on images
- [ ] Color: Never only use color to communicate meaning

### Keyboard Navigation

**All interactive elements must be keyboard accessible:**
- Buttons: TAB to focus, ENTER/SPACE to activate
- Links: TAB to focus, ENTER to activate
- Form inputs: TAB to focus, native keyboard behavior
- Modals: ESCAPE to close
- Dropdowns: Arrow keys to navigate, ENTER to select
- Tabs: Arrow keys to switch, ENTER to activate

**Focus order:**
- Must follow logical visual flow (top to bottom, left to right)
- Tab index: Use 0 for natural order, avoid >0 if possible
- Focus should never be invisible

### Screen Reader Support

**Essential elements:**
- [ ] Page landmark structure: `<nav>`, `<main>`, `<aside>`, `<footer>`
- [ ] Heading hierarchy: `<h1>` once per page, `<h2>`, `<h3>` in order
- [ ] Form labels: `<label for="fieldId">` not placeholder text
- [ ] Button purpose: Descriptive button text, not just "Click here"
- [ ] Images: Alt text for meaningful images, `alt=""` for decorative
- [ ] Icon buttons: Aria-label if not enough text context
- [ ] Lists: Use `<ul>`, `<ol>`, `<li>` for lists, not div containers
- [ ] ARIA when needed: `aria-label`, `aria-describedby`, `aria-expanded`, `role="alert"`

**Example:**
```html
✅ <button aria-label="Add new pharmacy"><span class="icon-plus"></span></button>
❌ <button><span class="icon-plus"></span></button>

✅ <input id="email" type="email" /> <label for="email">Email</label>
❌ <input type="email" placeholder="Email" />

✅ <img src="pharmacy.jpg" alt="Open pharmacy storefront" />
❌ <img src="pharmacy.jpg" />
```

### Color Contrast

**Minimum ratios:**
- Normal text (< 18px): 4.5:1 (AA) or 7:1 (AAA)
- Large text (18px+ or 600+): 3:1 (AA) or 4.5:1 (AAA)
- UI components & icons: 3:1 (AA) or 4.5:1 (AAA)

**Test with:**
- WebAIM Contrast Checker
- Chrome DevTools (Accessibility Audit)
- Tanaguru Contrast Finder

### Motion & Animation

**Guidelines:**
- Keep animations under 300ms for instant feedback
- Respect `prefers-reduced-motion` setting
- Avoid flashing content (> 2x per second)
- Use subtle, purposeful transitions

**Accessible animations:**
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark Mode Guidelines

### Neutral Colors in Dark Mode

Dark mode should invert contrast but maintain hierarchy and readability.

| Element | Light | Dark | Contrast Ratio |
|---------|-------|------|---|
| Text (primary) | `#171C1F` (87% lightness) | `#E0E0E0` (88% lightness) | 15.6:1 |
| Text (secondary) | `#424654` (36% lightness) | `#A0A0B0` (63% lightness) | 6.3:1 |
| Background | `#F6FAFE` (98% lightness) | `#0A0E27` (4% lightness) | 17:1 |
| Surface | `#F6FAFE` (98% lightness) | `#1A1F3A` (11% lightness) | 15:1 |

### Brand Color Adjustments (Dark Mode)

Some colors need adjusting for dark mode to maintain readability:

| Component | Light | Dark | Why |
|-----------|-------|------|-----|
| Primary | `#004AB7` | `#B2C5FF` | Lighter for contrast on dark bg |
| Secondary | `#006B5B` | `#73D8C2` | Lighter for contrast |
| Tertiary | `#415462` | `#B5C9D9` | Much lighter for visibility |
| Error | `#BA1A1A` | `#FFB4B4` | Lighter for dark background |
| Success | `#22AA66` | `#90F5DE` | Lighter for dark background |

### Image Handling in Dark Mode

- **Icons**: Use semantic color or invert if needed
- **Photos**: Add subtle scrim/overlay if too bright
- **Illustrations**: Design separate dark-mode versions if possible
- **Backgrounds**: Test images against dark surfaces for contrast

### Testing Dark Mode

Checklist:
- [ ] All text meets contrast ratios
- [ ] Colors don't feel inverted/unnatural
- [ ] No white branding or images blending into background
- [ ] Icons are visible and clear
- [ ] Form inputs are clearly visible
- [ ] Borders and dividers are visible
- [ ] Focus states are prominent
- [ ] Test on actual dark mode, not just dark background

---

## Platform-Specific Considerations

### Web App (React + Tailwind)

**Advantages:**
- Full control over spacing and layout
- Can use CSS Media Queries for responsiveness
- Can implement complex interactive patterns
- Desktop-first possible

**Constraints:**
- Must work on smaller screens (tablets/mobile views)
- Touch target sizes matter even for mouse users
- Screen readers important for accessibility

**Best practices:**
- Use Tailwind utilities consistently
- Implement responsive breakpoints (sm, md, lg, xl)
- Ensure keyboard navigation works
- Test on mobile viewports
- Use semantic HTML elements

**Example responsive pattern:**
```jsx
// Mobile first, then enhance for larger screens
<div className="p-4 md:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* Content */}
</div>
```

### Mobile App (React Native)

**Advantages:**
- Native performance and feel
- Platform-specific UI patterns available
- Touch-optimized by default
- Better offline capabilities possible

**Constraints:**
- Limited to mobile screen sizes (need to handle both portrait/landscape)
- No web standards like CSS
- Platform differences (iOS vs Android) need handling
- Typography system differs from web

**Best practices:**
- Use platform-specific components (iOS vs Android)
- Respect safe areas (notches, home indicators)
- Touch targets minimum 44x44pt
- Test on actual devices, not just simulator
- Handle both portrait and landscape

**Example responsive pattern:**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  }
});
```

### RTL (Right-to-Left) Languages

The system supports Arabic with RTL layout. Key considerations:

**Directional properties:**
- Avoid left/right in CSS; use start/end instead
- In React Native: Use `I18nManager` for RTL detection
- In Tailwind: Use `flex-row-reverse`, `text-right`, etc. for RTL

**Spacing:**
- Padding/margin should be logical (start/end) not physical (left/right)
- Borders should flip appropriately
- Icons may need mirroring (arrows, chevrons)

**Text:**
- Ensure fonts support Arabic characters
- Test text wrapping behavior
- Numbers and special characters may display differently

---

## Design Anti-Patterns

**❌ DO NOT:**

### Color
- Use color alone to communicate meaning (always add icon/text)
- Create contrast below 4.5:1 for body text
- Use more than 3 distinct colors per component
- Make primary color a light pastel (hard to read)

### Typography
- Skip heading levels (`<h1>` → `<h3>`)
- Use heading sizes for styling only (use semantic HTML)
- Use placeholder text as form labels
- Exceed 75 characters per line (hard to read)
- Use all-caps for body text (reduces readability)

### Spacing
- Use inconsistent spacing (breaks rhythm)
- Make spacing too tight (cramped, hard to scan)
- Make spacing too loose on mobile (wastes screen real estate)
- Use spacing that doesn't align to 4px grid

### Interactions
- Hide important information in collapsed sections
- Require hover to access critical information (mobile users can't)
- Use short timeouts for interactions (not enough time to react)
- Make buttons smaller than 44x44px on mobile
- Disable entire form for single validation error

### Accessibility
- Rely on color alone for information
- Use super small fonts (< 12px)
- Remove focus indicators
- Use placeholder as label
- Auto-play media or sound
- Create CAPTCHA that's basically impossible
- Require mouse-only interactions

### Navigation
- Use unclear navigation labels ("Stuff", "Things", "Options")
- Exceed 5-7 main navigation items (too many choices)
- Hide important navigation behind hamburger menus on desktop
- Create different navigation structures on different pages
- Forget to show current location in navigation

### Forms
- Mix required and optional fields without clear indication
- Place labels far from inputs
- Use placeholder text as label
- Hide error messages in red text alone
- Require specific format without hint (e.g., "phone number format")
- Auto-advance after input (frustrating on mobile)

---

## Review Checklist

Before shipping any UI changes:

### Visual Design
- [ ] Colors match DESIGN_TOKENS.md
- [ ] Spacing aligns to 4px grid
- [ ] Typography hierarchy is clear and semantic
- [ ] Icons are consistent with existing system
- [ ] Light and dark modes both work
- [ ] Component states all defined (default, hover, pressed, disabled, error, focus)

### Accessibility
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible and 2px minimum
- [ ] Form labels associated with inputs
- [ ] Semantic HTML used (headings, landmarks, lists)
- [ ] Alt text on images
- [ ] Tested with screen reader
- [ ] Touch targets 44x44px minimum on mobile

### Cross-Platform
- [ ] Works on web and mobile
- [ ] Responsive layout tested on mobile/tablet/desktop
- [ ] RTL (Arabic) layout works correctly
- [ ] Touch interactions feel natural (not click-first)
- [ ] Consistent brand appearance across platforms

### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized for platform
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Loading states visible and informative

### Internationalization
- [ ] Text can expand for other languages
- [ ] TextArea has enough space for translations
- [ ] Dates/times localized
- [ ] Numbers formatted by locale

---

## Questions & Decisions

### Should we create a visual component library (Storybook/Figma)?

**Recommendation:** Post-Phase 1, Phase 4.5
- Current: Create shared design tokens (this document)
- Phase 2-3: Apply tokens to components
- Phase 4: Create Storybook for web app, Figma for design system
- This ensures tokens are stabilized before investing in library tooling

### How do we handle iOS vs Android platform differences?

**Guidelines:**
- Use Material Design 3 as common foundation (available for iOS via expo)
- Respect platform conventions (navigation tabs at bottom for iOS, top for Android)
- Use platform-specific components when needed
- Test extensively on both real devices

### What about animations and micro-interactions?

**Recommendation:** Phase 4.5 (Optional)
- Current focus: Visual design consistency and accessibility
- Post-Phase 4: Create animation guidelines and library
- Keep animations purposeful (< 300ms, smooth easing)
- Always respect `prefers-reduced-motion`

---

## Version History

**v1.0** (Current) — Initial unified guidelines with Material Design 3 foundation

---

## Related Documentation

- [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) — Token definitions and implementation examples
- [admin_pharmacie/README.md](./admin_pharmacie/README.md) — Web app structure
- [ouerkema-pharmacieconnect-4c94773cce7d/README.md](./ouerkema-pharmacieconnect-4c94773cce7d/README.md) — Mobile app structure
