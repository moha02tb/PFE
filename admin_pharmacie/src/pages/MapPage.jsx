import React, { useState } from 'react';

const MapPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const pharmacies = [
    {
      id: 1,
      name: 'Central Hub Pharmacy',
      address: '742 Evergreen Terrace, Downtown',
      status: 'active',
      lat: '34.0522',
      lng: '-118.2437',
      inventory: 'High',
    },
    {
      id: 2,
      name: 'Northside Wellness',
      address: '210 Baker St, North District',
      status: 'active',
      lat: '34.1204',
      lng: '-118.3001',
      inventory: 'Medium',
    },
    {
      id: 3,
      name: 'Harbor Clinic Rx',
      address: '55 Dockside Blvd, Marina',
      status: 'offline',
      lat: '33.7542',
      lng: '-118.2120',
      inventory: 'Low',
    },
    {
      id: 4,
      name: 'Sunset Medical',
      address: '8900 Sunset Blvd',
      status: 'active',
      lat: '34.0901',
      lng: '-118.3842',
      inventory: 'High',
    },
  ];

  const handlePlaceSearch = () => {
    console.log('Searching for:', searchTerm);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar: Pharmacy List & Coordinator Entry */}
      <section className="w-96 bg-surface-container-low flex flex-col z-10 shadow-xl overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-extrabold text-on-surface tracking-tight mb-2">Network Topology</h2>
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">
            Active Pharmacie Nodes ({pharmacies.length})
          </p>
        </div>

        {/* Coordinate Quick Entry Bento Card */}
        <div className="mx-6 mb-6 p-5 bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <span>📍</span>
            <span className="text-sm font-bold">New Node Coordinate</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Latitude</label>
              <input
                type="text"
                defaultValue="34.0522"
                className="w-full bg-surface-container-highest border-none rounded-lg text-sm font-mono focus:ring-1 focus:ring-primary/40 py-2 px-3"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Longitude</label>
              <input
                type="text"
                defaultValue="-118.2437"
                className="w-full bg-surface-container-highest border-none rounded-lg text-sm font-mono focus:ring-1 focus:ring-primary/40 py-2 px-3"
              />
            </div>
          </div>
          <button className="w-full bg-primary text-white py-2.5 rounded-full text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2">
            <span>🎯</span>
            Register Location
          </button>
        </div>

        {/* Scrollable Pharmacy List */}
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8">
          {pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              onClick={() => setSelectedPharmacy(pharmacy)}
              className={`group bg-surface-container-lowest p-4 rounded-3xl border-l-4 transition-all hover:translate-x-1 cursor-pointer shadow-sm ${
                pharmacy.status === 'active'
                  ? 'border-primary'
                  : 'border-transparent hover:border-primary-fixed'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-sm">{pharmacy.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    pharmacy.status === 'active'
                      ? 'bg-secondary-container/30 text-on-secondary-container'
                      : 'text-error'
                  }`}
                >
                  {pharmacy.status === 'active' ? 'ACTIVE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">{pharmacy.address}</p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-surface-container-low px-2 py-1.5 rounded-lg group-hover:bg-primary/5 transition-colors">
                <span>LAT: {pharmacy.lat}</span>
                <span>LNG: {pharmacy.lng}</span>
                <button className="text-primary font-bold hover:underline flex items-center gap-1">
                  <span>✏️</span>
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Map View Area */}
      <div className="flex-1 relative bg-slate-200 overflow-hidden">
        {/* Background Map Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 opacity-50"></div>

        {/* Map UI Overlays */}
        <div className="absolute inset-0 pointer-events-none map-gradient-overlay"></div>

        {/* Floating Map Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <div className="bg-white rounded-3xl shadow-lg p-1.5 flex flex-col pointer-events-auto">
            <button className="p-2.5 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
              ➕
            </button>
            <div className="h-px bg-slate-100 mx-2"></div>
            <button className="p-2.5 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
              ➖
            </button>
          </div>
          <button className="bg-white p-2.5 rounded-3xl shadow-lg text-slate-600 hover:text-primary pointer-events-auto transition-colors">
            📚
          </button>
          <button className="bg-white p-2.5 rounded-3xl shadow-lg text-slate-600 hover:text-primary pointer-events-auto transition-colors">
            📍
          </button>
        </div>

        {/* Custom Map Markers (Pins) */}
        <div className="absolute top-1/3 left-1/4 pointer-events-auto group">
          <div className="relative flex flex-col items-center">
            {/* Tooltip Popup */}
            <div className="absolute bottom-full mb-3 hidden group-hover:block w-48 bg-white p-3 rounded-3xl shadow-2xl ring-1 ring-slate-100 z-50">
              <p className="text-[10px] font-bold text-primary uppercase mb-1">Central Hub</p>
              <p className="text-xs font-medium text-slate-700 leading-tight">742 Evergreen Terrace</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Inventory: High</span>
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
              </div>
            </div>
            {/* Custom Pin Marker */}
            <div className="w-10 h-10 bg-primary rounded-full rounded-bl-none rotate-45 flex items-center justify-center border-2 border-white shadow-lg transition-transform hover:scale-110 cursor-pointer text-white text-sm">
              💊
            </div>
            <div className="w-2 h-2 bg-primary/30 rounded-full blur-[2px] mt-1"></div>
          </div>
        </div>

        <div className="absolute top-1/2 left-2/3 pointer-events-auto group">
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 bg-tertiary rounded-full rounded-bl-none rotate-45 flex items-center justify-center border-2 border-white shadow-lg transition-transform hover:scale-110 cursor-pointer text-white text-xs">
              🏥
            </div>
          </div>
        </div>

        <div className="absolute top-2/3 left-1/2 pointer-events-auto group">
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 bg-secondary rounded-full rounded-bl-none rotate-45 flex items-center justify-center border-2 border-white shadow-lg transition-transform hover:scale-110 cursor-pointer text-white text-xs">
              💊
            </div>
          </div>
        </div>

        {/* Map Stats Footer (Glassmorphism) */}
        <div className="absolute bottom-8 left-8 right-8 bg-white/70 backdrop-blur-md p-4 rounded-3xl shadow-xl flex items-center justify-between border border-white/40">
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                📍
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Response Distance</p>
                <p className="text-lg font-bold">4.2 km</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                🔗
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Network Density</p>
                <p className="text-lg font-bold">Optimal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/5 px-4 py-2 rounded-3xl">
            <span className="text-xs font-mono text-slate-600">CURSOR: 34.05° N, 118.24° W</span>
            <div className="h-4 w-px bg-slate-300"></div>
            <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              <span>📤</span>
              Export GIS Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
