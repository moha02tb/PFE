import React, { useState } from 'react';
import StatCard from '../common/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Building2, Clock, CheckCircle2, AlertCircle, UploadCloud, ShieldCheck, Activity, Plus, RefreshCw, Wifi, Sparkles, HeartPulse, Globe2 } from 'lucide-react';

const Overview = ({ recentActivities = [] }) => {
  const [range, setRange] = useState('7j');
  const ranges = ['24h', '7j', '30j'];

  const kpiData = [
    {
      icon: <Building2 size={18} className="text-purple-500" />,
      label: 'Pharmacies Actives',
      value: '1,247',
      change: '+12% ce mois',
      changeColor: '#10b981' // green
    },
    {
      icon: <Clock size={18} className="text-amber-500" />,
      label: 'Fichiers en Attente',
      value: '8',
      change: '3 en attente',
      changeColor: '#f59e0b' // amber
    },
    {
      icon: <CheckCircle2 size={18} className="text-green-500" />,
      label: 'Taux de Succès',
      value: '96.8%',
      change: '+2.1% vs mois dernier',
      changeColor: '#10b981' // green
    },
    {
      icon: <AlertCircle size={18} className="text-red-500" />,
      label: 'Erreurs Totales',
      value: '42',
      change: 'À résoudre',
      changeColor: '#ef4444' // red
    }
  ];

  const getStatusColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('upload') || actionLower.includes('import')) return 'bg-blue-500';
    if (actionLower.includes('complet') || actionLower.includes('succès')) return 'bg-green-500';
    if (actionLower.includes('start') || actionLower.includes('début')) return 'bg-purple-500';
    if (actionLower.includes('erreur') || actionLower.includes('fail')) return 'bg-red-500';
    return 'bg-slate-400 dark:bg-slate-600';
  };

  const healthMetrics = [
    { label: 'Disponibilité API', value: '99.98%', bar: 99.98, color: 'from-emerald-400 to-emerald-500' },
    { label: 'Temps moyen de traitement', value: '2.3 min', bar: 72, color: 'from-blue-400 to-indigo-500' },
    { label: 'Taux d\'erreur', value: '0.8%', bar: 18, color: 'from-amber-400 to-orange-500' },
  ];

  const quickLinks = [
    { title: 'Importer des fichiers', desc: 'Glissez vos CSV ou XLSX', icon: <UploadCloud size={16} />, accent: 'from-purple-500 to-indigo-500' },
    { title: 'Nouvelle publication', desc: 'Publier les gardes validées', icon: <ShieldCheck size={16} />, accent: 'from-emerald-500 to-green-500' },
    { title: 'Rafraîchir les données', desc: 'Synchroniser l\'annuaire', icon: <RefreshCw size={16} />, accent: 'from-blue-500 to-cyan-500' },
  ];

  const statusHighlights = [
    { label: 'Disponibilité', value: '99.98%', bar: 98, tone: 'text-emerald-200', gradient: 'from-emerald-400 to-emerald-200', icon: <Wifi size={16} className="text-emerald-300" /> },
    { label: 'Trafic', value: '1.2k req/min', bar: 76, tone: 'text-cyan-200', gradient: 'from-cyan-400 to-blue-400', icon: <Globe2 size={16} className="text-cyan-300" /> },
    { label: 'Incidents', value: '0 ouverts', bar: 8, tone: 'text-rose-200', gradient: 'from-rose-400 to-orange-300', icon: <AlertCircle size={16} className="text-rose-300" /> },
  ];

  return (
    <div className="relative min-h-screen w-full text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_38%),radial-gradient(circle_at_15%_30%,rgba(99,102,241,0.09),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.08),transparent_30%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-12 space-y-10">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
              <Sparkles size={14} className="text-cyan-300" />
              Tableau de bord
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Vue d'ensemble</h1>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-500/25">En ligne</span>
            </div>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl">
              Surveillez les pharmacies de garde, les imports et la santé du système en temps réel.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1">
                <Wifi size={14} className="text-emerald-300" /> Uptime 99,98%
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1">
                <HeartPulse size={14} className="text-rose-300" /> Charge stable
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1">
                <Globe2 size={14} className="text-cyan-300" /> Réseau sécurisé
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-[12px] font-semibold text-slate-200 shadow-lg shadow-black/10">
              {ranges.map((item) => (
                <button
                  key={item}
                  onClick={() => setRange(item)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    range === item ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30' : 'text-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-100 hover:border-slate-600 hover:-translate-y-0.5 transition-all shadow-lg shadow-black/20">
                <RefreshCw size={16} />
                Actualiser
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/45 transition-transform hover:-translate-y-0.5">
                <Plus size={16} />
                Nouvelle action
              </button>
            </div>
          </div>
        </div>

        {/* Signal strip */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {statusHighlights.map((item) => (
            <div key={item.label} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-white/4 to-transparent" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="inline-flex items-center justify-center rounded-lg bg-white/5 border border-white/10 p-2">
                    {item.icon}
                  </span>
                  <div className="leading-tight">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className={`text-lg font-semibold ${item.tone}`}>{item.value}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60 border border-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`}
                  style={{ width: `${item.bar}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, idx) => (
            <StatCard
              key={idx}
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
              change={kpi.change}
              changeColor={kpi.changeColor}
            />
          ))}
        </div>

        {/* Quick links + Health + Activities */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Raccourcis</CardTitle>
                <CardDescription className="text-sm text-slate-400">Gagnez du temps sur vos actions courantes</CardDescription>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-400 border border-white/10">Smart</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickLinks.map((link) => (
                <button
                  key={link.title}
                  className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/8 transition-all"
                >
                  <span className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${link.accent} text-white shadow-lg shadow-black/10`}>
                    {link.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{link.title}</span>
                    <span className="text-xs text-slate-400">{link.desc}</span>
                  </div>
                  <span className="ml-auto text-[11px] text-cyan-200">→</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Santé du système</CardTitle>
                <CardDescription className="text-sm text-slate-400">Disponibilité et performance en temps réel</CardDescription>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200 border border-emerald-500/25">
                <ShieldCheck size={14} /> Monitoring actif
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthMetrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{metric.label}</span>
                    <span className="text-white">{metric.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                      style={{ width: `${metric.bar}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                <Activity size={16} className="text-cyan-300" />
                <span>Latence, disponibilité et erreurs surveillées en continu.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-white">Dernières Activités</CardTitle>
                <CardDescription className="text-sm text-slate-400">Historique récent des traitements de données</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Activity size={16} className="text-cyan-300" />
                Temps réel
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={activity.id} className="relative rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                  {index < recentActivities.length - 1 && (
                    <span className="absolute left-4 top-6 bottom-0 w-px bg-white/10" />
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(activity.action)} ring-4 ring-slate-950/70 shadow-sm`} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-none text-white">{activity.action}</p>
                        <p className="text-xs text-slate-400">
                          {activity.file || `${activity.records} enregistrements`}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {activity.time}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center text-sm text-slate-400">
                  Aucune activité récente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
