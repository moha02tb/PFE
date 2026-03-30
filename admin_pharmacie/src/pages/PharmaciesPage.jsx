import React, { useState } from 'react';
import { Icon } from '../components/common/IconHelper';

const PharmaciesPage = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    city: 'all',
    language: 'all',
  });

  const pharmacies = [
    {
      id: 1,
      name: 'Grande Pharmacie de la Paix',
      licenseId: 'PH-99281',
      city: 'Paris, FR',
      address: '12 Rue de Rivoli',
      phone: '+33 1 42 77 00 00',
      languages: 'French, English',
      status: 'open',
      isVerified: true,
      icon: 'pharmacies',
    },
    {
      id: 2,
      name: 'Santé & Bien-être',
      licenseId: 'PH-44512',
      city: 'Lyon, FR',
      address: '45 Cours Lafayette',
      phone: 'Missing Phone',
      languages: 'French',
      status: 'closed',
      isVerified: false,
      isIncomplete: true,
      icon: 'building',
    },
    {
      id: 3,
      name: 'Emergency Care 24/7',
      licenseId: 'PH-11002',
      city: 'Marseille, FR',
      address: '22 Avenue du Prado',
      phone: '+33 4 91 00 22 11',
      languages: 'French, Arabic',
      status: 'emergency',
      isVerified: true,
      icon: 'emergency',
    },
    {
      id: 4,
      name: 'Pharma-Zone Express',
      licenseId: 'PH-PENDING',
      city: 'Lille, FR',
      address: 'Address Missing',
      phone: '+33 3 20 55 44 33',
      languages: 'French',
      status: 'inactive',
      isVerified: false,
      isExpired: true,
      icon: 'error',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-slate-50 dark:bg-slate-950">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Pharmacies</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">Oversee and manage regional pharmacy networks and compliance.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <Icon name="add" size={18} />
          Add Pharmacy
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Operational Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm py-2 px-3 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open Now</option>
            <option value="closed">Closed</option>
            <option value="emergency">Emergency Service</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">City / Region</label>
          <select
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm py-2 px-3 transition-all"
          >
            <option value="all">All Cities</option>
            <option value="paris">Paris</option>
            <option value="lyon">Lyon</option>
            <option value="marseille">Marseille</option>
            <option value="bordeaux">Bordeaux</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Primary Language</label>
          <select
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm py-2 px-3 transition-all"
          >
            <option value="all">All Languages</option>
            <option value="french">French</option>
            <option value="english">English</option>
            <option value="arabic">Arabic</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Icon name="filter" size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Pharmacy Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Pharmacy Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Location</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Contact</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Validation</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {pharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Icon name={pharmacy.icon} size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{pharmacy.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: {pharmacy.licenseId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{pharmacy.city}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pharmacy.address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900 dark:text-white">{pharmacy.phone}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pharmacy.languages}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {pharmacy.status === 'open' && (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                          </span>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-tight">Open Now</span>
                        </>
                      )}
                      {pharmacy.status === 'emergency' && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-red-600"></span>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">On-Duty</span>
                        </>
                      )}
                      {pharmacy.status === 'closed' && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Closed</span>
                        </>
                      )}
                      {pharmacy.status === 'inactive' && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {pharmacy.isVerified && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase tracking-tight gap-1">
                        <Icon name="verified" size={14} /> Verified
                      </span>
                    )}
                    {pharmacy.isIncomplete && (
                      <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 rounded-lg w-fit">
                        <Icon name="pending" size={14} />
                        <span className="text-xs font-bold uppercase tracking-tight">Incomplete</span>
                      </div>
                    )}
                    {pharmacy.isExpired && (
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-lg w-fit">
                        <Icon name="error" size={14} />
                        <span className="text-xs font-bold uppercase tracking-tight">Expired</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Showing 4 of 128 Pharmacies</p>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400" disabled>
              <Icon name="navigate_before" size={16} />
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-sm">1</button>
            <button className="px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg transition-colors text-sm">2</button>
            <button className="px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg transition-colors text-sm">3</button>
            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
              <Icon name="navigate_next" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Regional Coverage Map</h3>
            <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300">
              Expand <Icon name="expand" size={16} />
            </button>
          </div>
          <div className="h-64 rounded-lg overflow-hidden relative bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <Icon name="map" size={48} className="opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-8 rounded-lg relative overflow-hidden flex flex-col justify-between text-white shadow-lg">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-white font-bold text-xl leading-tight">Inventory Sync?</h3>
            <p className="text-blue-100 mt-2 text-sm">Connect your pharmacy POS for live stock tracking across the network.</p>
          </div>
          <div className="relative z-10 mt-6">
            <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg shadow-lg hover:bg-slate-50 transition-colors">
              Upgrade Pro
            </button>
            <p className="text-center text-blue-100 text-[10px] mt-2 uppercase tracking-widest font-bold">Includes compliance automation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmaciesPage;
