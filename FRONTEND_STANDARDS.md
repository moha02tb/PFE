# Frontend Code Standards (JavaScript/React)

This document covers both web admin (React + Vite) and mobile (React Native + Expo) applications.

---

## Code Organization

### Web Admin Structure
```
admin_pharmacie/
├── src/
│   ├── components/       # Reusable React components
│   │   ├── common/      # Shared UI components  
│   │   ├── dashboard/   # Dashboard-specific components
│   │   ├── dialogs/     # Modal dialogs
│   │   ├── forms/       # Form components
│   │   ├── layout/      # Layout components
│   │   └── tables/      # Table components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions (API, helpers)
│   ├── context/         # React Context providers
│   ├── locales/         # i18n translation files
│   ├── pages/           # Page components (routing)
│   ├── assets/          # Images, icons, static files
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── .eslintrc.js         # ESLint configuration
├── .prettierrc.json     # Prettier configuration
├── vite.config.js
├── tailwind.config.js
└── package.json
```

### Mobile Structure
```
ouerkema-pharmacieconnect-4c94773cce7d/
├── components/          # Reusable components
├── screens/             # Screen components (pages)
├── hooks/               # Custom hooks
├── utils/               # Utilities, helpers
├── locales/             # i18n translations
├── constants/           # App constants
├── data/                # Static data
├── assets/              # Images, fonts
├── .eslintrc.js
├── .prettierrc.json
├── jest.config.js
└── package.json
```

---

## Code Style

### 1. Formatting

All code must be formatted with **Prettier** (print width: 100):

```bash
# Web Admin
cd admin_pharmacie && prettier --write src/

# Mobile
cd ouerkema-pharmacieconnect-4c94773cce7d && prettier --write .
```

**Key rules**:
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas for multiline objects
- Line length max 100 characters

### 2. Linting

All code must pass **ESLint** with zero warnings:

```bash
eslint src/  --max-warnings 0
```

**Configuration**: `.eslintrc.js` in each project

**Common fixes**:
- Unused variables: Remove them
- Missing dependencies in hooks: Add to dependency array
- Unused imports: Remove them
- Console statements: Remove before production

### 3. Imports

**Order imports**:
1. React imports
2. Third-party library imports
3. Component/hook/util imports
4. Styles

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

import MyComponent from '../components/MyComponent';
import { useCustomHook } from '../hooks/useCustomHook';
import { formatDate } from '../utils/dateHelpers';
import styles from './MyComponent.module.css';
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `PharmacyCard.jsx`, `UserHeader.jsx` |
| Hooks | camelCase, start with "use" | `usePharmacies.js`, `useAuth.js` |
| Functions | camelCase | `formatDate()`, `fetchPharmacies()` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| Filenames | kebab-case or PascalCase | `pharmacy-card.jsx` or `PharmacyCard.jsx` |
| CSS Classes | kebab-case | `pharmacy-card`, `user-header` |
| Variables | camelCase | `pharmacyList`, `isLoading` |
| Booleans | is/has prefix | `isLoading`, `hasError` |

---

## React/JSX Standards

### 1. Component Documentation

All components must have JSDoc comments:

```jsx
/**
 * PharmacyCard - Display pharmacy information
 * @component
 * @param {Object} pharmacy - Pharmacy data object
 * @param {number} pharmacy.id - Pharmacy ID
 * @param {string} pharmacy.name - Pharmacy name
 * @param {string} pharmacy.address - Physical address
 * @param {Function} onSelect - Callback when pharmacy is selected
 * @returns {JSX.Element} Rendered pharmacy card
 */
function PharmacyCard({ pharmacy, onSelect }) {
  return (
    <div className="pharmacy-card" onClick={() => onSelect(pharmacy)}>
      <h3>{pharmacy.name}</h3>
      <p>{pharmacy.address}</p>
    </div>
  );
}

export default PharmacyCard;
```

### 2. Hooks Documentation

```jsx
/**
 * usePharmacies - Fetch and manage pharmacy data
 * @hook
 * @returns {Object} Pharmacy data and methods
 * @returns {Array<Object>} pharmacies - List of pharmacies
 * @returns {boolean} loading - Loading state
 * @returns {Error} error - Error object if fetch failed
 */
function usePharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Implementation
  }, []);

  return { pharmacies, loading, error };
}

export default usePharmacies;
```

### 3. Functional Components Only

Always use functional components with hooks, never class components:

```jsx
// ✅ Good
function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// ❌ Avoid
class MyComponent extends React.Component {
  state = { count: 0 };
  render() {
    return <div>{this.state.count}</div>;
  }
}
```

### 4. Hook Dependencies

Always include complete dependency arrays:

```jsx
// ✅ Good
useEffect(() => {
  fetchData(id);
}, [id]); // id is a dependency

// ❌ Avoid
useEffect(() => {
  fetchData(id); // id is used but not in dependencies
}, []);
```

