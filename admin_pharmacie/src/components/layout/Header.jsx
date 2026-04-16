import React from 'react';
import { Bell, UserCircle, ChevronRight, Home } from 'lucide-react';

const Header = ({ activeNav }) => {
  const getBreadcrumb = (nav) => {
    const maps = {
      overview: "Vue d'ensemble",
      import: "Import de Fichiers",
      processing: "Traitement & Géocodage",
      validation: "Validation & Publication",
      directory: "Annuaire"
    };
    return maps[nav] || "Vue d'ensemble";
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between w-full px-6 py-4 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Home size={14} className="hover:text-white cursor-pointer transition-colors" />
        <ChevronRight size={14} />
        <span className="font-semibold text-white">{getBreadcrumb(activeNav)}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        <button className="relative p-2 transition-colors rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900"></span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 transition-transform hover:-translate-y-0.5">
          <UserCircle size={18} />
          <span className="hidden sm:inline">Profil</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
