import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginNew from './pages/LoginNew';
import SidebarNew from './components/layout/SidebarNew';
import TopBarNew from './components/layout/TopBarNew';
import DashboardPage from './pages/DashboardPage';
import PharmaciesPage from './pages/PharmaciesPage';
import CalendarPage from './pages/CalendarPage';
import UploadPharmaciesPage from './pages/UploadPharmaciesPage';
import UploadGardePage from './pages/UploadGardePage';
import UploadMedicinesPage from './pages/UploadMedicinesPage';
import MapPage from './pages/MapPage';
import EmergencyPage from './pages/EmergencyPage';
import NotificationsPage from './pages/NotificationsPage';
import LanguagesPage from './pages/LanguagesPage';
import SettingsPage from './pages/SettingsPage';

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
    <div className="app-shell admin-shell flex h-screen w-full overflow-hidden">
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
    navigate('/dashboard');
  };
  
  return <LoginNew onLoginSuccess={handleLoginSuccess} />;
};

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
          {/* Login Route */}
          <Route path="/login" element={<LoginWrapper />} />
          
          {/* Protected Dashboard Routes with Layout */}
          <Route 
            element={
              <ProtectedRoute
                element={<DashboardLayout />}
                requiredRoles={['admin', 'ADMIN', 'user', 'USER']}
              />
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pharmacies" element={<PharmaciesPage />} />
            <Route path="/upload-pharmacies" element={<UploadPharmaciesPage />} />
            <Route path="/upload-garde" element={<UploadGardePage />} />
            <Route path="/upload-medicines" element={<UploadMedicinesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/languages" element={<LanguagesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
