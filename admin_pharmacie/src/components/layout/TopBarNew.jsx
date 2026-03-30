import React, { useState } from 'react';
import { Icon } from '../common/IconHelper';

const TopBar = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="flex justify-between items-center w-full h-full px-6 lg:px-8">
        {/* Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative w-full group">
            <Icon 
              name="search" 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500"
              placeholder="Search operations, pharmacies or logs..."
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Emergency Alert Button */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all active:scale-95">
            <Icon name="emergency" size={18} />
            <span className="hidden sm:inline text-sm">Alert</span>
          </button>

          {/* Icons */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-4">
            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              <Icon name="notifications" size={20} />
            </button>
            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              <Icon name="languages" size={20} />
            </button>
            <div className="w-9 h-9 ml-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
