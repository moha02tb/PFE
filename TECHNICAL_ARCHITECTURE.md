# Technical Architecture - Component & Hook Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ App.jsx                                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ErrorBoundary (Catch all React errors)          │   │
│ │ ┌───────────────────────────────────────────┐   │   │
│ │ │ ThemeProvider (Dark/Light mode)           │   │   │
│ │ │ ┌────────────────────────────────────┐    │   │   │
│ │ │ │ LanguageProvider (i18n)            │    │   │   │
│ │ │ │ ┌─────────────────────────────┐    │    │   │   │
│ │ │ │ │ AuthProvider (Auth state)   │    │    │   │   │
│ │ │ │ │ ┌─────────────────────┐     │    │    │   │   │
│ │ │ │ │ │ ToastProvider       │     │    │    │   │   │
│ │ │ │ │ │ (Notifications)     │     │    │    │   │   │
│ │ │ │ │ │ ┌─────────────┐     │     │    │    │   │   │
│ │ │ │ │ │ │ Router      │     │     │    │    │   │   │
│ │ │ │ │ │ │ (Navigation)│     │     │    │    │   │   │
│ │ │ │ │ │ └─────────────┘     │     │    │    │   │   │
│ │ │ │ │ └─────────────────────┘     │    │    │   │   │
│ │ │ │ └─────────────────────────────┘    │    │   │   │
│ │ │ └────────────────────────────────────┘    │   │   │
│ │ └───────────────────────────────────────────┘   │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### PharmaciesPage Component Tree
```
PharmaciesPage
├── Header
│   ├── Title
│   └── Add Button
├── DataTable
│   ├── Search Bar
│   ├── Table
│   │   ├── Header
│   │   └── Rows (with Edit/Delete buttons)
│   └── Pagination
├── Stats Cards
│   ├── Total Count
│   ├── Active Count
│   └── Inactive Count
├── Modal (Conditional)
│   └── PharmacyForm
│       ├── Text Inputs
│       ├── Email Input
│       ├── Phone Input
│       ├── Dropdown
│       ├── Error Messages
│       └── Submit Button
└── ConfirmDialog (Conditional)
    ├── Title
    ├── Message
    ├── Cancel Button
    └── Confirm Button
```

---

## Data Flow Diagrams

### Adding a Pharmacy Flow
```
User clicks "Add Button"
  ↓
setIsFormOpen(true)
setSelectedPharmacy(null)
  ↓
Modal renders with PharmacyForm
  ↓
User fills form
  ↓
Form: handleChange → update formData state
Form: handleBlur → mark field as touched
Form: validateField → set field errors
  ↓
User clicks "Save"
  ↓
Form: handleSubmit → validate all fields
  ↓
  ├─ If errors: Show form errors, return
  └─ If valid: Call onSave(formData)
      ↓
      PharmaciesPage: handleSavePharmacy()
      ├─ setIsLoading(true)
      ├─ Simulate API call (1s)
      ├─ Add to pharmacies state
      ├─ addToast('success')
      ├─ setIsFormOpen(false)
      └─ setIsLoading(false)
```

### Editing a Pharmacy Flow
```
User clicks edit icon
  ↓
handleEditPharmacy(pharmacy)
  ↓
setSelectedPharmacy(pharmacy)
setIsFormOpen(true)
  ↓
Modal opens with PharmacyForm
  ↓
PharmacyForm: useEffect → setFormData(pharmacy)
  ↓
Form pre-fills with existing data
  ↓
User modifies fields
  ↓
User saves
  ↓
setPharmacies(prev =>
  prev.map(p =>
    p.id === selectedPharmacy.id
      ? { ...p, ...formData }
      : p
  )
)
  ↓
Toast confirmation
```

### Deleting a Pharmacy Flow
```
User clicks delete icon
  ↓
handleDeleteClick(pharmacy)
  ↓
setDeleteConfirm(pharmacy)
  ↓
ConfirmDialog renders
User reads confirmation message
  ↓
User clicks "Delete"
  ↓
handleConfirmDelete()
  ↓
setIsLoading(true)
Simulate API call (0.8s)
  ↓
setPharmacies(prev =>
  prev.filter(p => p.id !== deleteConfirm.id)
)
  ↓
addToast('Deleted successfully')
setDeleteConfirm(null)
setIsLoading(false)
```

