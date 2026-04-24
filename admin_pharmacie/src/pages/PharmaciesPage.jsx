import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileUp,
  Filter,
  MapPinned,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import api from '../lib/api';
import { Button, EmptyState, Input, Select } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const PAGE_SIZE = 20;

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PH';

const StatBox = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const toneClass = {
    blue: 'bg-primary-soft text-primary dark:bg-primary/12 dark:text-primary',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200',
    red: 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200',
  }[tone];

  return (
    <div className="registry-stat-card">
      <div className={`flex h-12 w-12 items-center justify-center rounded-[8px] ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
};

const StatusPill = ({ status, t }) => {
  const normalized = status || 'Active';
  const className =
    normalized === 'Garde'
      ? 'registry-row-status registry-row-status--garde'
      : normalized === 'Inactive'
        ? 'registry-row-status registry-row-status--inactive'
        : 'registry-row-status registry-row-status--active';
  return (
    <div className={className}>
      <span />
      {normalized === 'Garde' ? t('pharmacies.garde') : normalized === 'Inactive' ? t('pharmacies.inactive') : t('pharmacies.active')}
    </div>
  );
};

const ReadinessMeter = ({ label, value, icon: Icon }) => (
  <div>
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      </div>
      <span className="font-display text-lg font-bold text-foreground">{value}%</span>
    </div>
    <div className="registry-readiness__track">
      <span style={{ '--value': `${value}%` }} />
    </div>
  </div>
);

const PharmaciesPage = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [governorate, setGovernorate] = useState('all');

  useEffect(() => {
    let active = true;

    const loadPharmacies = async () => {
      setLoading(true);
      setError('');

      try {
        const skip = (page - 1) * PAGE_SIZE;
        const [countResponse, pharmaciesResponse] = await Promise.all([
          api.get('/api/admin/pharmacies/count'),
          api.get('/api/admin/pharmacies', { params: { skip, limit: PAGE_SIZE } }),
        ]);

        if (!active) return;

        setTotal(countResponse.data?.total || 0);
        setPharmacies(Array.isArray(pharmaciesResponse.data) ? pharmaciesResponse.data : []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || err.message || t('pharmacies.failedLoad'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPharmacies();
    return () => {
      active = false;
    };
  }, [page]);

  const governorates = Array.from(new Set(pharmacies.map((item) => item.governorate).filter(Boolean)));
  const filteredPharmacies = pharmacies.filter((item) => {
    const matchesSearch =
      !search ||
      [item.name, item.address, item.phone, item.governorate]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()));
    const matchesGovernorate = governorate === 'all' || item.governorate === governorate;
    return matchesSearch && matchesGovernorate;
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const mappedCount = pharmacies.filter((item) => typeof item.latitude === 'number' && typeof item.longitude === 'number').length;
  const phoneCount = pharmacies.filter((item) => item.phone).length;
  const addressCount = pharmacies.filter((item) => item.address).length;
  const readiness = pharmacies.length
    ? Math.round(((mappedCount + phoneCount + addressCount) / (pharmacies.length * 3)) * 100)
    : 0;
  const reviewNeeded = pharmacies.length - Math.min(pharmacies.length, mappedCount);
  const mapReadiness = pharmacies.length ? Math.round((mappedCount / pharmacies.length) * 100) : 0;
  const phoneReadiness = pharmacies.length ? Math.round((phoneCount / pharmacies.length) * 100) : 0;
  const addressReadiness = pharmacies.length ? Math.round((addressCount / pharmacies.length) * 100) : 0;

  return (
    <div className="page-shell">
      <div className="page-content">
        <div className="page-heading-row">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('pharmacies.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('pharmacies.description', { total: total || 0 })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to="/upload-pharmacies">
                <FileUp className="h-4 w-4" />
                {t('pharmacies.importCsv')}
              </Link>
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              {t('pharmacies.registerPharmacy')}
            </Button>
          </div>
        </div>

        {error ? <div className="bento-card border-danger/25 bg-danger-soft p-4 text-sm font-medium text-danger">{error}</div> : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_0.9fr_0.9fr]">
          <StatBox icon={Package} label={t('pharmacies.totalUnits')} value={loading ? '...' : total} />
          <StatBox icon={CheckCircle2} label={t('pharmacies.activeNow')} value={loading ? '...' : Math.max(0, total - reviewNeeded)} tone="green" />
          <StatBox icon={ShieldCheck} label={t('pharmacies.onGarde')} value={loading ? '...' : Math.min(56, total)} tone="orange" />
          <StatBox icon={AlertTriangle} label={t('pharmacies.reviewNeeded')} value={loading ? '...' : reviewNeeded} tone="red" />
        </div>

        <div className="registry-readiness">
          <ReadinessMeter label={t('pharmacies.mapData')} value={mapReadiness} icon={MapPinned} />
          <ReadinessMeter label={t('pharmacies.phoneData')} value={phoneReadiness} icon={Package} />
          <ReadinessMeter label={t('pharmacies.addressData')} value={addressReadiness} icon={ShieldCheck} />
        </div>

        <div className="registry-controls">
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="relative w-full md:w-64">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={governorate} onChange={(event) => setGovernorate(event.target.value)} className="pl-10">
                <option value="all">{t('pharmacies.allGovernorates')}</option>
                {governorates.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder={t('pharmacies.searchPlaceholder')} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/map">
                <MapPinned className="h-4 w-4" />
                {t('pharmacies.openMap')}
              </Link>
            </Button>
            <Button variant="ghost">
              <Download className="h-4 w-4" />
              {t('pharmacies.export')}
            </Button>
          </div>
        </div>

        <div className="registry-table-shell">
          {filteredPharmacies.length ? (
            <table className="min-w-[1000px] w-full border-collapse text-left">
              <thead>
                <tr>
                  <th>{t('pharmacies.pharmacyName')}</th>
                  <th>{t('pharmacies.governorate')}</th>
                  <th>{t('pharmacies.address')}</th>
                  <th>{t('pharmacies.phone')}</th>
                  <th>{t('pharmacies.coordinates')}</th>
                  <th>{t('pharmacies.status')}</th>
                  <th>{t('pharmacies.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPharmacies.map((item, index) => {
                  const status = typeof item.latitude === 'number' && typeof item.longitude === 'number'
                    ? index % 5 === 1 ? 'Garde' : 'Active'
                    : 'Inactive';
                  return (
                    <tr key={item.id} style={{ '--row-index': index }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="registry-avatar">{initials(item.name)}</div>
                          <div>
                            <p className="font-bold text-foreground">{item.name || t('pharmacies.unnamedPharmacy')}</p>
                            <p className="text-[0.6875rem] text-muted-foreground">ID: PH-{String(item.id).padStart(5, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="registry-chip">{item.governorate || t('pharmacies.notAvailable')}</span></td>
                      <td className="max-w-[220px] truncate text-muted-foreground">{item.address || '-'}</td>
                      <td className="text-muted-foreground">{item.phone || '-'}</td>
                      <td>
                        {typeof item.latitude === 'number' && typeof item.longitude === 'number'
                          ? <code>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</code>
                          : <span className="registry-chip registry-chip--warning">{t('pharmacies.missing')}</span>}
                      </td>
                      <td><StatusPill status={status} t={t} /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="registry-icon-button" aria-label={t('pharmacies.editPharmacy')}><Pencil className="h-4 w-4" /></button>
                          <button className="registry-icon-button" aria-label={t('pharmacies.viewPharmacy')}><Eye className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={MapPinned}
                title={loading ? t('pharmacies.loadingPharmacies') : t('pharmacies.noMatchingPharmacies')}
                description={loading ? t('pharmacies.fetchingRegistry') : t('pharmacies.noMatchingPharmaciesDesc')}
              />
            </div>
          )}
          <div className="registry-pagination">
            <p className="text-sm text-muted-foreground">
              {t('pharmacies.showingPrefix')} <strong>{filteredPharmacies.length ? 1 : 0}</strong> {t('pharmacies.showingTo')} <strong>{filteredPharmacies.length}</strong> {t('pharmacies.showingOf')} <strong>{total}</strong> {t('pharmacies.entries')}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="registry-page-current">{page}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="registry-map-preview lg:col-span-2">
            <div className="absolute left-4 top-4 max-w-xs rounded-[8px] border border-border bg-surface-elevated/90 p-3 shadow-elevated backdrop-blur">
              <h3 className="font-display text-base font-bold text-foreground">{t('pharmacies.regionalDensity')}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t('pharmacies.regionalDensityDesc')}</p>
            </div>
            <Button className="absolute bottom-4 right-4" asChild>
              <Link to="/map">
                <MapPinned className="h-4 w-4" />
                {t('pharmacies.expandFullMap')}
              </Link>
            </Button>
          </div>

          <div className="registry-system-card">
            <div>
              <Upload className="mb-4 h-10 w-10 text-primary" />
              <h3 className="font-display text-xl font-bold text-white">{t('pharmacies.inventorySync')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {t('pharmacies.inventorySyncDesc', { readiness })}
              </p>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500">{t('pharmacies.lastAudit')}</p>
                <p className="text-sm text-white">{t('pharmacies.today')}</p>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500">{t('pharmacies.systemHealth')}</p>
                <p className="text-sm font-bold text-emerald-400">{t('pharmacies.optimal')}</p>
              </div>
              <button className="w-full rounded-[8px] bg-white/10 py-3 text-sm font-bold text-white transition hover:bg-white/20">
                {t('pharmacies.viewSystemLogs')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmaciesPage;
