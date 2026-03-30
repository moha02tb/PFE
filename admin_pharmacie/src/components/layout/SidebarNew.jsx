import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../common/IconHelper';
import { useAuth } from '../../context/AuthContext';

const SidebarNew = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
    { icon: 'pharmacies', label: 'Pharmacies', path: '/pharmacies', id: 'pharmacies' },
    { icon: 'calendar', label: 'Calendar', path: '/calendar', id: 'calendar' },
    { icon: 'map', label: 'Map', path: '/map', id: 'map' },
    { icon: 'emergency', label: 'Emergency', path: '/emergency', id: 'emergency' },
  ];

  const systemItems = [
    { icon: 'notifications', label: 'Notifications', path: '/notifications', id: 'notifications' },
    { icon: 'languages', label: 'Languages', path: '/languages', id: 'languages' },
    { icon: 'settings', label: 'Settings', path: '/settings', id: 'settings' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col h-full sticky top-0 bg-slate-50 dark:bg-[#2c3134] h-screen w-64 border-r border-slate-200 dark:border-slate-700 font-['Manrope'] antialiased text-sm font-medium z-50 shrink-0">
      {/* Header */}
      <div className="px-6 py-8">
        <h1 className="text-xl font-bold text-[#171c1f] dark:text-white tracking-tight">PharmacieConnect</h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Clinical Admin v2.0</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 gap-3 ${
              isActive(item.path)
                ? 'text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Icon name={item.icon} size={20} />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}

        <div className="pt-6 pb-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">System</div>
        
        {systemItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 gap-3 ${
              isActive(item.path)
                ? 'text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Icon name={item.icon} size={20} />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Button */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700">
        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all group">
          <Icon name="add" size={18} className="group-hover:rotate-90 transition-transform" />
          New Prescription
        </button>
      </div>

      {/* Profile Section */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.nomUtilisateur?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{user?.nomUtilisateur || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'User'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
            title="Logout"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNew;
