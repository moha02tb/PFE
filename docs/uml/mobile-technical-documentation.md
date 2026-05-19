# PHARMACIES DE GARDE - TECHNICAL DOCUMENTATION RAPPORT

**Project Name:** Pharmacies de Garde  
**Version:** 1.0.0  
**Date:** February 18, 2026  
**Language:** React Native (Expo)  
**Platform:** iOS, Android, Web (via Expo)

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture & Structure](#architecture--structure)
4. [Core Features](#core-features)
5. [Technology Stack](#technology-stack)
6. [Project Structure](#project-structure)
7. [Components Documentation](#components-documentation)
8. [Screens Documentation](#screens-documentation)
9. [Context Providers](#context-providers)
10. [Utilities & Hooks](#utilities--hooks)
11. [Configuration Guide](#configuration-guide)
12. [Installation & Setup](#installation--setup)
13. [Running the Application](#running-the-application)
14. [Multi-Language Support](#multi-language-support)
15. [RTL Implementation](#rtl-implementation)
16. [Dark Mode Implementation](#dark-mode-implementation)
17. [Map Integration](#map-integration)
18. [Notification System](#notification-system)
19. [API & Dependencies](#api--dependencies)
20. [Troubleshooting](#troubleshooting)

---

## EXECUTIVE SUMMARY

**Pharmacies de Garde** is a React Native mobile application designed to help users find on-duty pharmacies in Tunisia. The application provides:

- **Real-time pharmacy location discovery** via interactive maps
- **Multi-language support** (French, English, Arabic) with RTL layout support
- **Dark/Light theme switching** for enhanced user experience
- **Date-based pharmacy search** to find pharmacies on duty for specific dates
- **Push notifications** for pharmacy reminders
- **Responsive design** compatible with iOS, Android, and Web platforms

### Key Capabilities:
- ✅ Search pharmacies by location or name
- ✅ View pharmacy details (address, phone, hours)
- ✅ Make direct calls to pharmacies
- ✅ Get directions to pharmacy locations
- ✅ Switch between French, English, and Arabic
- ✅ Enable/disable dark mode
- ✅ Receive pharmacy notifications
- ✅ Multiple map tile providers for better coverage

---

## PROJECT OVERVIEW

### Purpose
The application serves as a comprehensive pharmacy finder and information system, specifically tailored for Tunisia's pharmacy network. Users can quickly locate available pharmacies based on:
- Current location
- Specific date
- Search keywords

### Target Users
- Patients needing immediate pharmacy services
- Elderly individuals looking for specific medications
- Emergency cases requiring 24-hour pharmacies

### Geographic Focus
Tunisia (optimized for Tunisian pharmacy locations and map providers)

---

## ARCHITECTURE & STRUCTURE

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         EXPO APPLICATION (React Native)         │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼───┐      ┌────▼───┐     ┌────▼───┐
   │ App.js │      │ i18n.js │     │index.js│
   └────┬───┘      └────┬───┘     └────┬───┘
        │               │              │
   ┌────▼────────────────┴──────────────┘
   │
   ├─ Context Providers (Global State)
   │  ├─ ThemeProvider (Dark Mode)
   │  ├─ LanguageProvider (i18n + RTL)
   │  └─ NotificationProvider (Notifications)
   │
   ├─ Bottom Tab Navigator
   │  ├─ HomeScreen
   │  ├─ MapScreen
   │  ├─ CalendarScreen
   │  └─ SettingsScreen
   │
   ├─ Components
   │  ├─ PharmacyCard
   │  ├─ RTLAnimatedView
   │  ├─ RTLProvider
   │  └─ RTLTestComponent
   │
   ├─ Utilities
   │  ├─ RTLUtils
   │  └─ pharmacyDataLoader
   │
   └─ Hooks
      └─ useForceUpdate
```

---

## CORE FEATURES

### 1. **Multi-Language Support (i18n)**
- **Supported Languages:**
  - French (Français) - Default
  - English
  - Arabic (العربية) - RTL enabled

- **Implementation:** react-i18next + AsyncStorage
- **Translation Files Location:** `/locales/` directory
- **Persistent Storage:** Language choice saved to device storage

### 2. **Right-to-Left (RTL) Layout Support**
- **Automatic RTL activation** when Arabic is selected
- **Dynamic layout mirroring** for all screens
- **Navigation header adjustments** for RTL mode
- **Animated transitions** when switching languages

### 3. **Dark Mode / Light Mode Theme**
- **Real-time theme switching** without app restart
- **Auto-detection** of system theme preference
- **Color scheme adjustments** across all components
- **Persistent preference** saved to AsyncStorage

### 4. **Interactive Map Features**
- **Multiple tile providers:**
  - OpenStreetMap France
  - CartoDB Positron
  - CartoDB Dark Matter
  - Stamen Terrain
  - Optional: Mapbox integration

- **Location services:**
  - User location tracking
  - Pharmacy location markers
  - Place search via Nominatim geocoding

### 5. **Pharmacy Search & Filtering**
- **Real-time search** by name or address
- **Date-based filtering** for on-duty pharmacies
- **Status indicators:**
  - Open/Closed status
  - Emergency availability
  - Business hours

### 6. **Notification System**
- **Local notifications** (Expo SDK 53+)
- **Pharmacy reminders**
- **Daily reminder scheduling**
- **Permission management**

### 7. **Contact Features**
- **Direct phone calls** to pharmacies
- **Map navigation** to pharmacy locations
- **Pharmacy information display**

---

## TECHNOLOGY STACK

### Frontend Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.79.5 | Mobile UI framework |
| React | 19.0.0 | Component library |
| Expo | 53.0.27 | Development platform |

### Navigation & State Management
| Library | Version | Purpose |
|---------|---------|---------|
| @react-navigation/native | 7.1.14 | Navigation container |
| @react-navigation/bottom-tabs | 7.4.2 | Bottom tab navigator |
| react-i18next | 15.6.0 | Multi-language support |
| i18next | 25.3.2 | i18n core |

### UI & Styling
| Library | Version | Purpose |
|---------|---------|---------|
| @expo/vector-icons | 14.1.0 | Icon library (Feather, Entypo, MaterialIcons) |
| react-native-maps | 1.20.1 | Interactive maps |
| react-native-reanimated | 3.17.4 | Animations |

### Location & Maps
| Library | Version | Purpose |
|---------|---------|---------|
| expo-location | 18.1.6 | GPS location services |
| Nominatim API | (external) | Geocoding service |

### Storage & Notifications
| Library | Version | Purpose |
|---------|---------|---------|
| @react-native-async-storage/async-storage | 2.2.0 | Local data persistence |
| expo-notifications | 0.31.4 | Push notifications |
| expo-device | 7.1.4 | Device information |
| expo-constants | 17.1.7 | App constants |

### Platform Integration
| Library | Version | Purpose |
|---------|---------|---------|
| react-native-gesture-handler | 2.24.0 | Touch gestures |
| react-native-screens | 4.11.1 | Performance optimization |
| react-native-safe-area-context | 5.4.0 | Safe area handling |
| react-native-phone-call | 1.2.0 | Phone calling |
| react-native-restart | 0.0.27 | App restart functionality |

### Date & Time
| Library | Version | Purpose |
|---------|---------|---------|
| @react-native-community/datetimepicker | 8.4.2 | Date picker component |

---

## PROJECT STRUCTURE

```
ouerkema-pharmacieconnect/
│
├── App.js                          # Root component with navigation setup
├── index.js                        # Application entry point
├── i18n.js                         # i18next configuration
├── app.json                        # Expo app configuration
├── package.json                    # Dependencies & scripts
│
├── components/                     # Reusable UI components
│   ├── PharmacyCard.js            # Pharmacy information card
│   ├── RTLAnimatedView.js         # RTL animation wrapper
│   ├── RTLProvider.js             # RTL layout provider
│   └── RTLTestComponent.js        # RTL testing/debug component
│
├── screens/                        # Application screens
│   ├── HomeScreen.js              # Main pharmacy search screen
│   ├── MapScreen.js               # Interactive map screen (OpenStreetMap)
│   ├── MapboxMapScreen.js         # Alternative map screen (Mapbox)
│   ├── CalendarScreen.js          # Date-based pharmacy search
│   ├── SettingsScreen.js          # App settings & preferences
│   ├── ThemeContext.js            # Dark mode context provider
│   ├── LanguageContext.js         # Multi-language context provider
│   └── NotificationContext.js     # Notification context provider
│
├── utils/                         # Utility functions
│   ├── RTLUtils.js               # RTL styling helpers
│   └── pharmacyDataLoader.js     # Pharmacy data loading/filtering
│
├── hooks/                         # Custom React hooks
│   └── useForceUpdate.js         # Force component re-render hook
│
├── locales/                       # Translation files
│   ├── fr.json                   # French translations
│   ├── en.json                   # English translations
│   └── ar.json                   # Arabic translations
│
├── data/                          # Static data
│   └── pharmacies.json           # Pharmacy database
│
├── assets/                        # Static assets
│   └── [images, icons, etc.]
│
├── TECHNICAL_DOCUMENTATION.md    # This file
└── README.md                      # Project README
```

---

## COMPONENTS DOCUMENTATION

### 1. PharmacyCard Component

**Location:** `/components/PharmacyCard.js`

**Purpose:** Display individual pharmacy information in a card format

**Props:**
```javascript
{
  pharmacie: {
    nom: string,           // Pharmacy name
    adresse: string,       // Full address
    telephone: string      // Phone number
  }
}
```

**Features:**
- Displays pharmacy name, address, and phone
- Call button opens phone dialer
- Emoji icons for quick recognition
- Responsive card layout

**Example Usage:**
```javascript
<PharmacyCard pharmacie={pharmacyData} />
```

---

### 2. RTLAnimatedView Component

**Location:** `/components/RTLAnimatedView.js`

**Purpose:** Animate layout transitions when switching between LTR/RTL modes

**Props:**
```javascript
{
  children: React.ReactNode,      // Content to animate
  style?: object,                 // Additional styles
  animationDuration?: number      // Animation duration in ms (default: 300)
}
```

**Features:**
- Smooth scale and translate animations
- Triggers on language/RTL changes
- Two-phase animation (out and back in)
- Improves UX during layout switches

**Example Usage:**
```javascript
<RTLAnimatedView animationDuration={400}>
  <YourContent />
</RTLAnimatedView>
```

---

### 3. RTLProvider Component

**Location:** `/components/RTLProvider.js`

**Purpose:** Apply RTL/LTR layout direction to wrapped content

**Props:**
```javascript
{
  children: React.ReactNode,      // Content to wrap
  style?: object                  // Additional styles
}
```

**Features:**
- Sets proper text direction
- Automatically applies based on language context
- Ensures child components respect RTL/LTR mode

**Example Usage:**
```javascript
<RTLProvider>
  <ScreenContent />
</RTLProvider>
```

---

### 4. RTLTestComponent

**Location:** `/components/RTLTestComponent.js`

**Purpose:** Debug/test RTL functionality

**Features:**
- Displays current language and RTL status
- Tests icon alignment
- Tests button and card layouts
- Supports Arabic text rendering

**Usage:** Temporarily add to screens for RTL testing:
```javascript
import RTLTestComponent from '../components/RTLTestComponent';

// In screen render:
<RTLTestComponent />
```

---

## SCREENS DOCUMENTATION

### 1. HomeScreen

**Location:** `/screens/HomeScreen.js`

**Purpose:** Main screen showing nearby pharmacies with search functionality

**Key Features:**
- Real-time search by pharmacy name/address
- "My Location" button to find nearby pharmacies
- Status badges (Open/Closed, Emergency)
- Direct call to pharmacy
- Pharmacy cards with detailed information

**State Management:**
```javascript
- searchTerm: User search input
- userLocation: Current GPS coordinates
- pharmacies: Array of pharmacy objects
```

**Dependencies:**
- expo-location (GPS)
- react-i18next (translations)
- pharmacyDataLoader (data loading)

**Map Navigation:**
- Returns list of pharmacies at current location
- Filters based on search term
- Shows distance/direction options

---

### 2. MapScreen

**Location:** `/screens/MapScreen.js`

**Purpose:** Interactive map showcasing pharmacy locations

**Features:**
- Multiple tile providers (OSM, CartoDB, Stamen, etc.)
- User location (blue marker)
- Pharmacy locations (custom markers)
- Place search via Nominatim geocoding
- Tile provider selector for coverage optimization

**Tile Providers:**
```javascript
- OpenStreetMap France (Default)
- CartoDB Positron
- CartoDB Dark Matter
- Stamen Terrain
- OpenCycleMap (requires API key)
```

**State Management:**
```javascript
- location: Current map center
- currentTileProvider: Active tile provider
- searchTerm: Place search input
- pharmacies: Pharmacy location data
```

**Map Functionality:**
- Zoom and pan controls
- Place search (draws map to location)
- Dynamic tile provider switching
- Marker clustering for many pharmacies

---

### 3. MapboxMapScreen

**Location:** `/screens/MapboxMapScreen.js`

**Purpose:** Alternative map implementation using Mapbox

**Features:**
- Professional Mapbox styles
- Multiple style options (Streets, Satellite, Light, Dark)
- High-quality cartography
- Better performance for large datasets

**Requirements:**
- Mapbox account: https://account.mapbox.com/
- Free API token (up to 50,000 requests/month)
- Token replacement in file: `YOUR_MAPBOX_API_TOKEN_HERE`

**Setup Steps:**
1. Create Mapbox account
2. Get free API token
3. Set your Mapbox token in an environment file:
  - Copy `.env.example` to `.env` and set `MAPBOX_API_TOKEN=your_actual_token_here`.
4. Rebuild app

---

### 4. CalendarScreen

**Location:** `/screens/CalendarScreen.js`

**Purpose:** Search for on-duty pharmacies on specific dates

**Key Features:**
- Date picker for selecting dates
- Maximum date set to end of current year
- Displays pharmacies available on selected date
- Shows pharmacy hours and status
- Call and directions functionality

**State Management:**
```javascript
- selectedDate: Currently selected date
- showPicker: Date picker visibility
- pharmacies: Pharmacies on duty for selected date
```

**Localization:**
- Dates formatted according to language locale
- Arabic-Indic digits converted to Western numerals
- Language-specific weekday/month names

**Functionality:**
- Date validation (past dates available)
- Pharmacy filtering by date
- RTL-aware layout
- Dark mode support

---

### 5. SettingsScreen

**Location:** `/screens/SettingsScreen.js`

**Purpose:** Application settings and user preferences

**Available Settings:**
1. **Language Selection**
   - French (Français)
   - English
   - Arabic (العربية)
   - Instant UI update on change

2. **Dark Mode Toggle**
   - Light mode (default)
   - Dark mode
   - Immediate theme switch

3. **Notifications**
   - Enable/disable notifications
   - Send test notification
   - Setup daily reminder
   - Clear all notifications

4. **Support Section**
   - Email support contact
   - Phone support contact

**Modals:**
- Language selection modal
- Notification settings modal
- Support contact modal

**Persistent Storage:**
- All preferences saved to AsyncStorage
- Automatic restoration on app launch

---

## CONTEXT PROVIDERS

### 1. ThemeContext

**Location:** `/screens/ThemeContext.js`

**Purpose:** Global dark mode management

**Context Value:**
```javascript
{
  isDarkMode: boolean,           // Current theme state
  setIsDarkMode: function,       // Set theme directly
  toggleDarkMode: function       // Toggle theme
}
```

**Usage:**
```javascript
import { useTheme } from './screens/ThemeContext';

function MyComponent() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  return (
    <View style={{ backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
    </View>
  );
}
```

**Storage:** In-memory (resets on app restart, can add AsyncStorage)

**Color Scheme:**
```javascript
Light Mode:
- Background: #f4f4f4
- Card: #fff
- Text: #000
- Accent: #2196f3

Dark Mode:
- Background: #121212
- Card: #1E1E1E
- Text: #fff
- Accent: #2196f3
```

---

### 2. LanguageContext

**Location:** `/screens/LanguageContext.js`

**Purpose:** Multi-language support and RTL layout management

**Context Value:**
```javascript
{
  language: string,              // Display name (Français, English, العربية)
  setLanguage: function,         // Change language
  isLoading: boolean,            // Loading saved language
  isChangingLanguage: boolean,   // Language change in progress
  getCurrentLanguageKey: function, // Get language code (fr, en, ar)
  availableLanguages: string[],  // List of available languages
  isRTL: boolean                 // Current RTL state
}
```

**Language Mapping:**
```javascript
Display Name    → Code
Français        → fr
English         → en
العربية        → ar
```

**Features:**
- Automatic RTL detection for Arabic
- Language preference persistence
- Instant language switching
- Layout mirroring for RTL

**Usage:**
```javascript
import { useLanguage } from './screens/LanguageContext';

function MyComponent() {
  const { language, setLanguage, isRTL } = useLanguage();
  
  return (
    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      {/* Content */}
    </View>
  );
}
```

---

### 3. NotificationContext

**Location:** `/screens/NotificationContext.js`

**Purpose:** Manage local push notifications

**Context Value:**
```javascript
{
  notificationsEnabled: boolean,
  isLoading: boolean,
  expoPushToken: string | null,
  permissionStatus: string,
  toggleNotifications: function,
  sendPharmacyReminder: function,
  sendDailyReminder: function,
  clearAllNotifications: function,
  useNotifications: hook
}
```

**Notification Functions:**

1. **sendPharmacyReminder(pharmacyName, address)**
   - Sends immediate pharmacy reminder
   
2. **sendDailyReminder()**
   - Schedules daily reminder notification

3. **clearAllNotifications()**
   - Clears all pending notifications

4. **toggleNotifications(enabled)**
   - Enable/disable notifications globally

**Important Notes:**
- Expo SDK 53+ does NOT support push notifications in Expo Go
- Local notifications work without push tokens
- Development build required for push notifications
- Android requires notification channel setup

**Permissions:**
- Requests notification permissions on Android/iOS
- Displays permission status in Settings

---

## UTILITIES & HOOKS

### 1. RTLUtils

**Location:** `/utils/RTLUtils.js`

**Purpose:** Helper functions for RTL-aware styling

**Available Functions:**

```javascript
RTLUtils.rtlTransform(isRTL)
// Returns: 'rtl' or 'ltr'

RTLUtils.textAlign(align, isRTL)
// Swaps left/right alignment for RTL

RTLUtils.paddingStart(value)
RTLUtils.paddingEnd(value)
RTLUtils.marginStart(value)
RTLUtils.marginEnd(value)
// Return start/end aware spacing objects

RTLUtils.flexDirection(direction, isRTL)
// Auto-reverses row direction for RTL

RTLUtils.left(value, isRTL)
RTLUtils.right(value, isRTL)
// Returns swapped left/right position objects

RTLUtils.transform(transforms, isRTL)
// Mirrors scaleX and translateX for RTL

RTLUtils.rtlStyle(style, isRTL)
// Complete style object transformer - swaps all L/R properties
```

**Example Usage:**
```javascript
import RTLUtils from '../utils/RTLUtils';

const styles = {
  container: {
    ...RTLUtils.rtlStyle({
      paddingLeft: 16,
      textAlign: 'left',
      flexDirection: 'row'
    }, isRTL)
  }
};
```

---

### 2. pharmacyDataLoader

**Location:** `/utils/pharmacyDataLoader.js`

**Purpose:** Load and filter pharmacy data with translations

**Functions:**

```javascript
loadPharmacies(t, date?)
// Load and translate all pharmacies
// Returns: Array of pharmacies with translated names

getPharmacyById(id, t)
// Get single pharmacy by ID
// Returns: Pharmacy object or null

filterPharmacies(pharmacies, searchTerm)
// Filter pharmacies by name/address
// Returns: Filtered pharmacy array

getOpenPharmacies(pharmacies)
// Get pharmacies that are currently open
// Returns: Array of open pharmacies

getEmergencyPharmacies(pharmacies)
// Get emergency-available pharmacies
// Returns: Array of emergency pharmacies
```

**Data Structure:**
```javascript
{
  id: number,
  nameKey: string,         // Translation key
  addressKey: string,      // Translation key
  telephone: string,
  coords: { latitude, longitude },
  isOpen: boolean,
  emergency: boolean,
  openHours: string,
  openHoursKey?: string   // Translation key
}
```

---

### 3. useForceUpdate Hook

**Location:** `/hooks/useForceUpdate.js`

**Purpose:** Force component re-render for instant updates

**Returns:** Function that triggers re-render when called

**Usage:**
```javascript
import { useForceUpdate } from '../hooks/useForceUpdate';

function MyComponent() {
  const forceUpdate = useForceUpdate();
  
  useEffect(() => {
    // Force re-render when language changes
    forceUpdate();
  }, [isRTL]);
  
  return <YourComponent />;
}
```

**Why It's Needed:**
- React Native doesn't always detect style changes from context
- Used specifically for RTL layout transitions
- Ensures instant UI updates when language changes

---

## CONFIGURATION GUIDE

### 1. Basic Configuration (app.json)

```json
{
  "expo": {
    "name": "Pharmacies de Garde",
    "slug": "pharmacies-de-garde",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "assetBundlePatterns": ["**/*"],
    "platforms": ["ios", "android", "web"]
  }
}
```

### 2. Map Provider Configuration

**For Mapbox (MapboxMapScreen):**
1. Sign up: https://account.mapbox.com/
2. Get free API token
3. Store the token securely by creating a `.env` file with:
```text
MAPBOX_API_TOKEN=pk.your_token_here
```

**For OpenStreetMap (MapScreen):**
- No configuration needed
- Uses public Nominatim service
- Rate-limited (commercial use requires setup)

### 3. Notification Configuration

**Android:**
```javascript
// Automatically created in NotificationContext
Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C',
});
```

**iOS:**
- Requests permission on demand
- User can enable/disable in Settings

---

## INSTALLATION & SETUP

### Prerequisites
- Node.js 14+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (for testing on device)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd ouerkema-pharmacieconnect
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Install Expo Tools (if needed)
```bash
npm install -g expo-cli
```

### Step 4: Configure Environment (Optional)
Create `.env` file (if using environment variables):
```
MAPBOX_TOKEN=your_token_here
```

### Step 5: Verify Installation
```bash
npm list
# Should show all dependencies installed correctly
```

---

## RUNNING THE APPLICATION

### Development Server
```bash
# Start Expo development server
npx expo start

# Options:
npx expo start --android    # Android emulator
npx expo start --ios        # iOS simulator  
npx expo start --web        # Web browser
```

### Testing on Physical Device
1. Install Expo Go app from App Store/Play Store
2. Scan QR code from Expo development server
3. App loads on device

### Building for Production

**For Testing:**
```bash
# Android APK (testing)
eas build --platform android --profile preview

# iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

**For Release:**
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Both platforms
eas build --platform all
```

### Web Build
```bash
npx expo build:web
# Output in web-build/ directory
```

---

## MULTI-LANGUAGE SUPPORT

### Supported Languages

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| French | fr | LTR | Default |
| English | en | LTR | Complete |
| Arabic | ar | RTL | Complete |

### Translation Files Structure

**Location:** `/locales/`

**File Format:** JSON with nested keys

```json
{
  "navigation": {
    "home": "Accueil",
    "map": "Carte",
    "calendar": "Calendrier",
    "settings": "Paramètres"
  },
  "home": {
    "open": "Ouvert",
    "closed": "Fermé",
    "emergency": "24/24",
    "call": "Appeler",
    "directions": "Direction"
  }
}
```

### Adding New Languages

**Step 1:** Create translation file `/locales/xx.json`
```json
{
  "navigation": { ... },
  "home": { ... },
  // ... all keys from other languages
}
```

**Step 2:** Update i18n.js
```javascript
import xx from './locales/xx.json';

// In init config:
resources: {
  fr: { translation: fr },
  en: { translation: en },
  ar: { translation: ar },
  xx: { translation: xx }  // Add new language
}
```

**Step 3:** Update LanguageContext.js
```javascript
const LANGUAGE_DISPLAY_NAMES = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  xx: 'New Language'  // Add display name
};

const LANGUAGE_KEYS = {
  'Français': 'fr',
  'English': 'en',
  'العربية': 'ar',
  'New Language': 'xx'  // Add mapping
};
```

### Dynamic Language Switching
```javascript
import { useLanguage } from './screens/LanguageContext';

function LanguageSwitcher() {
  const { setLanguage, availableLanguages } = useLanguage();
  
  return (
    <Picker
      onValueChange={setLanguage}
      items={availableLanguages}
    />
  );
}
```

### Accessing Translations
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <Text>{t('home.open')}</Text>;
}
```

---

## RTL IMPLEMENTATION

### How RTL Works

**Automatic Detection:**
- When language is set to Arabic (ar)
- LanguageContext automatically sets `isRTL = true`
- React Native I18nManager is updated

**Layout Mirroring:**
- All `flexDirection: 'row'` becomes `row-reverse`
- Text alignment switches left ↔ right
- Navigation flow reverses

### RTL-Aware Component Pattern

**Bad (Not RTL-safe):**
```javascript
<View style={{ paddingLeft: 16 }}>
  <Text style={{ textAlign: 'left' }}>Text</Text>
</View>
```

**Good (RTL-safe):**
```javascript
const { isRTL } = useLanguage();

<View style={{ 
  paddingLeft: isRTL ? 0 : 16,
  paddingRight: isRTL ? 16 : 0
}}>
  <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>Text</Text>
</View>
```

**Best (Using Utils):**
```javascript
<View style={RTLUtils.rtlStyle({ paddingLeft: 16 }, isRTL)}>
  <Text style={{ textAlign: RTLUtils.textAlign('left', isRTL) }}>
    Text
  </Text>
</View>
```

### RTL Helpers Available

```javascript
// Direction
<View direction={isRTL ? 'rtl' : 'ltr'} />

// Flex
<View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }} />

// Text
textAlign: isRTL ? 'right' : 'left'

// Positioning
paddingRight: isRTL ? 0 : 16
paddingLeft: isRTL ? 16 : 0

// Using RTLUtils
RTLUtils.rtlStyle(styleObj, isRTL)
RTLUtils.flexDirection('row', isRTL)
RTLUtils.textAlign('left', isRTL)
```

### Testing RTL
1. Go to Settings screen
2. Change language to "العربية" (Arabic)
3. Observe automatic RTL layout changes
4. Use RTLTestComponent for detailed testing:
   ```javascript
   import RTLTestComponent from '../components/RTLTestComponent';
   // Add to any screen temporarily
   <RTLTestComponent />
   ```

---

## DARK MODE IMPLEMENTATION

### Theme Context Setup
```javascript
import { useTheme } from './screens/ThemeContext';

function MyComponent() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  return (
    <View style={{
      backgroundColor: isDarkMode ? '#1E1E1E' : '#fff'
    }}>
      <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
    </View>
  );
}
```

### Color Schemes

**Light Mode Colors:**
```javascript
backgroundColor: '#f4f4f4'
cardBackground: '#fff'
textColor: '#000'
secondaryText: '#666'
borderColor: '#e0e0e0'
accentColor: '#2196f3'
successColor: '#4CAF50'
```

**Dark Mode Colors:**
```javascript
backgroundColor: '#121212'
cardBackground: '#1E1E1E'
textColor: '#fff'
secondaryText: '#ccc'
borderColor: '#333'
accentColor: '#2196f3'
successColor: '#4CAF50'
```

### Dynamic Styling Pattern
```javascript
const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    backgroundColor: isDarkMode ? '#121212' : '#f4f4f4',
    padding: 16
  },
  card: {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
    borderWidth: 1,
    borderColor: isDarkMode ? '#333' : '#e0e0e0'
  },
  text: {
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 16
  }
});

function MyComponent() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.text}>Content</Text>
      </View>
    </View>
  );
}
```

---

## MAP INTEGRATION

### OpenStreetMap (Default - MapScreen)

**Tile Providers Available:**
1. **OpenStreetMap France** (Default)
   - URL: https://tile.openstreetmap.fr/osmfr/
   - Good coverage for Tunisia

2. **CartoDB Positron**
   - URL: cartodb-basemaps-a.global.ssl.fastly.net/light_all/
   - Clean, minimalist style

3. **CartoDB Dark Matter**
   - URL: cartodb-basemaps-a.global.ssl.fastly.net/dark_all/
   - Dark themed variant

4. **Stamen Terrain**
   - URL: stamen-tiles.a.ssl.fastly.net/terrain/
   - Terrain/topographic focus

**Switching Providers:**
```javascript
// In MapScreen
const switchTileProvider = (providerKey) => {
  setCurrentTileProvider(providerKey);
  setShowProviderSelector(false);
};
```

### Place Search (Geocoding)
```javascript
// Uses Nominatim (OSM service)
const handlePlaceSearch = async () => {
  const query = searchTerm?.trim();
  if (!query) return;
  
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json`
  );
  const data = await resp.json();
  
  if (data.length > 0) {
    setLocation({
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      latitudeDelta: 0.05,
      longitudeDelta: 0.05
    });
  }
};
```

### Location Services
```javascript
import * as Location from 'expo-location';

// Request permission
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') return;

// Get current position
const { coords } = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Highest
});

setLocation(coords);
```

### Map Markers
```javascript
<MapView region={...}>
  {/* User location */}
  <Marker
    coordinate={location}
    title="Your Location"
    pinColor="blue"
  />
  
  {/* Pharmacy locations */}
  {pharmacies.map(pharmacy => (
    <Marker
      key={pharmacy.id}
      coordinate={pharmacy.coords}
      title={pharmacy.name}
      description={pharmacy.address}
    />
  ))}
</MapView>
```

### Mapbox Integration (Alternative)

**Setup:**
1. Create account: https://account.mapbox.com/
2. Get free API token
3. Update MapboxMapScreen.js:
```javascript
const MAPBOX_API_TOKEN = 'your_pk_token_here';
```

**Available Styles:**
- Streets (default)
- Satellite
- Light
- Dark

---

## NOTIFICATION SYSTEM

### Local Notifications Setup

```javascript
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});
```

### Sending Notifications

**Immediate Notification:**
```javascript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Pharmacy Reminder',
    body: `${pharmacyName} - ${address}`,
    data: { pharmacyId: id }
  },
  trigger: { seconds: 1 }
});
```

**Scheduled Daily Reminder:**
```javascript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Daily Pharmacy Check',
    body: 'Find available pharmacies today'
  },
  trigger: {
    hour: 9,
    minute: 0,
    repeats: true
  }
});
```

### Permissions

**Android:**
```javascript
// Automatic permission handling in NotificationContext
Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C'
});
```

**iOS:**
- Requests permission on first notification send
- User enables in Settings > Notifications

### Important Notes (Expo SDK 53+)
- ⚠️ Push notifications NOT available in Expo Go
- ✅ Local notifications work fine
- 📱 Use development build for push notifications
- 🔗 Setup guide: https://docs.expo.dev/develop/development-builds/

---

## API & DEPENDENCIES

### Core Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-native": "0.79.5",
    "expo": "^53.0.27",
    
    "navigation": {
      "@react-navigation/native": "^7.1.14",
      "@react-navigation/bottom-tabs": "^7.4.2",
      "@react-navigation/native-stack": "^7.3.21"
    },
    
    "i18n": {
      "i18next": "^25.3.2",
      "react-i18next": "^15.6.0"
    },
    
    "maps": {
      "react-native-maps": "^1.20.1",
      "expo-location": "~18.1.6"
    },
    
    "storage": {
      "@react-native-async-storage/async-storage": "^2.2.0"
    },
    
    "notifications": {
      "expo-notifications": "~0.31.4",
      "expo-device": "~7.1.4"
    },
    
    "ui": {
      "@expo/vector-icons": "^14.1.0",
      "react-native-reanimated": "~3.17.4"
    }
  }
}
```

### External APIs

| API | Purpose | URL | Cost |
|-----|---------|-----|------|
| Nominatim (OSM) | Place geocoding | https://nominatim.openstreetmap.org | Free (rate limited) |
| Mapbox | Maps (optional) | https://api.mapbox.com | Free tier available |
| OpenStreetMap | Map tiles | https://tile.openstreetmap.org | Free |
| CartoDB | Map tiles | cartodb.com | Free |

---

## TROUBLESHOOTING

### Common Issues & Solutions

#### 1. **App Won't Start**
```
Error: ENOENT: no such file or directory
```
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c  # Clear cache
```

#### 2. **Maps Not Loading**
**Causes:**
- No internet connection
- API rate limit exceeded
- Invalid tile provider URL

**Solution:**
```javascript
// Try different tile provider
setCurrentTileProvider('cartoDB');
// or
setCurrentTileProvider('stamen');
```

#### 3. **Location Permission Denied**
**Solution:**
- iOS: Settings > Privacy > Location > PharmaciesDeGarde > Allow
- Android: Settings > Apps > Permissions > Location > Allow

#### 4. **Language Not Switching**
**Solution:**
```javascript
// Force update
const forceUpdate = useForceUpdate();
useEffect(() => {
  forceUpdate();
}, [isRTL]);
```

#### 5. **RTL Layout Issues**
**Check:**
- Is `isRTL` value correct?
- Are all flexDir using ternary operators?
- Try RTLTestComponent for debugging

#### 6. **Dark Mode Not Applying**
**Solution:**
```javascript
// Use getStyles pattern with isDarkMode parameter
const styles = getStyles(isDarkMode);
// Make sure to call getStyles on every render
```

#### 7. **Notifications Not Working**
**Check:**
- Is permission granted?
- Running on physical device (not emulator)?
- Notification content not null?

**Solution:**
```bash
# For development build (supports push notifications)
eas build --platform android --profile preview
```

#### 8. **Mapbox Token Invalid**
**Solution:**
1. Verify token at https://account.mapbox.com/tokens/
2. Ensure token is public (not secret)
3. Replace in MapboxMapScreen.js
4. Rebuild app with `expo start -c`

#### 9. **Performance Issues - App Slow**
**Optimization:**
```bash
# Use development mode for debugging
npx expo start --dev-client

# Production build
npx expo build
```

#### 10. **AsyncStorage Data Lost**
**Note:** AsyncStorage is app-instance specific
```javascript
// Add backup/export functionality
const backup = await AsyncStorage.multiGet(['key1', 'key2']);
// Restore from backup
await AsyncStorage.multiSet(backup);
```

---

## PERFORMANCE OPTIMIZATION

### Best Practices

1. **Minimize Re-renders**
   - Use React.memo for components
   - Implement proper dependency arrays

2. **Optimize Animations**
   - Use `useNativeDriver: true`
   - Limit animation complexity

3. **Lazy Load Data**
   - Load pharmacies on demand
   - Pagination for large lists

4. **Optimize Maps**
   - Limit marker count
   - Use clustering for many points
   - Cache tile data

5. **Code Splitting**
   - Use React.lazy for screens
   - Dynamic imports for utilities

---

## DEPLOYMENT CHECKLIST

- [ ] Update app.json version
- [ ] Update package.json version
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test all languages (FR, EN, AR)
- [ ] Test dark mode
- [ ] Verify GPS functionality
- [ ] Test map providers
- [ ] Test notifications
- [ ] Check storage permissions
- [ ] Update CHANGELOG
- [ ] Create git tag for release
- [ ] Build production APK/IPA
- [ ] Submit to app stores

---

## SUPPORT & MAINTENANCE

### Getting Help
- GitHub Issues: [project-url]/issues
- Email: support@example.com
- Phone: +1-234-567-890

### Reporting Bugs
Please include:
- Device model and OS version
- Reproducible steps
- Expected vs actual behavior
- Screenshots/logs

### Contributing
1. Fork repository
2. Create feature branch
3. Make changes
4. Submit pull request

---

## CHANGELOG

### Version 1.0.0 (February 18, 2026)
- ✅ Initial release
- ✅ Multi-language support (FR, EN, AR)
- ✅ Dark mode implementation
- ✅ Interactive maps with multiple providers
- ✅ Date-based pharmacy search
- ✅ Local notifications
- ✅ RTL layout support

---

## LICENSE

This project is licensed under the BSD 0-Clause License (0BSD).

---

## CONCLUSION

This Pharmacies de Garde application provides a comprehensive solution for finding on-duty pharmacies in Tunisia. With support for multiple languages, RTL layouts, dark mode, and interactive maps, it offers an excellent user experience across multiple platforms.

For questions or issues, please refer to the troubleshooting section or contact support.

**Document Version:** 1.0  
**Last Updated:** February 18, 2026  
**Maintained By:** Development Team

---

*End of Technical Documentation*