### Search & Filter Flow
```
User types in search box
  ↓
DataTable: handleSearchChange(searchTerm)
  ↓
setSearchTerm(value)
setCurrentPage(1) // Reset to page 1
  ↓
useMemo computes filteredData:
  data.filter(row =>
    columns.some(col =>
      row[col.key]
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  )
  ↓
Re-render with filtered results
```

### Sorting Flow
```
User clicks column header
  ↓
DataTable: handleSort(columnKey)
  ↓
setSortConfig({
  key: columnKey,
  direction: (prev.key === columnKey &&
              prev.direction === 'asc')
             ? 'desc'
             : 'asc'
})
  ↓
useMemo computes sortedData:
  sorted.sort((a, b) => {
    const comparison = a[key] < b[key] ? -1 : 1
    return direction === 'asc' ? comparison : -comparison
  })
  ↓
Re-render with sorted results
```

---

## Hook Dependencies & State

### useToast Hook
```
toasts: Toast[]
addToast(message, type, duration)
  ↓
  Creates toast object with id
  ↓
  setToasts([...toasts, newToast])
  ↓
  setTimeout(removeToast, duration)

removeToast(id)
  ↓
  setToasts(prev => prev.filter(t => t.id !== id))
```

### useLanguage Hook
```
language: 'en' | 'fr' | 'ar'
isRTL: boolean (true if language === 'ar')
changeLanguage(lang)
  ↓
  localStorage.setItem('language', lang)
  ↓
  setLanguage(lang)
  
t(key): string
  ↓
  Get translation from locales/[language].json
  ↓
  Return translation or fallback key
```

### useTheme Hook
```
isDarkMode: boolean
toggleTheme()
  ↓
  const newMode = !isDarkMode
  ↓
  if (newMode):
    htmlElement.classList.add('dark')
  else:
    htmlElement.classList.remove('dark')
  ↓
  localStorage.setItem('theme', newMode)
  ↓
  setIsDarkMode(newMode)
```

### Custom Hooks (useCustom.js)

#### useAsync
```
execute asyncFunction in Promise
  ↓
  setStatus('pending')
  ↓
  try:
    response = await asyncFunction()
    setData(response)
    setStatus('success')
  catch:
    setError(error)
    setStatus('error')
```

#### useForm
```
Track form state: values, errors, touched
  ↓
  handleChange: update values
  handleBlur: mark field as touched
  handleSubmit: validate & submit
  ↓
  Validate function optional
  Applied on blur and submit
```

#### usePagination
```
currentPage: 1
pageSize: 10
totalPages: ceil(items.length / pageSize)
  ↓
  paginatedItems = slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  ↓
  goToPage(n), nextPage(), prevPage()
```

#### useSort
```
sortConfig: { key, direction }
  ↓
  sortedItems computed via useMemo:
    sorted by key
    direction: 'asc' | 'desc'
  ↓
  handleSort(key) toggles sort
```

#### useLocalStorage
```
[value, setValue] = useLocalStorage(key, initial)
  ↓
  getValue from localStorage
  setValue persists to localStorage
  ↓
  Handles JSON serialization
  Error handling with fallback
```

---

## Component Props & Interfaces

### PharmacyForm Props
```typescript
{
  pharmacy?: Pharmacy             // For edit mode (optional)
  onSave: (formData) => Promise   // Callback on save
  onCancel: () => void            // Callback on cancel
  isLoading?: boolean             // Disable form while saving
  error?: string                  // Display error message
}
```

### DataTable Props
```typescript
{
  columns: Array<{
    key: string
    label: string
    render?: (value, row) => ReactNode
  }>
  data: Array<any>
  isLoading?: boolean
  onEdit?: (row) => void
  onDelete?: (row) => void
  searchable?: boolean
  selectable?: boolean
  pageSize?: number
}
```

