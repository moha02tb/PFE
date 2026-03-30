import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  CheckCircle, 
  BookOpen, 
  Pill, 
  LogOut,
  User,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ activeNav, setActiveNav, onLogout }) => {
  const navItems = [
    { id: 'hifi', label: 'Healthcare Futuriste', icon: Sparkles },
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'import', label: 'Import de Fichiers', icon: Upload },
    { id: 'processing', label: 'Traitement & Géocodage', icon: Settings },
    { id: 'validation', label: 'Validation & Publication', icon: CheckCircle },
    { id: 'directory', label: 'Annuaire', icon: BookOpen }
  ];

  return (
    <aside className="flex flex-col w-64 h-screen border-r border-slate-800/60 bg-slate-950/70 text-slate-100 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/60">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
          <Pill size={20} />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">Pharmacie Connect</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? 'bg-gradient-to-r from-purple-600/70 to-indigo-600/70 text-white shadow-md shadow-purple-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer - Profile & Logout */}
      <div className="p-4 border-t border-slate-800/60 mt-auto">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <User size={16} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-semibold truncate text-white">Admin</p>
            <p className="text-xs text-slate-400 truncate">admin@pharmacies.fr</p>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-semibold text-red-300 transition-colors rounded-md bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
