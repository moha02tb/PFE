import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginNew from './pages/LoginNew';
import SidebarNew from './components/layout/SidebarNew';
import TopBarNew from './components/layout/TopBarNew';
import DashboardPage from './pages/DashboardPage';
import PharmaciesPage from './pages/PharmaciesPage';
import CalendarPage from './pages/CalendarPage';
import UploadPharmaciesPage from './pages/UploadPharmaciesPage';
import UploadGardePage from './pages/UploadGardePage';
import MapPage from './pages/MapPage';
import EmergencyPage from './pages/EmergencyPage';
import NotificationsPage from './pages/NotificationsPage';
import LanguagesPage from './pages/LanguagesPage';
import SettingsPage from './pages/SettingsPage';

// Main layout component with sidebar and header
const DashboardLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface text-on-surface">
      {/* Sidebar */}
      <SidebarNew />

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden relative">
        {/* Header */}
        <TopBarNew />

        {/* Page Content - render the current route's component */}
        <div className="flex-1 overflow-auto">
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
    </AuthProvider>
  );
};

export default App;
