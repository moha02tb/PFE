import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginNew from './pages/LoginNew';
import SidebarNew from './components/layout/SidebarNew';
import TopBarNew from './components/layout/TopBarNew';
import DashboardPage from './pages/DashboardPage';
import PharmaciesPage from './pages/PharmaciesPage';
import ManagementPage from './pages/ManagementPage';
import CalendarPage from './pages/CalendarPage';
import UploadPharmaciesPage from './pages/UploadPharmaciesPage';
import UploadGardePage from './pages/UploadGardePage';
import UploadMedicinesPage from './pages/UploadMedicinesPage';
import MapPage from './pages/MapPage';
import EmergencyPage from './pages/EmergencyPage';
import NotificationsPage from './pages/NotificationsPage';
import LanguagesPage from './pages/LanguagesPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';
import AuditLogViewer from './pages/AuditLogViewer';
import { ADMIN_ROLES, STAFF_ROLES, getDefaultRouteForUser } from './lib/permissions';

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

// Main layout component with sidebar and header
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('admin-theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell admin-shell flex min-h-[100dvh] w-full overflow-hidden">
      <div className="admin-shell__backdrop" aria-hidden="true" />
      <SidebarNew open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBarNew
          onMenuClick={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        />
        <div className="admin-main min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

// Login wrapper to handle navigation
const LoginWrapper = () => {
  const navigate = useNavigate();
  
  const handleLoginSuccess = () => {
    navigate(getDefaultRouteForUser(getStoredUser()), { replace: true });
  };
  
  return <LoginNew onLoginSuccess={handleLoginSuccess} />;
};

const RoleAwareHome = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteForUser(user)} replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
          {/* Login Route */}
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/forbidden" element={<ProtectedRoute element={<ForbiddenPage />} />} />
          
          {/* Protected Dashboard Routes with Layout */}
          <Route 
            element={
              <ProtectedRoute
                element={<DashboardLayout />}
                requiredRoles={STAFF_ROLES}
              />
            }
          >
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  element={<DashboardPage />}
                  requiredRoles={ADMIN_ROLES}
                  fallbackPath="/management"
                />
              }
            />
            <Route path="/pharmacies" element={<PharmaciesPage />} />
            <Route path="/management" element={<ManagementPage />} />
            <Route path="/upload-pharmacies" element={<UploadPharmaciesPage />} />
            <Route path="/upload-garde" element={<UploadGardePage />} />
            <Route
              path="/upload-medicines"
              element={
                <ProtectedRoute
                  element={<UploadMedicinesPage />}
                  requiredRoles={ADMIN_ROLES}
                  fallbackPath="/management"
                />
              }
            />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/languages" element={<LanguagesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route 
              path="/audit-logs" 
              element={<ProtectedRoute requiredRoles={ADMIN_ROLES} element={<AuditLogViewer />} />}
            />
          </Route>
          
          {/* Redirect root based on role */}
          <Route path="/" element={<RoleAwareHome />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