### 5. Prop Validation (Optional but Recommended)

For TypeScript-free projects, use JSDoc types:

```jsx
/**
 * @param {string} name
 * @param {number} age
 * @param {Function} onUpdate
 */
function UserForm({ name, age, onUpdate }) {
  // Implementation
}
```

---

## Styling Standards

### TailwindCSS Best Practices

Use TailwindCSS utility classes instead of custom CSS:

```jsx
// ✅ Good - Using Tailwind utilities
<div className="flex items-center justify-between gap-4 rounded-lg bg-blue-50 p-4">
  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
  <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
    Action
  </button>
</div>

// ❌ Avoid - Custom CSS
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <h3>{title}</h3>
  <button>{label}</button>
</div>
```

### Extract Complex Styles

Use CSS modules or Tailwind's `@apply` for complex patterns:

```jsx
// styles.module.css
.pharmacyCard {
  @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md;
}

// Usage
import styles from './styles.module.css';
<div className={styles.pharmacyCard}></div>
```

---

## Performance Optimization

### 1. Memoization

Use `React.memo` for expensive components:

```jsx
const PharmacyCard = React.memo(({ pharmacy, onSelect }) => {
  // Component implementation
  return <div onClick={() => onSelect(pharmacy)}>{pharmacy.name}</div>;
});
```

### 2. useCallback

Use `useCallback` for event handlers:

```jsx
const handleClick = useCallback(
  (id) => {
    selectPharmacy(id);
  },
  [selectPharmacy] // Only recreate if selectPharmacy changes
);
```

### 3. useMemo

Use `useMemo` for expensive computations:

```jsx
const sortedList = useMemo(() => {
  return pharmacies.sort((a, b) => a.name.localeCompare(b.name));
}, [pharmacies]);
```

### 4. Image Optimization

Optimize images:
```jsx
<img
  src={pharmacy.image}
  alt={pharmacy.name}
  loading="lazy" // Lazy load images
  width={300}
  height={200}
/>
```

---

## State Management

### Props vs Context

- Use **props** for local, component-level state
- Use **Context** for global state (auth, theme, language)
- Consider **Redux** only for large, complex apps

Example context:

```jsx
// AuthContext.js
const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
```

---

## API Integration

### Consistent Axios Setup

Create a utility for API calls:

```jsx
// utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### Error Handling

```jsx
function usePharmacyData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await API.get('/pharmacies');
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, error, loading };
}
```

---

## Testing Standards

### Jest Configuration

Mobile app has Jest configured. Write tests:

```jsx
// __tests__/PharmacyCard.test.js
import { render, screen } from '@testing-library/react-native';
import PharmacyCard from '../PharmacyCard';

describe('PharmacyCard', () => {
  it('renders pharmacy name', () => {
    const pharmacy = { id: 1, name: 'Test Pharmacy' };
    render(<PharmacyCard pharmacy={pharmacy} onSelect={jest.fn()} />);
    expect(screen.getByText('Test Pharmacy')).toBeTruthy();
  });
});
```

---

## Accessibility (a11y)

- Use semantic HTML elements
- Add alt text to images
- Ensure proper heading hierarchy
- Use aria labels where needed
- Test with keyboard navigation

```jsx
<button type="button" aria-label="Close dialog" onClick={onClose}>
  ✕
</button>
```

---

## Internationalization (i18n)

Use react-i18next (already set up):

```jsx
import { useTranslation } from 'react-i18next';

function PharmacyCard({ pharmacy }) {
  const { t } = useTranslation();

  return (
    <div>
      <h3>{pharmacy.name}</h3>
      <p>{t('address')}: {pharmacy.address}</p>
    </div>
  );
}
```

---

## Code Review Checklist (Frontend)

- [ ] Code passes `prettier --check`
- [ ] Code passes `eslint . --max-warnings 0`
- [ ] All components have JSDoc comments
- [ ] No unused imports or variables
- [ ] Hooks have proper dependency arrays
- [ ] No console errors or warnings
- [ ] Components are memoized if expensive
- [ ] API calls handled with error states
- [ ] Tests added/updated (if applicable)
- [ ] Mobile app: RTL layout tested (if needed)
- [ ] Web admin: Responsive design verified

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "missing hook dependency" | Add missing variable to dependency array |
| "unused variable" | Remove or use it |
| "line too long" | Run `prettier` formatter |
| "component not memoized" | Wrap with `React.memo()` |
| "API call on every render" | Add useEffect with proper dependencies |
| "infinite loop" | Check hook dependencies |
| "memory leak warning" | Clean up subscriptions in cleanup function |

---

For questions, refer to [CODE_STANDARDS.md](./CODE_STANDARDS.md) or [CONTRIBUTING.md](./CONTRIBUTING.md).
