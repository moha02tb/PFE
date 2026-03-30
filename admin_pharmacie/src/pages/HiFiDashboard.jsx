import React from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Gauge,
  Layers,
  Loader2,
  MapPin,
  Play,
  PlugZap,
  RefreshCw,
  Settings,
  UploadCloud,
  User,
  Users,
  Zap
} from 'lucide-react';

const SparkLine = ({ points, color }) => {
  const width = 160;
  const height = 56;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = points
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 8);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14">
      <path d={path} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
};

const HiFiDashboard = ({ onBack, onLogout }) => {
  const timeline = [
    { title: 'File Uploaded', desc: 'pharmacies_batch_12.csv', state: 'done' },
    { title: 'Validation Check', desc: 'Schema + dedoubling', state: 'active' },
    { title: 'Parsing (Dedoubling)', desc: '32% complete', state: 'pending' },
    { title: 'Ready to Process', desc: 'Awaiting manual trigger', state: 'pending' }
  ];

  const geocodingBars = [
    { label: 'Address Cleaning', value: 62, color: 'from-cyan-400 to-cyan-300' },
    { label: 'API Requests', value: 48, color: 'from-purple-400 to-purple-300' },
    { label: 'Successfully Saved', value: 36, color: 'from-emerald-400 to-emerald-300' }
  ];

  const tableRows = [
    { name: 'Pharmacie du Centre', status: 'Geocoded', sync: '12 Mar · 14:22' },
    { name: 'Pharmacie Belleville', status: 'Validated', sync: '12 Mar · 13:58' },
    { name: 'Pharmacie Riviera', status: 'PUBLISHED', sync: '12 Mar · 13:20' },
    { name: 'Pharmacie St-Michel', status: 'Raw', sync: '11 Mar · 19:04' },
  ];

  const navBadges = {
    import: 3,
    geo: 128,
    registry: 4,
    settings: 0,
  };

  const panelBase =
    'rounded-2xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_20px_55px_-24px_rgba(0,0,0,0.65),0_2px_0_rgba(255,255,255,0.06)] ring-1 ring-white/10';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#0f1c33] to-[#0c1228] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-10 -top-24 h-80 w-80 rounded-full bg-purple-500/12 blur-3xl" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[560px] w-[920px] rounded-full bg-blue-500/10 blur-[200px]" />
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:160px_160px]" />
      </div>

      <div className="relative flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="hidden xl:flex flex-col w-72 border-r border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_20px_55px_-24px_rgba(0,0,0,0.65),0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3 px-6 pt-7 pb-6 border-b border-white/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 text-slate-900 font-black">
              PC
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">Pharma</p>
              <p className="text-lg font-semibold text-white">Connect</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 text-sm">
            {[
              { id: 'import', label: 'Import Center', icon: UploadCloud, color: 'text-cyan-300' },
              { id: 'geo', label: 'Geocoding Sync', icon: MapPin, color: 'text-purple-300' },
              { id: 'registry', label: 'Data Registry', icon: Database, color: 'text-emerald-300' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-200' },
            ].map((item, idx) => {
              const Icon = item.icon;
              const active = idx === 0;
              return (
                <button
                  key={item.id}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400/60 to-purple-500/60 text-slate-900 font-semibold shadow-lg shadow-cyan-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-slate-900' : item.color} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {navBadges[item.id] !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        active ? 'bg-slate-900/70 text-white' : 'bg-white/10 text-white/70 border border-white/10'
                      }`}
                    >
                      {navBadges[item.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-white/10 px-5 py-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 border border-white/20">
              <div>
                <p className="text-xs text-white/70">Session</p>
                <p className="text-sm font-semibold">Admin control</p>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/30"
              >
                <RefreshCw size={14} />
                Logout
              </button>
            </div>
            <button
              onClick={onBack}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:border-cyan-300/50 hover:text-cyan-100"
            >
              <ArrowRight size={16} className="rotate-180" />
              Back to dashboard
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 relative overflow-y-auto">
          {/* Top bar */}
          <div className="sticky top-0 z-20 border-b border-white/10 bg-white/8 backdrop-blur-2xl shadow-[0_14px_36px_-20px_rgba(0,0,0,0.65),0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mx-auto flex max-w-[2100px] items-center justify-between px-6 xl:px-10 py-4">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <PlugZap className="text-cyan-300" size={18} />
                <span>High-performance data orchestration · 4K canvas</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white hover:border-cyan-300/60">
                  <Gauge size={16} />
                  System Health
                </button>
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 shadow-sm">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-slate-900 flex items-center justify-center font-semibold">
                    A
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-sm font-semibold text-white">Admin</p>
                    <p className="text-xs text-white/60">admin@pharma.io</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] px-6 xl:px-8 py-8 space-y-6">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 border border-white/15">
                <Zap size={14} className="text-cyan-300" /> Pharma Connect
              </span>
              <h1 className="text-4xl md:text-[40px] font-black tracking-tight text-white">Data Management Dashboard</h1>
            </div>

            {/* Main row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* Import panel */}
              <div className={`${panelBase} border-white/15 bg-white/8 p-5 space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Import Center</p>
                    <h3 className="text-xl font-semibold text-white leading-tight">Drag & Drop File Upload</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Accepts .csv and .excel, include HL7 and FHIR. Example: clinical_records.csv, clinical_records.xlsx, pharmacy_inventory.xlsx
                    </p>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-purple-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/40 transition">
                    <Play size={16} />
                    Manual Trigger
                  </button>
                </div>
                <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 p-5 text-center text-white/90 shadow-[0_14px_40px_-20px_rgba(0,0,0,0.55)]">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/15 text-cyan-200">
                    <UploadCloud size={28} />
                  </div>
                  <p className="text-lg font-semibold">Drop files here</p>
                  <p className="text-sm text-white/60">Secure Data Import Portal</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Activity size={16} className="text-cyan-300" />
                    Import Status
                  </div>
                  <div className="space-y-3">
                    {timeline.map((step, idx) => (
                      <div key={step.title} className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-3 w-3 rounded-full border ${
                            step.state === 'done'
                              ? 'bg-emerald-400 border-emerald-300'
                              : step.state === 'active'
                                ? 'bg-cyan-300 border-cyan-200 animate-pulse'
                                : 'bg-white/15 border-white/25'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{step.title}</p>
                          <p className="text-xs text-white/60">{step.desc}</p>
                          {step.title.includes('Parsing') && (
                            <div className="mt-2 h-2 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                              <div className="h-full w-[32%] rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Geocoding queue */}
              <div className={`${panelBase} border-white/15 bg-white/8 p-5 space-y-4`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Geocoding Queue</p>
                    <h3 className="text-base font-semibold text-white">Data Harmonization Queue</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-4xl font-black text-cyan-200">128</p>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-100 text-[11px] font-semibold px-2 py-0.5">LIVE</span>
                    </div>
                  </div>
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                    <div
                      className="absolute inset-1 rounded-full"
                      style={{
                        background:
                          'conic-gradient(from 90deg, #22d3ee 0deg, #a855f7 160deg, #22d3ee 360deg)',
                      }}
                    />
                    <div className="absolute inset-3 rounded-full bg-slate-900/80 border border-white/15 flex items-center justify-center text-[11px] font-semibold text-emerald-100">
                      LIVE
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {geocodingBars.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                        <span className="flex items-center gap-2">
                          {item.label === 'Address Cleaning' && <MapPin size={14} className="text-cyan-300" />}
                          {item.label === 'API Requests' && <PlugZap size={14} className="text-purple-300" />}
                          {item.label === 'Successfully Saved' && <Database size={14} className="text-emerald-300" />}
                          {item.label}
                        </span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden border border-white/10">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <MapPin size={14} className="text-cyan-300" />
                  Live clinical data cleansing, latency optimized to <span className="text-white font-semibold">420 ms</span>.
                </div>
                <button className="relative inline-flex items-center gap-2 rounded-xl border border-purple-200/30 bg-purple-500/25 px-4 py-2 text-sm font-semibold text-white shadow-lg w-full justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Trigger Sync
                  <span className="absolute inset-0 rounded-xl animate-ping bg-purple-400/10" />
                </button>
              </div>

              {/* Table */}
              <div className={`${panelBase} border-white/15 bg-white/8 p-5 space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Data Pipeline Overview</p>
                    <h3 className="text-base font-semibold text-white">Publication readiness</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.12em] text-white/70">Data Integrity</p>
                    <p className="text-2xl font-black text-emerald-200">94%</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/12">
                  <table className="w-full text-sm text-white/80">
                    <thead className="sticky top-0 backdrop-blur-xl bg-white/10 text-[11px] uppercase tracking-[0.12em] text-white/70 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-2 text-left">Pharmacy</th>
                        <th className="px-4 py-2 text-left">Patient Dataset</th>
                        <th className="px-4 py-2 text-left">Geolocation</th>
                        <th className="px-4 py-2 text-left">Regulatory Sync</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, idx) => (
                        <tr key={row.name} className={`border-t border-white/10 ${idx % 2 === 0 ? 'bg-white/5' : 'bg-white/8'}`}>
                          <td className="px-4 py-3 font-semibold text-white">{row.name}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-50 border border-emerald-300/30`}>
                              Clinically Validated
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-purple-500/15 text-purple-50 border border-purple-300/30">
                              {row.status === 'Geocoded' || row.status === 'PUBLISHED' ? 'Geocoded' : row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-cyan-500/15 text-cyan-50 border border-cyan-300/30">
                              Regulatory Ready
                            </span>
                          </td>
                          <td className="px-4 py-3 space-x-2 text-xs">
                            <button className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-white transition hover:border-cyan-300/50 hover:translate-y-[-1px]">View Details</button>
                            <button className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-white transition hover:border-purple-300/50 hover:translate-y-[-1px]">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className={`${panelBase} bg-white/8 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
              <div className="flex items-start gap-3">
                <BarChart3 size={18} className="text-cyan-300 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-white">Integrity and Compliance Summary</p>
                  <p className="text-xs text-white/70">
                    All data pipelines verified. 128 records pending geocoding sync. 94% data integrity score. GDPR/HIPAA pre-compliance enabled.
                    (Import, Validation, Standardization, Geocoding, Publication)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Layers size={14} className="text-cyan-300" />
                Data flow healthy
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HiFiDashboard;