### Modal Props
```typescript
{
  title: string
  subtitle?: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

### ConfirmDialog Props
```typescript
{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}
```

---

## Context API Structure

### ThemeContext
```
{
  isDarkMode: boolean
  toggleTheme: () => void
}
```

### LanguageContext
```
{
  language: string ('en', 'fr', 'ar')
  isRTL: boolean
  changeLanguage: (lang) => void
  t: (key) => string (translation)
  availableLanguages: string[]
}
```

### ToastContext
```
{
  addToast: (message, type, duration) => toastId
  removeToast: (id) => void
}
```

### AuthContext (Existing)
```
{
  user: User | null
  isAuthenticated: boolean
  login: (credentials) => Promise
  logout: () => void
}
```

---

## Error Handling Strategy

### Try-Catch Blocks
```jsx
const handleSavePharmacy = async (formData) => {
  try {
    // Async operation
    await saveAPI(formData)
  } catch (error) {
    // Show user-friendly message
    addToast('Error saving pharmacy', 'error')
    // Log error for debugging
    console.error(error)
  }
}
```

### ErrorBoundary
```jsx
<ErrorBoundary>
  {/* If any component errors, catch it */}
</ErrorBoundary>
```

Catches:
- Render errors
- Lifecycle method errors
- Constructor errors
- useLayoutEffect errors

Does NOT catch:
- Event handlers (use try-catch)
- Async/await (use try-catch)
- Server-side rendering
- Boundary's own errors

---

## Performance Optimizations

### Memoization
```jsx
// DataTable filters data on change
const filteredData = useMemo(() => {
  return data.filter(...)
}, [data, searchTerm, columns])

// Only recomputes if dependencies change
// Prevents unnecessary filtering passes
```

### State Updates
```jsx
// Efficient state updates
setPharmacies(prev =>
  prev.map(p =>
    p.id === id
      ? { ...p, ...updates }
      : p
  )
)

// Only touches changed item
// Avoids full array reconstruction
```

### Lazy Loading
```jsx
// Components only load when needed
isFormOpen && <Modal />
deleteConfirm && <ConfirmDialog />

// Conditional rendering
// Reduces initial bundle size
```

---

## Testing Strategy

### Unit Tests (Component Level)
```
PharmacyForm:
- ✓ Renders correctly
- ✓ Validates fields
- ✓ Shows errors
- ✓ Submits data
- ✓ Handles loading

DataTable:
- ✓ Filters data
- ✓ Sorts data
- ✓ Paginates
- ✓ Shows empty state
- ✓ Responds to props
```

### Integration Tests (Page Level)
```
PharmaciesPage:
- ✓ Adds pharmacy
- ✓ Edits pharmacy
- ✓ Deletes pharmacy
- ✓ Searches pharmacies
- ✓ Sorts pharmacies
- ✓ Shows notifications
```

### E2E Tests (User Journeys)
```
1. User adds new pharmacy
   - Complete form
   - Submit
   - See in table
   
2. User edits pharmacy
   - Click edit
   - Modify data
   - Save
   - See updated
   
3. User deletes pharmacy
   - Click delete
   - Confirm
   - No longer in table
```

---

## Styling Architecture

### Tailwind CSS Approach
```jsx
// Utility-first CSS
<button className="
  bg-blue-600         // Background
  hover:bg-blue-700   // Hover state
  text-white          // Text color
  px-6 py-3           // Padding
  rounded-lg          // Border radius
  font-semibold       // Font weight
  transition-all      // Animation
  dark:bg-blue-900    // Dark mode
"/>
```

### Color Scheme
```
Primary:   Blue-600 (Actions)
Success:   Green-600 (Positive)
Warning:   Amber-600 (Alert)
Danger:    Red-600 (Delete)
Neutral:   Slate-600 (UI)

Background:
Light: White / Slate-50
Dark:  Slate-900 / Slate-950

Text:
Light mode: Slate-900
Dark mode:  White / Slate-100
```

### Responsive Breakpoints
```
Mobile:    0px (default)
SM:        640px
MD:        768px (most tablets)
LG:        1024px (desktop)
XL:        1280px (large desktop)

Example:
md:grid-cols-2  // 1 col mobile, 2 cols desktop
```

---

## Deployment Checklist

- [ ] Replace simulated APIs with real endpoints
- [ ] Add environment variables for API URL
- [ ] Test with real backend data
- [ ] Implement proper error messages
- [ ] Add loading skeletons
- [ ] Add infinite scroll option
- [ ] Implement search debounce (if large data)
- [ ] Add request caching (React Query)
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (WAVE)
- [ ] Security scan (OWASP)
- [ ] E2E tests (Cypress/Playwright)

---

**Architecture Version:** 1.0  
**Last Updated:** April 1, 2026
