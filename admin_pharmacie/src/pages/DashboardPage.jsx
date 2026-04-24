/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CloudDownload,
  Database,
  HelpCircle,
  Info,
  ListChecks,
  MapPinned,
  Pill,
  RadioTower,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Button, Skeleton } from '../components/ui';

const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);
const formatDay = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { weekday: 'short' })
    : '-';

const StatTile = ({ icon: Icon, label, value, meta, tone = 'blue', progress, progressLabel }) => {
  const toneClass = {
    blue: 'bg-primary-soft text-primary dark:bg-primary/12 dark:text-primary',
    teal: 'bg-primary-soft text-primary dark:bg-primary/12 dark:text-primary',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200',
  }[tone];

  return (
    <div className="bento-card flex min-h-40 flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        {meta ? <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-muted-foreground">{meta}</span> : null}
      </div>
      <div>
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <h2 className="metric-value font-display text-4xl font-extrabold leading-none text-foreground">{value}</h2>
          {progressLabel ? <span className="text-xs font-medium text-muted-foreground">{progressLabel}</span> : null}
        </div>
        {typeof progress === 'number' ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const MiniMetric = ({ icon: Icon, label, value, muted = false }) => (
  <div className={`bento-card flex items-center gap-4 p-4 ${muted ? 'opacity-60' : ''}`}>
    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary-soft text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const Bars = ({ items, valueKey, t }) => {
  const max = Math.max(1, ...items.map((item) => item[valueKey] || 0));

  return (
    <div aria-label={t('dashboard.registrationBarChart')} role="img">
      <div className="flex h-48 items-end justify-between gap-2 px-2">
        {items.map((item, index) => {
          const height = Math.max(18, ((item[valueKey] || 0) / max) * 178);
          const emphasis = index === 3 || index === items.length - 1;
          return (
            <div key={`${index}-${item.day}`} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-bold text-foreground">{item[valueKey] || 0}</span>
              <div
                className={emphasis ? 'chart-bar w-full rounded-t-[4px] bg-primary' : 'chart-bar w-full rounded-t-[4px] bg-primary/25'}
                style={{ height, '--row-index': index }}
                title={`${formatDay(item.day)}: ${item[valueKey] || 0}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-between px-2 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {items.map((item, index) => <span key={`${item.day}-${index}`}>{formatDay(item.day)}</span>)}
      </div>
    </div>
  );
};

const ProgressRow = ({ label, value, total, tone = 'primary' }) => {
  const percent = Math.min(100, total ? Math.round(((value || 0) / total) * 100) : 0);
  const toneClass =
    tone === 'success' ? 'bg-emerald-500' : tone === 'danger' ? 'bg-red-500' : 'bg-primary';

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{formatNumber(value)} · {percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
        <div className={`progress-fill h-full rounded-full ${toneClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const PulseItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.055] p-3">
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-sm font-medium text-slate-200">{label}</span>
    </div>
    <span className="text-xl font-bold text-white">{value}</span>
  </div>
);

const ServiceDot = ({ tone = 'success', label }) => (
  <div className="flex items-center gap-2">
    <span className={`h-2 w-2 rounded-full ${tone === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
    <span className="text-xs text-slate-300">{label}</span>
  </div>
);

const MapPreview = ({ coverageAverage, t }) => (
  <div className="bento-card overflow-hidden p-0">
    <div className="map-preview relative h-32 cursor-pointer">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full border border-border bg-surface-elevated/90 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-foreground shadow-soft backdrop-blur">
          {t('dashboard.viewLiveMap')}
        </span>
      </div>
    </div>
    <div className="flex items-center justify-between p-4">
      <span className="text-sm font-semibold text-foreground">{t('dashboard.networkDensity')}</span>
      <span className="text-xs text-muted-foreground">{coverageAverage >= 75 ? t('dashboard.highCoverage') : t('dashboard.needsReview')}</span>
    </div>
  </div>
);

const CommandStrip = ({ authSuccessRate, coverageAverage, registrationTotal7d, serviceStatus, t }) => {
  const spark = [34, 48, 42, 64, 58, 72, 68, 84];
  return (
    <div className="command-strip">
      <div className="command-strip__item" style={{ '--signal-width': `${authSuccessRate}%` }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t('dashboard.authSignal')}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">{authSuccessRate}%</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="command-strip__item" style={{ '--signal-width': `${coverageAverage}%` }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t('dashboard.registryQuality')}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">{coverageAverage}%</p>
          </div>
          <Database className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="command-strip__item" style={{ '--signal-width': `${Math.min(100, registrationTotal7d * 8)}%` }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{serviceStatus}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{t('dashboard.registrationsTracked', { count: registrationTotal7d })}</p>
          </div>
          <div className="sparkline" aria-hidden="true">
            {spark.map((height, index) => (
              <span key={index} style={{ height: `${height}%`, '--spark-index': index }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [activity, setActivity] = useState(null);
  const [latestPharmacies, setLatestPharmacies] = useState([]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [dashboardResponse, activityResponse, pharmaciesResponse] = await Promise.all([
          api.get('/api/admin/analytics/dashboard'),
          api.get('/api/admin/analytics/activity', { params: { days: 14 } }),
          api.get('/api/admin/pharmacies', { params: { skip: 0, limit: 8 } }),
        ]);

        if (!active) return;

        setDashboard(dashboardResponse.data);
        setActivity(activityResponse.data);
        setLatestPharmacies(Array.isArray(pharmaciesResponse.data) ? pharmaciesResponse.data : []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || err.message || t('dashboard.failedLoad'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [t]);

  const totals = dashboard?.totals || {};
  const growth = dashboard?.growth || {};
  const auth = dashboard?.auth || {};
  const pharmacyAnalytics = dashboard?.pharmacies || {};
  const recentRegistrations = useMemo(() => (activity?.user_registrations || []).slice(-7), [activity]);
  const loginTotal30d = (auth.login_success_last_30_days || 0) + (auth.login_failed_last_30_days || 0);
  const authSuccessRate = loginTotal30d
    ? Math.round(((auth.login_success_last_30_days || 0) / loginTotal30d) * 100)
    : 0;
  const mapCoverage = latestPharmacies.filter(
    (item) => typeof item.latitude === 'number' && typeof item.longitude === 'number'
  ).length;
  const phoneCoverage = latestPharmacies.filter((item) => item.phone).length;
  const addressCoverage = latestPharmacies.filter((item) => item.address).length;
  const coverageAverage = latestPharmacies.length
    ? Math.round(((mapCoverage + phoneCoverage + addressCoverage) / (latestPharmacies.length * 3)) * 100)
    : 0;
  const registrationFallback = [
    { day: 'Mon', count: 1 },
    { day: 'Tue', count: 2 },
    { day: 'Wed', count: 3 },
    { day: 'Thu', count: 4 },
    { day: 'Fri', count: 3 },
    { day: 'Sat', count: 2 },
    { day: 'Sun', count: 3 },
  ];
  const chartItems = recentRegistrations.length ? recentRegistrations : registrationFallback;
  const serviceStatus = authSuccessRate >= 60 ? t('dashboard.healthy') : t('dashboard.review');
  const registrationTotal7d = chartItems.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="page-shell">
      <div className="page-content">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary">
              {t('dashboard.eyebrow')}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('dashboard.description')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" asChild>
              <Link to="/upload-garde">
                <Upload className="h-4 w-4" />
                {t('dashboard.uploadGarde')}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/upload-pharmacies">
                <Building2 className="h-4 w-4" />
                {t('dashboard.uploadPharmacies')}
              </Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="bento-card border-danger/25 bg-danger-soft p-4 text-sm font-medium text-danger">
            {error}
          </div>
        ) : null}

        <CommandStrip
          authSuccessRate={authSuccessRate}
          coverageAverage={coverageAverage}
          registrationTotal7d={registrationTotal7d}
          serviceStatus={serviceStatus}
          t={t}
        />

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 grid gap-4 lg:col-span-9">
            <div className="grid gap-4 md:grid-cols-[1.35fr_1fr] xl:grid-cols-[1.35fr_1fr_0.95fr]">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-[8px]" />)
              ) : (
                <>
                  <StatTile
                    icon={TrendingUp}
                    label={t('dashboard.users')}
                    value={formatNumber(growth.users_last_30_days)}
                    meta={t('dashboard.usersSubtitle', { count: formatNumber(growth.users_last_30_days) })}
                    tone="blue"
                  />
                  <StatTile
                    icon={ShieldCheck}
                    label={t('dashboard.authHealth')}
                    value={`${authSuccessRate}%`}
                    meta={t('dashboard.authSuccess', { rate: authSuccessRate })}
                    tone="teal"
                    progress={authSuccessRate}
                    progressLabel={authSuccessRate >= 60 ? t('common.active') : serviceStatus}
                  />
                  <StatTile
                    icon={Database}
                    label={t('dashboard.dataReadiness')}
                    value={`${coverageAverage}%`}
                    meta={t('dashboard.dataReadinessDesc')}
                    tone={coverageAverage >= 80 ? 'green' : 'amber'}
                    progress={coverageAverage}
                    progressLabel={coverageAverage >= 80 ? t('common.active') : serviceStatus}
                  />
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_0.9fr_1.1fr_0.9fr]">
              <MiniMetric icon={UserRound} label={t('dashboard.users')} value={loading ? '...' : formatNumber(totals.users)} />
              <MiniMetric icon={ShieldCheck} label={t('dashboard.admins')} value={loading ? '...' : formatNumber(totals.admins)} />
              <MiniMetric
                icon={CloudDownload}
                label={t('dashboard.pharmacyUploads')}
                value={loading ? '...' : formatNumber(pharmacyAnalytics.bulk_uploads_last_30_days)}
                muted
              />
              <MiniMetric icon={ListChecks} label={t('dashboard.gardeRows')} value={loading ? '...' : formatNumber(totals.gardes)} />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="bento-card p-5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">{t('dashboard.registrationMomentum')}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.registrationMomentumDesc')}</p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                    {t('dashboard.in7Days', { count: registrationTotal7d })}
                  </span>
                </div>
                {loading ? <Skeleton className="h-56 rounded-[8px]" /> : <Bars items={chartItems} valueKey="count" t={t} />}
              </div>

              <div className="bento-card p-5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">{t('dashboard.authHealth')}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.authHealthDesc')}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
                    <Info className="h-3.5 w-3.5" />
                    {t('dashboard.authSuccess', { rate: authSuccessRate })}
                  </span>
                </div>
                <div className="space-y-6">
                  <ProgressRow label={t('dashboard.successfulLogins')} value={auth.login_success_last_30_days} total={loginTotal30d} tone="success" />
                  <ProgressRow label={t('dashboard.failedLogins')} value={auth.login_failed_last_30_days} total={loginTotal30d} tone="danger" />
                  <div className="flex items-center gap-2 border-t border-border pt-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">
                      {t('dashboard.recentSeries', {
                        success: formatNumber(auth.login_success_last_30_days || 0),
                        failed: formatNumber(auth.login_failed_last_30_days || 0),
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{t('dashboard.latestPharmacies')}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.latestPharmaciesDesc')}</p>
                </div>
                <Button variant="ghost" asChild>
                  <Link to="/pharmacies">
                    {t('common.viewAll')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="divide-y divide-border">
                {latestPharmacies.length ? (
                  latestPharmacies.slice(0, 4).map((item) => (
                    <div key={item.id} className="grid gap-3 px-5 py-3 text-sm sm:grid-cols-[1.5fr_0.8fr_0.8fr_auto] sm:items-center">
                      <div>
                        <p className="font-semibold text-foreground">{item.name || t('dashboard.unnamedPharmacy')}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{item.address || t('dashboard.noAddressAvailable')}</p>
                      </div>
                      <span className="text-muted-foreground">{item.governorate || '-'}</span>
                      <span className="text-muted-foreground">{item.phone || '-'}</span>
                      <Badge variant={typeof item.latitude === 'number' && typeof item.longitude === 'number' ? 'success' : 'warning'}>
                        {typeof item.latitude === 'number' && typeof item.longitude === 'number' ? t('dashboard.mapped') : t('dashboard.missingMapData')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    {loading ? t('common.loading') : t('dashboard.noPharmacyRecords')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-12 space-y-4 lg:col-span-3">
            <div className="pulse-panel p-5">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">{t('dashboard.operationalPulse')}</h3>
                  <p className="text-xs text-slate-400">{serviceStatus}</p>
                </div>
              </div>
              <div className="space-y-4">
                <PulseItem icon={Users} label={t('dashboard.users')} value={loading ? '...' : formatNumber(totals.users)} />
                <PulseItem icon={Building2} label={t('nav.pharmacies')} value={loading ? '...' : formatNumber(totals.pharmacies)} />
                <PulseItem icon={CalendarDays} label={t('dashboard.gardeRows')} value={loading ? '...' : formatNumber(totals.gardes)} />
              </div>
              <div className="mt-8">
                <p className="mb-4 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate-500">{t('dashboard.serviceStatus')}</p>
                <div className="flex flex-col gap-3">
                  <ServiceDot label={t('dashboard.apiGatewayOnline')} />
                  <ServiceDot label={t('dashboard.authServiceHealthy')} />
                  <ServiceDot tone={coverageAverage >= 80 ? 'success' : 'warning'} label={t('dashboard.syncEngineLatency')} />
                </div>
              </div>
            </div>

            <MapPreview coverageAverage={coverageAverage} t={t} />

            <div className="bento-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-foreground">{t('dashboard.topActions')}</h3>
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid gap-3">
                <Button variant="secondary" className="justify-between" asChild>
                  <Link to="/map">
                    <span className="flex items-center gap-2"><MapPinned className="h-4 w-4" /> {t('dashboard.validateMap')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-between" asChild>
                  <Link to="/pharmacies">
                    <span className="flex items-center gap-2"><Pill className="h-4 w-4" /> {t('dashboard.reviewRegistry')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-between" asChild>
                  <Link to="/calendar">
                    <span className="flex items-center gap-2"><RadioTower className="h-4 w-4" /> {t('dashboard.inspectCalendar')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
