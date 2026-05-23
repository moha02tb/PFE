/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CloudDownload,
  Database,
  BarChart3,
  HelpCircle,
  Info,
  ListChecks,
  MapPinned,
  Pill,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';
import AdminLineChart from '../components/charts/AdminLineChart';
import AdminBarChart from '../components/charts/AdminBarChart';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';

const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);
const POLL_INTERVAL_MS = 30000;
const formatRefreshTime = () =>
  `Last refreshed at ${new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;
const formatDay = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { weekday: 'short' })
    : '-';

const chartColors = {
  primary: '#14b8a6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  grid: 'rgba(148, 163, 184, 0.22)',
  axis: '#64748b',
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value || 0));

const toChartSeries = (items = [], key = 'count') =>
  items.map((item, index) => ({
    label: item.day ? formatDay(item.day) : item.label || `P${index + 1}`,
    value: item[key] || 0,
  }));

const Sparkline = ({ data, color = chartColors.primary }) => (
  <div className="mt-4 h-10 min-w-0">
    <AdminLineChart
      labels={(data || []).map((d) => d.label)}
      datasets={[{ data: (data || []).map((d) => d.value), borderColor: color, backgroundColor: color, fill: false, tension: 0.3, pointRadius: 0 }]}
      height={40}
      options={{ plugins: { legend: { display: false } } }}
    />
  </div>
);

const PollingStatusPill = ({ loading, lastUpdated }) => (
  <div className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-surface-elevated/80 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-soft">
    <RefreshCw className={`h-3.5 w-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
    {loading ? `Refreshing dashboard - ${lastUpdated}` : lastUpdated}
  </div>
);

const StatTile = ({ icon: Icon, label, value, meta, tone = 'blue', progress, progressLabel, sparklineData }) => {
  const toneClass = {
    blue: 'bg-primary-soft text-primary dark:bg-primary/12 dark:text-primary',
    teal: 'bg-primary-soft text-primary dark:bg-primary/12 dark:text-primary',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200',
  }[tone];
  const sparkColor = tone === 'amber' ? chartColors.warning : tone === 'green' ? chartColors.success : chartColors.primary;

  return (
    <div className="bento-card flex min-h-44 flex-col justify-between p-5">
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
            <div className="h-full rounded-full bg-primary" style={{ width: `${clamp(progress)}%` }} />
          </div>
        ) : null}
        {sparklineData?.length ? <Sparkline data={sparklineData} color={sparkColor} /> : null}
      </div>
    </div>
  );
};

const MiniMetric = ({ icon: Icon, label, value, muted = false }) => (
  <div className={`bento-card flex items-center gap-4 p-4 ${muted ? 'opacity-70' : ''}`}>
    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary-soft text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
    </div>
  </div>
);

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

const ChartCard = ({ title, description, children, className = '' }) => (
  <div className={`bento-card p-5 ${className}`}>
    <div className="mb-5">
      <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);

const ChartEmptyState = ({ title, description }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-[10px] border border-dashed border-border bg-surface-muted/40 p-4">
    <EmptyState icon={BarChart3} title={title} description={description} className="w-full max-w-md" />
  </div>
);

