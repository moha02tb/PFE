import React from 'react';
import { Icon } from '../components/common/IconHelper';

const DashboardPage = () => {
  const stats = [
    { label: 'Total Pharmacies', value: '254', trend: '+12% MoM', icon: 'pharmacies', color: 'primary', highlight: true },
    { label: 'Open Now', value: '142', subtitle: '56% of active network', icon: 'open', color: 'secondary' },
    { label: 'Emergency Duty', value: '14', subtitle: 'Critical service active', icon: 'emergency', color: 'error' },
    { label: 'Closed', value: '98', subtitle: 'Scheduled down-time', icon: 'closed', color: 'slate' },
    { label: 'Incomplete Data', value: '12', subtitle: 'Pending verification', icon: 'incomplete', color: 'slate' },
  ];

  const recentUpdates = [
    {
      id: 1,
      name: 'Pharma-Core Central',
      action: 'Updated operational hours for Eid holiday',
      time: '14:20 PM',
      tag: 'Inventory',
      icon: 'building',
    },
    {
      id: 2,
      name: 'HealthWay Boutique',
      action: 'Verified as Emergency-ready (24/7)',
      time: '12:05 PM',
      tag: 'Status',
      icon: 'verified',
    },
    {
      id: 3,
      name: 'Medi-Life Square',
      action: 'New license document uploaded',
      time: 'Yesterday',
      tag: 'Admin',
      icon: 'stethoscope',
    },
    {
      id: 4,
      name: 'Downtown Wellness',
      action: 'Pharmacist credentials renewed',
      time: 'Yesterday',
      tag: 'Staff',
      icon: 'health',
    },
    {
      id: 5,
      name: 'CureAll Dispensary',
      action: 'Stock update for essential vaccines',
      time: '2 days ago',
      tag: 'Inventory',
      icon: 'health',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-slate-50 dark:bg-slate-950">
      {/* Dashboard Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Operations Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">Real-time pharmacy network status and health monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></span>
            Live Network
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-sm">Last Sync: 2m ago</span>
        </div>
      </section>

      {/* Bento Grid Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Card - Total Pharmacies */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <span className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Total Pharmacies</span>
            <div className="mt-4 flex items-baseline gap-4">
              <span className="text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400">254</span>
              <span className="font-bold flex items-center text-sm text-green-600 dark:text-green-400 gap-1">
                <Icon name="trending_up" size={16} /> +12% MoM
              </span>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-[75%] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Open Now Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-green-600">
          <div className="flex justify-between items-start">
            <span className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Open Now</span>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <Icon name="open" size={20} />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">142</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">56% of active network</p>
          </div>
        </div>

        {/* Emergency Duty Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-600">
          <div className="flex justify-between items-start">
            <span className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Emergency Duty</span>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              <Icon name="emergency" size={20} />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">14</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Critical service active</p>
          </div>
        </div>

        {/* Closed Card */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <span className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Closed</span>
            <Icon name="closed" size={20} />
          </div>
          <div className="mt-6">
            <span className="text-3xl font-bold text-slate-700 dark:text-slate-300">98</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Scheduled down-time</p>
          </div>
        </div>

        {/* Incomplete Data Card */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <span className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Incomplete Data</span>
            <Icon name="incomplete" size={20} />
          </div>
          <div className="mt-6">
            <span className="text-3xl font-bold text-slate-700 dark:text-slate-300">12</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Pending verification</p>
          </div>
        </div>

        {/* Notification Bento */}
        <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-500 p-6 lg:p-8 rounded-lg text-white shadow-lg flex items-center gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Notification Center</h3>
            <p className="text-blue-100 mt-1">Weekly broadcast summary.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg">
                <div className="text-2xl font-bold">1,204</div>
                <div className="text-xs uppercase tracking-wide opacity-80 mt-1">Sent Today</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg">
                <div className="text-2xl font-bold">45</div>
                <div className="text-xs uppercase tracking-wide opacity-80 mt-1">Scheduled</div>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex text-5xl opacity-20">
            <Icon name="notifications" size={48} />
          </div>
        </div>
      </section>

      {/* Detailed Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Updates */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Recent Updates</h3>
            <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">View All Registry</button>
          </div>
          <div className="space-y-4">
            {recentUpdates.map((update) => (
              <div key={update.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Icon name={update.icon} size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">{update.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{update.action}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{update.time}</div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-1 rounded text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold uppercase">
                      {update.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Distribution & Broadcast */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Network Distribution</h3>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Icon name="filter" size={20} />
            </button>
          </div>

          {/* Map Section */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden relative min-h-[300px] mb-6 border border-slate-200 dark:border-slate-700">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
              <div className="absolute w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full opacity-30"></div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Icon name="location" size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">Active Region</p>
                  <h5 className="font-bold text-slate-900 dark:text-white">Metropolitan Zone 4</h5>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-bold uppercase tracking-tight">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  <span className="text-slate-700 dark:text-slate-300">42 Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  <span className="text-slate-700 dark:text-slate-300">2 Alerts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Broadcast */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white">Quick Broadcast</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Notify all open pharmacies immediately.</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-slate-300 dark:bg-slate-600"></div>
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">+142</div>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Open recipients</span>
            </div>
            <button className="w-full mt-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2">
              <Icon name="mail" size={16} />
              Draft System Message
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