const DataQualityPanel = ({ metrics }) => (
  <div className="bento-card p-5">
    <div className="mb-5">
      <h3 className="font-display text-base font-bold text-foreground">Data quality metrics</h3>
      <p className="mt-1 text-xs text-muted-foreground">Coverage calculated from the latest pharmacy sample.</p>
    </div>
    <div className="space-y-4">
      {metrics.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{item.label}</span>
            <span className={item.value >= 80 ? 'font-bold text-emerald-600 dark:text-emerald-300' : 'font-bold text-amber-600 dark:text-amber-300'}>
              {item.value}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${item.value >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RecentActivityFeed = ({ items }) => (
  <div className="bento-card p-5">
    <div className="mb-5">
      <h3 className="font-display text-base font-bold text-foreground">Recent activity</h3>
      <p className="mt-1 text-xs text-muted-foreground">Fresh operational signals from analytics and registry changes.</p>
    </div>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.title}-${item.time}`} className="flex gap-3 rounded-[8px] border border-border bg-surface-elevated/70 p-3">
          <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${item.tone === 'warning' ? 'bg-amber-500' : item.tone === 'info' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
            <p className="mt-2 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DASHBOARD_MAP_TILES = [
  { x: 32, y: 24, left: 'calc(50% - 463px)', top: 'calc(50% - 244px)' },
  { x: 33, y: 24, left: 'calc(50% - 207px)', top: 'calc(50% - 244px)' },
  { x: 34, y: 24, left: 'calc(50% + 49px)', top: 'calc(50% - 244px)' },
  { x: 35, y: 24, left: 'calc(50% + 305px)', top: 'calc(50% - 244px)' },
  { x: 32, y: 25, left: 'calc(50% - 463px)', top: 'calc(50% + 12px)' },
  { x: 33, y: 25, left: 'calc(50% - 207px)', top: 'calc(50% + 12px)' },
  { x: 34, y: 25, left: 'calc(50% + 49px)', top: 'calc(50% + 12px)' },
  { x: 35, y: 25, left: 'calc(50% + 305px)', top: 'calc(50% + 12px)' },
];

const LargerMapWidget = ({ latestPharmacies, coverageAverage, t }) => {
  const pins = latestPharmacies.slice(0, 8);
  return (
    <div className="bento-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">{t('dashboard.networkDensity')}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{coverageAverage >= 75 ? t('dashboard.highCoverage') : t('dashboard.needsReview')}</p>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/map">
            {t('dashboard.viewLiveMap')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="map-preview relative h-[320px]">
        {DASHBOARD_MAP_TILES.map((tile) => (
          <img
            key={`${tile.x}-${tile.y}`}
            src={`https://tile.openstreetmap.org/6/${tile.x}/${tile.y}.png`}
            alt=""
            aria-hidden="true"
            draggable="false"
            className="map-preview__tile"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        {pins.map((item, index) => (
          <div
            key={item.id || index}
            className="absolute z-[4] h-3 w-3 rounded-full border-2 border-white bg-primary shadow-[0_0_0_6px_rgba(20,184,166,0.18)]"
            style={{
              left: `${22 + ((index * 13) % 58)}%`,
              top: `${24 + ((index * 17) % 52)}%`,
            }}
            title={item.name}
          />
        ))}
        <a
          className="map-preview__attribution"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OSM
        </a>
      </div>
    </div>
  );
};

const QuickActionsPanel = ({ t }) => (
  <div className="bento-card p-5">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="font-display text-base font-bold text-foreground">{t('dashboard.topActions')}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.topActionsDesc')}</p>
      </div>
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
      <Button className="justify-between" asChild>
        <Link to="/upload-pharmacies">
          <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> {t('dashboard.uploadPharmacies')}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
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
  const [lastUpdated, setLastUpdated] = useState('Not refreshed yet');
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const requestInFlightRef = useRef(false);

  const loadDashboard = useCallback(async ({ background = false } = {}) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const initialLoad = !background && !hasLoadedRef.current;
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    if (!hasLoadedRef.current) {
      setError('');
    }

    try {
      const [dashboardResponse, activityResponse, pharmaciesResponse] = await Promise.all([
        api.get('/api/admin/analytics/dashboard'),
        api.get('/api/admin/analytics/activity', { params: { days: 14 } }),
        api.get('/api/admin/pharmacies', { params: { skip: 0, limit: 12 } }),
      ]);

      if (!mountedRef.current) return;

      setDashboard(dashboardResponse.data);
      setActivity(activityResponse.data);
      setLatestPharmacies(Array.isArray(pharmaciesResponse.data) ? pharmaciesResponse.data : []);
      setLastUpdated(formatRefreshTime());
      setError('');
      hasLoadedRef.current = true;
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err.response?.data?.detail || err.message || t('dashboard.failedLoad');
      const failedAt = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setError(hasLoadedRef.current ? `Refresh failed at ${failedAt}: ${message}` : message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      requestInFlightRef.current = false;
    }
  }, [t]);

  useEffect(() => {
    mountedRef.current = true;

    loadDashboard();
    const intervalId = window.setInterval(() => {
      loadDashboard({ background: true });
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);

  const totals = dashboard?.totals || {};
  const growth = dashboard?.growth || {};
  const auth = dashboard?.auth || {};
  const pharmacyAnalytics = dashboard?.pharmacies || {};
  const searches = dashboard?.searches || {};
  const recentRegistrations = useMemo(() => (activity?.user_registrations || []).slice(-7), [activity]);
  const registrationChart = useMemo(() => toChartSeries(activity?.user_registrations || [], 'count'), [activity]);
  const loginChart = useMemo(() => (activity?.logins || []).slice(-10).map((item) => ({
    label: formatDay(item.day),
    success: item.success || 0,
    failed: item.failed || 0,
  })), [activity]);
  const searchChart = useMemo(() => {
    return toChartSeries(activity?.searches || [], 'count');
  }, [activity]);
  const governorateChart = useMemo(() => (pharmacyAnalytics.top_governorates || []).slice(0, 7).map((item) => ({
    governorate: item.governorate,
    count: item.count || 0,
  })), [pharmacyAnalytics]);
  const loginTotal30d = (auth.login_success_last_30_days || 0) + (auth.login_failed_last_30_days || 0);
  const authSuccessRate = loginTotal30d
    ? Math.round(((auth.login_success_last_30_days || 0) / loginTotal30d) * 100)
    : 0;
  const mapCoverage = latestPharmacies.filter(
    (item) => typeof item.latitude === 'number' && typeof item.longitude === 'number'
  ).length;
  const phoneCoverage = latestPharmacies.filter((item) => item.phone).length;
  const addressCoverage = latestPharmacies.filter((item) => item.address).length;
  const governorateCoverage = latestPharmacies.filter((item) => item.governorate).length;
  const coverageAverage = latestPharmacies.length
    ? Math.round(((mapCoverage + phoneCoverage + addressCoverage + governorateCoverage) / (latestPharmacies.length * 4)) * 100)
    : 0;
  const chartItems = recentRegistrations.length ? recentRegistrations : registrationChart.map((item) => ({ day: item.label, count: item.value }));
  const serviceStatus = authSuccessRate >= 80 ? t('dashboard.healthy') : t('dashboard.needsReview');
  const registrationTotal7d = chartItems.reduce((sum, item) => sum + (item.count || 0), 0);
  const hasRegistrationChartData = registrationChart.length > 0;
  const hasLoginChartData = loginChart.length > 0;
  const hasSearchChartData = searchChart.length > 0;
  const hasGovernorateChartData = governorateChart.length > 0;
  const qualityMetrics = [
    { label: t('dashboard.mapCoordinates'), value: latestPharmacies.length ? Math.round((mapCoverage / latestPharmacies.length) * 100) : 0 },
    { label: t('dashboard.phoneCoverage'), value: latestPharmacies.length ? Math.round((phoneCoverage / latestPharmacies.length) * 100) : 0 },
    { label: t('dashboard.addressCoverage'), value: latestPharmacies.length ? Math.round((addressCoverage / latestPharmacies.length) * 100) : 0 },
    { label: 'Governorate coverage', value: latestPharmacies.length ? Math.round((governorateCoverage / latestPharmacies.length) * 100) : 0 },
  ];
  const recentActivity = [
    {
      title: 'Dashboard analytics refreshed',
      description: `${formatNumber(searches.today || 0)} searches tracked today.`,
      time: lastUpdated,
      tone: 'success',
    },
    {
      title: 'Registry sample loaded',
      description: `${latestPharmacies.length} recent pharmacy records inspected for data quality.`,
      time: lastUpdated,
      tone: coverageAverage >= 75 ? 'success' : 'warning',
    },
    {
      title: 'Authentication signal updated',
      description: `${authSuccessRate}% successful logins across the last 30 days.`,
      time: lastUpdated,
      tone: authSuccessRate >= 60 ? 'success' : 'warning',
    },
    {
      title: 'Import activity reviewed',
      description: `${formatNumber(pharmacyAnalytics.bulk_uploads_last_30_days || 0)} pharmacy uploads in the last 30 days.`,
      time: lastUpdated,
      tone: 'info',
    },
  ];

  return (
    <div className="page-shell">
      <div className="page-content gap-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary">
              {t('dashboard.eyebrow')}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('dashboard.description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PollingStatusPill loading={loading || refreshing} lastUpdated={lastUpdated} />
            <Button
              variant="secondary"
              onClick={() => loadDashboard({ background: true })}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
          <div className="bento-card border-warning/25 bg-warning-soft p-4 text-sm font-medium text-warning">
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

        <div className="grid gap-4 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-[10px]" />)
          ) : (
            <>
              <StatTile
                icon={TrendingUp}
                label={t('dashboard.users')}
                value={formatNumber(growth.users_last_30_days)}
                meta={t('dashboard.usersSubtitle', { count: formatNumber(growth.users_last_30_days) })}
                tone="blue"
                sparklineData={registrationChart}
              />
              <StatTile
                icon={ShieldCheck}
                label={t('dashboard.authHealth')}
                value={`${authSuccessRate}%`}
                meta={t('dashboard.authSuccess', { rate: authSuccessRate })}
                tone="teal"
                progress={authSuccessRate}
                progressLabel={authSuccessRate >= 80 ? t('common.active') : serviceStatus}
                sparklineData={loginChart.map((item) => ({ label: item.label, value: item.success }))}
              />
              <StatTile
                icon={Database}
                label={t('dashboard.dataReadiness')}
                value={`${coverageAverage}%`}
                meta={t('dashboard.dataReadinessDesc')}
                tone={coverageAverage >= 80 ? 'green' : 'amber'}
                progress={coverageAverage}
                progressLabel={coverageAverage >= 80 ? t('common.active') : t('dashboard.needsReview')}
                sparklineData={qualityMetrics.map((item) => ({ label: item.label, value: item.value }))}
              />
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.55fr]">
          <LargerMapWidget latestPharmacies={latestPharmacies} coverageAverage={coverageAverage} t={t} />
          <QuickActionsPanel t={t} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard title={t('dashboard.registrationMomentum')} description={t('dashboard.registrationMomentumDesc')}>
            {hasRegistrationChartData ? (
              <div className="h-56 min-w-0">
                <AdminLineChart
                  labels={registrationChart.map((i) => i.label)}
                  datasets={[{ label: t('dashboard.registrationMomentum'), data: registrationChart.map((i) => i.value), borderColor: chartColors.primary, backgroundColor: chartColors.primary, fill: true, tension: 0.3 }]}
                  height={220}
                />
              </div>
            ) : (
              <ChartEmptyState title={t('dashboard.noRegistrationData')} description={t('dashboard.noRegistrationDataDesc')} />
            )}
          </ChartCard>

          <ChartCard title={t('dashboard.authHealth')} description={t('dashboard.authHealthDesc')}>
            {hasLoginChartData ? (
              <div className="h-56 min-w-0">
                <AdminBarChart
                  labels={loginChart.map((i) => i.label)}
                  datasets={[
                    { label: t('dashboard.successfulLogins'), data: loginChart.map((i) => i.success), backgroundColor: chartColors.success },
                    { label: t('dashboard.failedLogins'), data: loginChart.map((i) => i.failed), backgroundColor: chartColors.danger },
                  ]}
                  height={220}
                />
              </div>
            ) : (
              <ChartEmptyState title={t('dashboard.noRegistrationData')} description={t('dashboard.noRegistrationDataDesc')} />
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard title={t('dashboard.searchActivity')} description={t('dashboard.searchActivityDesc')}>
            {hasSearchChartData ? (
              <div className="h-56 min-w-0">
                <AdminLineChart
                  labels={searchChart.map((i) => i.label)}
                  datasets={[{ label: t('dashboard.searchActivity'), data: searchChart.map((i) => i.value), borderColor: chartColors.info, backgroundColor: chartColors.info, fill: false, tension: 0.3 }]}
                  height={220}
                />
              </div>
            ) : (
              <ChartEmptyState title={t('dashboard.noRegistrationData')} description={t('dashboard.noRegistrationDataDesc')} />
            )}
          </ChartCard>

          <ChartCard title={t('dashboard.topGovernorates')} description={t('dashboard.topGovernoratesDesc')}>
            {hasGovernorateChartData ? (
              <div className="h-56 min-w-0">
                <AdminBarChart
                  labels={governorateChart.map((g) => g.governorate)}
                  datasets={[{ label: t('dashboard.pharmacies'), data: governorateChart.map((g) => g.count), backgroundColor: chartColors.primary }]}
                  height={220}
                  horizontal={true}
                />
              </div>
            ) : (
              <ChartEmptyState title={t('dashboard.noRegistrationData')} description={t('dashboard.noRegistrationDataDesc')} />
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <DataQualityPanel metrics={qualityMetrics} />
          <RecentActivityFeed items={recentActivity} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
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
                latestPharmacies.slice(0, 5).map((item) => (
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
            {loading ? (
              <Skeleton className="h-56 rounded-[10px]" />
            ) : (
              <div className="h-56 min-w-0">
                <AdminBarChart
                  labels={chartItems.map((item) => formatDay(item.day))}
                  datasets={[{ label: t('dashboard.registrationMomentum'), data: chartItems.map((item) => item.count || 0), backgroundColor: chartColors.primary }]}
                  height={220}
                />
              </div>
            )}
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
      </div>
    </div>
  );
};

export default DashboardPage;
