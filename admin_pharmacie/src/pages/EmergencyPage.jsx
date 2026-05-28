import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  Gauge,
  HardDrive,
  Info,
  Layers,
  ListChecks,
  MapPinned,
  MessageSquare,
  RefreshCw,
  Server,
  Smartphone,
  Timer,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import AdminLineChart from '../components/charts/AdminLineChart';
import AdminBarChart from '../components/charts/AdminBarChart';
import AdminDoughnutChart from '../components/charts/AdminDoughnutChart';
import { Badge, Button, EmptyState, Input, SectionHeader, Skeleton, Tabs } from '../components/ui';
import api from '../lib/api';

const statusConfig = {
  healthy: {
    label: 'Healthy',
    badge: 'success',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-200',
    panel: 'border-emerald-500/20 bg-emerald-500/5',
    chart: '#10b981',
  },
  warning: {
    label: 'Warning',
    badge: 'warning',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-200',
    panel: 'border-amber-500/20 bg-amber-500/5',
    chart: '#f59e0b',
  },
  down: {
    label: 'Down',
    badge: 'danger',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-200',
    panel: 'border-red-500/20 bg-red-500/5',
    chart: '#ef4444',
  },
  info: {
    label: 'Info',
    badge: 'neutral',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-200',
    panel: 'border-blue-500/20 bg-blue-500/5',
    chart: '#3b82f6',
  },
};

const iconMap = {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Layers,
  MapPinned,
  MessageSquare,
  Server,
  Smartphone,
  Timer,
};

const methodStyles = {
  GET: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-200',
  POST: 'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-200',
};

const chartColors = {
  backend: '#10b981',
  chatbot: '#f59e0b',
  mobile: '#3b82f6',
  error: '#ef4444',
  volume: '#14b8a6',
  grid: 'rgba(148, 163, 184, 0.22)',
  axis: 'oklch(var(--muted-foreground))',
};

const POLL_INTERVAL_MS = 30000;
const formatRefreshTime = () =>
  `Last refreshed at ${new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;

const fallbackCharts = {
  latencyTrend: [
    { check: '13:20', backend: 112, chatbot: 328, mobile: 142 },
    { check: '13:25', backend: 118, chatbot: 342, mobile: 149 },
    { check: '13:30', backend: 104, chatbot: 318, mobile: 136 },
    { check: '13:35', backend: 126, chatbot: 366, mobile: 151 },
    { check: '13:40', backend: 119, chatbot: 384, mobile: 146 },
    { check: '13:45', backend: 132, chatbot: 392, mobile: 159 },
    { check: '13:50', backend: 121, chatbot: 356, mobile: 148 },
    { check: '13:55', backend: 116, chatbot: 338, mobile: 143 },
    { check: '14:00', backend: 124, chatbot: 364, mobile: 152 },
    { check: '14:10', backend: 130, chatbot: 402, mobile: 161 },
    { check: '14:20', backend: 117, chatbot: 386, mobile: 147 },
    { check: '14:30', backend: 128, chatbot: 376, mobile: 154 },
  ],
  errorRateTrend: [
    { time: '13:20', rate: 0.03 },
    { time: '13:25', rate: 0.04 },
    { time: '13:30', rate: 0.04 },
    { time: '13:35', rate: 0.05 },
    { time: '13:40', rate: 0.06 },
    { time: '13:45', rate: 0.07 },
    { time: '13:50', rate: 0.06 },
    { time: '13:55', rate: 0.05 },
    { time: '14:00', rate: 0.06 },
    { time: '14:10', rate: 0.08 },
    { time: '14:20', rate: 0.07 },
    { time: '14:30', rate: 0.06 },
  ],
  requestVolume: [
    { hour: '03:00', requests: 420 },
    { hour: '04:00', requests: 388 },
    { hour: '05:00', requests: 364 },
    { hour: '06:00', requests: 498 },
    { hour: '07:00', requests: 732 },
    { hour: '08:00', requests: 1080 },
    { hour: '09:00', requests: 1324 },
    { hour: '10:00', requests: 1418 },
    { hour: '11:00', requests: 1256 },
    { hour: '12:00', requests: 1168 },
    { hour: '13:00', requests: 1226 },
    { hour: '14:00', requests: 1312 },
  ],
  endpointLatency: [
    { endpoint: '/health', latency: 68 },
    { endpoint: '/auth/login', latency: 142 },
    { endpoint: '/pharmacies', latency: 154 },
    { endpoint: '/medicines', latency: 181 },
    { endpoint: '/chatbot/answer', latency: 412 },
  ],
};

const fallbackHealthData = {
  kpis: [
    {
      label: 'Overall Status',
      value: 'Operational',
      helper: 'All critical services responding',
      icon: 'CheckCircle2',
      status: 'healthy',
    },
    {
      label: 'API Latency',
      value: '128 ms',
      helper: 'Average response time',
      icon: 'Timer',
      status: 'healthy',
    },
    {
      label: 'Error Rate',
      value: '0.07%',
      helper: 'Last 24 hours',
      icon: 'AlertTriangle',
      status: 'warning',
    },
    {
      label: 'Uptime',
      value: '99.97%',
      helper: 'Rolling 30 days',
      icon: 'Activity',
      status: 'healthy',
    },
    {
      label: 'Last Health Check',
      value: '14:32',
      helper: 'Demo data fallback',
      icon: 'Clock3',
      status: 'info',
    },
  ],
  services: [
    {
      name: 'Backend API',
      icon: 'Server',
      status: 'healthy',
      responseTime: '116 ms',
      lastChecked: '14:32',
      description: 'FastAPI gateway, authentication, pharmacy, medicine, and admin endpoints.',
    },
    {
      name: 'Database',
      icon: 'Database',
      status: 'healthy',
      responseTime: '42 ms',
      lastChecked: '14:31',
      description: 'Primary PostgreSQL connection pool and schema availability.',
    },
    {
      name: 'Mobile App API',
      icon: 'Smartphone',
      status: 'healthy',
      responseTime: '148 ms',
      lastChecked: '14:31',
      description: 'Public mobile endpoints for pharmacy search, map data, and medicines.',
    },
    {
      name: 'Chatbot API',
      icon: 'Bot',
      status: 'warning',
      responseTime: '284 ms',
      lastChecked: '14:30',
      description: 'Assistant answer service is available with elevated response time.',
    },
    {
      name: 'Notification Service',
      icon: 'Bell',
      status: 'healthy',
      responseTime: '94 ms',
      lastChecked: '14:29',
      description: 'In-app notification delivery, email dispatch queue, and alert routing.',
    },
    {
      name: 'Map Service',
      icon: 'MapPinned',
      status: 'healthy',
      responseTime: '132 ms',
      lastChecked: '14:29',
      description: 'Map tiles, coordinates, geocoding helpers, and pharmacy location previews.',
    },
  ],
  endpoints: [
    ['GET', '/health', 200, '68 ms', 'healthy', '14:32'],
    ['POST', '/auth/login', 200, '142 ms', 'healthy', '14:32'],
    ['GET', '/pharmacies', 200, '154 ms', 'healthy', '14:31'],
    ['GET', '/medicines', 200, '181 ms', 'healthy', '14:31'],
    ['POST', '/chatbot/answer', 200, '284 ms', 'warning', '14:30'],
    ['POST', '/uploads/pharmacies', 202, '238 ms', 'healthy', '14:28'],
    ['POST', '/uploads/medicines', 422, '206 ms', 'warning', '14:27'],
  ],
  databaseMetrics: [
    ['Connection status', 'Connected', 'healthy'],
    ['Query response time', '42 ms', 'healthy'],
    ['Total pharmacies', '2,418', 'info'],
    ['Total medicines', '14,892', 'info'],
    ['Last successful query', 'Today at 14:31', 'healthy'],
    ['Failed queries today', '2', 'warning'],
  ],
  importMetrics: [
    ['Pharmacy CSV import status', 'Healthy', 'healthy'],
    ['Medicine CSV import status', 'Warning', 'warning'],
    ['Last import time', 'Today at 13:48', 'info'],
    ['Failed rows', '6', 'warning'],
    ['Duplicate records', '14', 'warning'],
    ['Validation errors', '3', 'warning'],
  ],
  jobs: [
    ['Pharmacy sync', 'Healthy', '14:20', '38 sec', '2,418 records synced', 'healthy'],
    ['Medicine sync', 'Warning', '13:48', '1 min 12 sec', 'Completed with 7 validation warnings', 'warning'],
    ['Database backup', 'Healthy', '02:00', '4 min 18 sec', 'Backup stored successfully', 'healthy'],
    ['Notification dispatch', 'Healthy', '14:25', '16 sec', '128 notifications delivered', 'healthy'],
    ['Log cleanup', 'Healthy', '03:15', '54 sec', 'Expired logs removed', 'healthy'],
  ],
  logs: [
    ['2026-05-20 14:27:12', 'Warning', 'Medicine Import', '7 rows failed validation because required code_pct values were missing.'],
    ['2026-05-20 14:24:08', 'Info', 'Notification Service', 'Daily admin digest queued for delivery.'],
    ['2026-05-20 14:18:44', 'Warning', 'Chatbot API', 'Response latency exceeded 350 ms threshold for 3 consecutive checks.'],
    ['2026-05-20 13:59:21', 'Error', 'CSV Import', 'Duplicate pharmacy rows skipped during latest upload.'],
    ['2026-05-20 13:42:03', 'Info', 'Database', 'Connection pool recycled successfully.'],
  ],
  charts: fallbackCharts,
  chatbot: {
    status: 'warning',
    url: 'http://localhost:8001',
    ready: true,
    model: 'paraphrase-multilingual-mpnet-base-v2',
    collection: 'firstaid_chunks',
    chunks: 4128,
    healthLatencyMs: 42,
    readyLatencyMs: 68,
    answerLatencyMs: 412,
    answerConfidence: 0.62,
    answerMode: 'normal',
    lastChecked: '14:32',
    lastError: null,
    metrics: [
      ['Service status', 'Warning', 'warning'],
      ['Ready', 'Yes', 'healthy'],
      ['RAG model', 'paraphrase-multilingual-mpnet-base-v2', 'info'],
      ['Collection', 'firstaid_chunks', 'info'],
      ['Indexed chunks', '4,128', 'info'],
      ['Health probe latency', '42 ms', 'healthy'],
      ['Ready probe latency', '68 ms', 'healthy'],
      ['Answer probe latency', '412 ms', 'warning'],
      ['Probe confidence', '62%', 'healthy'],
    ],
    endpoints: [
      ['GET', '/health', 200, '42 ms', 'healthy', '14:32'],
      ['GET', '/ready', 200, '68 ms', 'healthy', '14:32'],
      ['POST', '/answer', 200, '412 ms', 'warning', '14:32'],
    ],
    kpi: {
      label: 'Chatbot Latency',
      value: '412 ms',
      helper: '4,128 chunks indexed',
      icon: 'Bot',
      status: 'warning',
    },
  },
};

const normalizeChartData = (payloadCharts = {}) => ({
  latencyTrend: Array.isArray(payloadCharts.latencyTrend) ? payloadCharts.latencyTrend : fallbackCharts.latencyTrend,
  errorRateTrend: Array.isArray(payloadCharts.errorRateTrend) ? payloadCharts.errorRateTrend : fallbackCharts.errorRateTrend,
  requestVolume: Array.isArray(payloadCharts.requestVolume) ? payloadCharts.requestVolume : fallbackCharts.requestVolume,
  endpointLatency: Array.isArray(payloadCharts.endpointLatency) ? payloadCharts.endpointLatency : fallbackCharts.endpointLatency,
});

const normalizeChatbotData = (payload) => {
  if (!payload || typeof payload !== 'object') return fallbackHealthData.chatbot;
  const fb = fallbackHealthData.chatbot;
  return {
    status: payload.status || fb.status,
    url: payload.url || fb.url,
    ready: typeof payload.ready === 'boolean' ? payload.ready : fb.ready,
    model: payload.model ?? fb.model,
    collection: payload.collection ?? fb.collection,
    chunks: typeof payload.chunks === 'number' ? payload.chunks : fb.chunks,
    healthLatencyMs: payload.healthLatencyMs ?? null,
    readyLatencyMs: payload.readyLatencyMs ?? null,
    answerLatencyMs: payload.answerLatencyMs ?? null,
    answerConfidence: typeof payload.answerConfidence === 'number' ? payload.answerConfidence : null,
    answerMode: payload.answerMode ?? null,
    lastChecked: payload.lastChecked || fb.lastChecked,
    lastError: payload.lastError ?? null,
    metrics: Array.isArray(payload.metrics) && payload.metrics.length ? payload.metrics : fb.metrics,
    endpoints: Array.isArray(payload.endpoints) && payload.endpoints.length ? payload.endpoints : fb.endpoints,
    kpi: payload.kpi || fb.kpi,
  };
};

const normalizeHealthData = (payload = {}) => ({
  kpis: Array.isArray(payload.kpis) && payload.kpis.length ? payload.kpis : fallbackHealthData.kpis,
  services: Array.isArray(payload.services) && payload.services.length ? payload.services : fallbackHealthData.services,
  endpoints: Array.isArray(payload.endpoints) && payload.endpoints.length ? payload.endpoints : fallbackHealthData.endpoints,
  databaseMetrics:
    Array.isArray(payload.databaseMetrics) && payload.databaseMetrics.length
      ? payload.databaseMetrics
      : fallbackHealthData.databaseMetrics,
  importMetrics:
    Array.isArray(payload.importMetrics) && payload.importMetrics.length
      ? payload.importMetrics
      : fallbackHealthData.importMetrics,
  jobs: Array.isArray(payload.jobs) && payload.jobs.length ? payload.jobs : fallbackHealthData.jobs,
  logs: Array.isArray(payload.logs) && payload.logs.length ? payload.logs : fallbackHealthData.logs,
  charts: normalizeChartData(payload.charts),
  chatbot: normalizeChatbotData(payload.chatbot),
});

const getStatus = (status) => statusConfig[status] || statusConfig.info;

const getIcon = (icon) => {
  if (typeof icon === 'function') return icon;
  return iconMap[icon] || Activity;
};

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  const match = String(value || '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const StatusBadge = ({ status, label }) => {
  const config = getStatus(status);

  return (
    <Badge variant={config.badge} className="whitespace-nowrap">
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {label || config.label}
    </Badge>
  );
};

const SectionCard = ({ title, description, icon: Icon, children, className = '' }) => (
  <section className={`bento-card p-5 ${className}`}>
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {Icon ? (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </div>
    {children}
  </section>
);

const ChartCard = ({ title, description, children, className = '' }) => (
  <section className={`bento-card p-5 ${className}`}>
    <div className="mb-5">
      <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

const ChartEmptyState = ({ title, description }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-[10px] border border-dashed border-border bg-surface-muted/40 p-4">
    <EmptyState icon={Info} title={title} description={description} className="w-full max-w-md" />
  </div>
);

const ProgressMetric = ({ label, value, helper, status = 'healthy' }) => {
  const config = getStatus(status);
  const width = clamp(value);

  return (
    <div className="rounded-[10px] border border-border bg-surface-elevated/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className={`text-sm font-bold ${config.text}`}>{Math.round(width)}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-strong">
        <div className={`h-full rounded-full ${config.dot}`} style={{ width: `${width}%` }} />
      </div>
      {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
};

const SystemPulse = ({ status, lastRefresh, score }) => {
  const config = getStatus(status);

  return (
    <section className={`bento-card p-5 ${config.panel}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[12px] bg-surface-elevated">
            <span className={`absolute h-9 w-9 rounded-full ${config.dot} opacity-20 live-dot`} />
            <span className={`relative h-4 w-4 rounded-full ${config.dot}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">System Pulse</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">{config.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{lastRefresh}</p>
          </div>
        </div>
        <div className="min-w-[220px]">
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm font-semibold text-muted-foreground">Overall health score</p>
            <p className="font-display text-3xl font-bold text-foreground">{score}%</p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-strong">
            <div className={`h-full rounded-full ${config.dot}`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
};

const TAB_ITEMS = [
  { value: 'overview', label: 'Overview' },
  { value: 'services', label: 'Services & Endpoints' },
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'data', label: 'Database & Imports' },
  { value: 'jobs', label: 'Jobs & Logs' },
];

const bannerVariants = {
  loading: {
    icon: RefreshCw,
    iconSpin: true,
    title: 'Refreshing live data...',
    classes: 'border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-200',
  },
  fallback: {
    icon: AlertTriangle,
    title: 'Showing demo fallback data',
    classes: 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-200',
  },
  error: {
    icon: XCircle,
    title: 'Latest refresh failed',
    classes: 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-200',
  },
};

const StatusBanner = ({ variant, message, onDismiss }) => {
  const config = bannerVariants[variant];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-[10px] border p-4 text-sm shadow-soft ${config.classes}`} role="status">
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.iconSpin ? 'animate-spin' : ''}`} />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{config.title}</p>
        {message ? <p className="mt-1 leading-6 opacity-90">{message}</p> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold underline-offset-2 hover:underline"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
};

const LiveChip = ({ refreshing, secondsUntilNext, paused, onToggle }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/85 px-3 py-1.5 text-xs shadow-soft">
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full rounded-full ${paused ? 'bg-muted-foreground/50' : 'bg-emerald-500'} ${paused ? '' : 'opacity-60 animate-ping'}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${paused ? 'bg-muted-foreground/60' : 'bg-emerald-500'}`} />
    </span>
    <span className="font-semibold text-foreground">
      {paused ? 'Auto-refresh paused' : refreshing ? 'Updating...' : `Live · next in ${secondsUntilNext}s`}
    </span>
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label={paused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
    >
      {paused ? 'Resume' : 'Pause'}
    </button>
  </div>
);

const KpiSkeleton = () => (
  <div className="bento-card p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-10 w-10 rounded-[10px]" />
    </div>
    <Skeleton className="mt-3 h-3 w-40" />
  </div>
);

const PulseSkeleton = () => (
  <section className="bento-card p-5">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-[12px]" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="min-w-[220px] space-y-3">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    </div>
  </section>
);

const EmergencyPage = () => {
  const [healthData, setHealthData] = useState(fallbackHealthData);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastError, setLastError] = useState('');
  const [lastRefresh, setLastRefresh] = useState('Not refreshed yet');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [endpointQuery, setEndpointQuery] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [secondsUntilNext, setSecondsUntilNext] = useState(POLL_INTERVAL_MS / 1000);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);
  const mountedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const requestInFlightRef = useRef(false);

  const fetchHealthData = useCallback(async ({ background = false } = {}) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const initialLoad = !background && !hasLoadedRef.current;
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get('/api/admin/system-health');
      if (!mountedRef.current) return;

      setHealthData(normalizeHealthData(response.data));
      setUsingFallback(false);
      setLastError('');
      setDismissedError(false);
      setLastRefresh(formatRefreshTime());
      setSecondsUntilNext(POLL_INTERVAL_MS / 1000);
      hasLoadedRef.current = true;
    } catch (error) {
      if (!mountedRef.current) return;

      const detail = error?.response?.data?.detail || error?.message || 'Backend health endpoint unavailable.';
      if (hasLoadedRef.current) {
        const failedAt = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastError(`Refresh failed at ${failedAt}: ${detail}`);
      } else {
        setHealthData(fallbackHealthData);
        setUsingFallback(true);
        setLastError(`Showing demo fallback data because live health data could not be loaded. ${detail}`);
        setLastRefresh(formatRefreshTime());
        hasLoadedRef.current = true;
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      requestInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchHealthData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchHealthData]);

  useEffect(() => {
    if (autoRefreshPaused) return undefined;
    const intervalId = window.setInterval(() => {
      setSecondsUntilNext((prev) => {
        if (prev <= 1) {
          fetchHealthData({ background: true });
          return POLL_INTERVAL_MS / 1000;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [autoRefreshPaused, fetchHealthData]);

  const handleExportReport = useCallback(() => {
    try {
      const snapshot = {
        exportedAt: new Date().toISOString(),
        lastRefresh,
        usingFallback,
        healthScore: undefined,
        healthData,
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `monitoring-report-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      // ignore export failure
    }
  }, [healthData, lastRefresh, usingFallback]);

  const handleViewLogs = useCallback(() => {
    setActiveTab('jobs');
    window.requestAnimationFrame(() => {
      const el = document.getElementById('monitoring-logs');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const { kpis, services, endpoints, databaseMetrics, importMetrics, jobs, logs, charts, chatbot } = healthData;

  const serviceDistribution = useMemo(() => {
    const counts = services.reduce(
      (acc, service) => {
        acc[service.status] = (acc[service.status] || 0) + 1;
        return acc;
      },
      { healthy: 0, warning: 0, down: 0 }
    );

    return [
      { name: 'Healthy', value: counts.healthy || 0, status: 'healthy' },
      { name: 'Warning', value: counts.warning || 0, status: 'warning' },
      { name: 'Down', value: counts.down || 0, status: 'down' },
    ].filter((item) => item.value > 0);
  }, [services]);

  const uptimeValue = parseNumber(kpis.find((item) => item.label === 'Uptime')?.value || 99.97);
  const errorRateValue = parseNumber(kpis.find((item) => item.label === 'Error Rate')?.value || 0.18);
  const databaseQuality = clamp(100 - parseNumber(databaseMetrics.find((item) => item[0] === 'Query response time')?.[1]) / 4);
  const failedRows = parseNumber(importMetrics.find((item) => item[0] === 'Failed rows')?.[1]);
  const importSuccessRate = clamp(100 - failedRows);
  const serviceHealthScore = useMemo(() => {
    if (!services.length) return 0;

    const score = services.reduce((total, service) => {
      if (service.status === 'healthy') return total + 100;
      if (service.status === 'warning') return total + 82;
      if (service.status === 'down') return total + 38;
      return total + 90;
    }, 0);

    return score / services.length;
  }, [services]);

  const errorRateScore = clamp(100 - errorRateValue * 60);

  const healthScore = useMemo(() => {
    const combinedScore = (
      serviceHealthScore * 0.35
      + uptimeValue * 0.2
      + errorRateScore * 0.15
      + databaseQuality * 0.15
      + importSuccessRate * 0.15
    );

    return Math.round(combinedScore);
  }, [databaseQuality, errorRateScore, importSuccessRate, serviceHealthScore, uptimeValue]);

  const overallStatus = useMemo(() => {
    if (healthScore >= 90) return 'healthy';
    if (healthScore >= 75) return 'warning';
    return 'down';
  }, [healthScore]);
  const hasLatencyTrend = charts.latencyTrend.length > 0;
  const hasServiceDistribution = serviceDistribution.length > 0;
  const hasErrorTrend = charts.errorRateTrend.length > 0;
  const hasRequestVolume = charts.requestVolume.length > 0;
  const hasEndpointLatency = charts.endpointLatency.length > 0;

  const filteredEndpoints = useMemo(() => {
    const q = endpointQuery.trim().toLowerCase();
    if (!q) return endpoints;
    return endpoints.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(q))
    );
  }, [endpoints, endpointQuery]);

  const filteredLogs = useMemo(() => {
    if (logLevelFilter === 'all') return logs;
    return logs.filter(([, level]) => String(level).toLowerCase() === logLevelFilter);
  }, [logs, logLevelFilter]);

  const logLevelCounts = useMemo(() => {
    const counts = { all: logs.length, error: 0, warning: 0, info: 0 };
    logs.forEach(([, level]) => {
      const key = String(level).toLowerCase();
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return counts;
  }, [logs]);

  const bannerVariant = loading && !hasLoadedRef.current
    ? 'loading'
    : lastError && !dismissedError
      ? (usingFallback ? 'fallback' : 'error')
      : null;

  const showSkeleton = loading && !hasLoadedRef.current;

  return (
    <div className="page-shell">
      <div className="page-content gap-6">
        <SectionHeader
          eyebrow="Platform Operations"
          title="Monitoring Center"
          description="Monitor API status, database connectivity, service availability, background jobs, and import reliability."
          actions={
            <>
              <Button onClick={() => fetchHealthData({ background: true })} disabled={loading || refreshing}>
                <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
                {loading || refreshing ? 'Checking...' : 'Run health check'}
              </Button>
              <Button variant="secondary" onClick={handleViewLogs}>
                <FileSearch className="h-4 w-4" />
                View logs
              </Button>
              <Button variant="secondary" onClick={handleExportReport}>
                <ArrowDownToLine className="h-4 w-4" />
                Export report
              </Button>
            </>
          }
        />

        <div className="sticky top-0 z-10 -mx-2 flex flex-col gap-3 rounded-[12px] border border-border bg-surface/80 px-2 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/65 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={activeTab} onChange={setActiveTab} items={TAB_ITEMS} className="flex-wrap" />
          <LiveChip
            refreshing={refreshing}
            secondsUntilNext={secondsUntilNext}
            paused={autoRefreshPaused}
            onToggle={() => setAutoRefreshPaused((p) => !p)}
          />
        </div>

        {bannerVariant ? (
          <StatusBanner
            variant={bannerVariant}
            message={bannerVariant === 'loading' ? 'Hitting /api/admin/system-health...' : lastError}
            onDismiss={bannerVariant === 'loading' ? undefined : () => setDismissedError(true)}
          />
        ) : null}

        {activeTab === 'overview' ? (
          showSkeleton ? <PulseSkeleton /> : <SystemPulse status={overallStatus} lastRefresh={lastRefresh} score={healthScore} />
        ) : null}

        {activeTab === 'overview' && showSkeleton ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, idx) => <KpiSkeleton key={idx} />)}
          </div>
        ) : null}

        {activeTab === 'overview' && !showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map(({ label, value, helper, icon, status }) => {
            const config = getStatus(status);
            const Icon = getIcon(icon);

            return (
              <div key={label} className={`bento-card p-5 ${config.panel}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                    <p className="metric-value mt-3 font-display text-2xl font-bold text-foreground">{value}</p>
                  </div>
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-surface-elevated ${config.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
              </div>
            );
          })}
        </div>
        ) : null}

        {activeTab === 'overview' && !showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ProgressMetric label="Uptime" value={clamp(uptimeValue)} helper="Availability target tracking" status="healthy" />
          <ProgressMetric
            label="Error rate"
            value={clamp(errorRateValue)}
            helper="Lower is better"
            status={errorRateValue > 5 ? 'warning' : 'healthy'}
          />
          <ProgressMetric
            label="Database response quality"
            value={Math.round(databaseQuality)}
            helper="Derived from query latency"
            status={databaseQuality < 75 ? 'warning' : 'healthy'}
          />
          <ProgressMetric
            label="Import success rate"
            value={Math.round(importSuccessRate)}
            helper="Based on failed CSV rows"
            status={importSuccessRate < 90 ? 'warning' : 'healthy'}
          />
        </div>
        ) : null}

        {activeTab === 'overview' && !showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartCard title="API Latency Trend" description="Latency in milliseconds across the last 12 checks." className="xl:col-span-2">
            {hasLatencyTrend ? (
              <div className="h-56 min-w-0">
                <AdminLineChart
                  labels={charts.latencyTrend.map((c) => c.check)}
                  datasets={[
                    { label: 'Backend API', data: charts.latencyTrend.map((c) => c.backend), borderColor: chartColors.backend, backgroundColor: chartColors.backend, fill: false, tension: 0.2 },
                    { label: 'Chatbot API', data: charts.latencyTrend.map((c) => c.chatbot), borderColor: chartColors.chatbot, backgroundColor: chartColors.chatbot, fill: false, tension: 0.2 },
                    { label: 'Mobile API', data: charts.latencyTrend.map((c) => c.mobile), borderColor: chartColors.mobile, backgroundColor: chartColors.mobile, fill: false, tension: 0.2 },
                  ]}
                  height={220}
                  options={{ plugins: { legend: { position: 'top' } }, scales: { y: { title: { display: true, text: 'ms' } } } }}
                />
              </div>
            ) : (
              <ChartEmptyState title="No latency data" description="The monitoring endpoint returned no latency trend yet." />
            )}
          </ChartCard>

          <ChartCard title="Service Status Distribution" description="Current service status split.">
            {hasServiceDistribution ? (
              <div className="h-56 min-w-0 flex items-center justify-center">
                <AdminDoughnutChart
                  labels={serviceDistribution.map((s) => s.name)}
                  dataValues={serviceDistribution.map((s) => s.value)}
                  backgroundColors={serviceDistribution.map((s) => getStatus(s.status).chart)}
                  height={220}
                />
              </div>
            ) : (
              <ChartEmptyState title="No service data" description="Service status data is not available for this refresh." />
            )}
          </ChartCard>
        </div>
        ) : null}

        {activeTab === 'overview' && !showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard title="Error Rate Trend" description="Percentage of failed requests over time.">
            {hasErrorTrend ? (
              <div className="h-56 min-w-0">
                <AdminLineChart
                  labels={charts.errorRateTrend.map((c) => c.time)}
                  datasets={[{ label: 'Error rate', data: charts.errorRateTrend.map((c) => c.rate * 100), borderColor: chartColors.error, backgroundColor: chartColors.error, fill: true, tension: 0.2 }]}
                  height={220}
                  options={{ scales: { y: { ticks: { callback: (v) => `${v}%` } } } }}
                />
              </div>
            ) : (
              <ChartEmptyState title="No error-rate data" description="No recent error-rate samples were returned." />
            )}
          </ChartCard>

          <ChartCard title="Request Volume" description="Requests per hour for the last 12 hours.">
            {hasRequestVolume ? (
              <div className="h-56 min-w-0">
                <AdminBarChart
                  labels={charts.requestVolume.map((r) => r.hour)}
                  datasets={[{ label: 'Requests', data: charts.requestVolume.map((r) => r.requests), backgroundColor: chartColors.volume }]}
                  height={220}
                />
              </div>
            ) : (
              <ChartEmptyState title="No request-volume data" description="No traffic samples were returned for this refresh." />
            )}
          </ChartCard>
        </div>
        ) : null}

        {activeTab === 'overview' && !showSkeleton ? (
        <ChartCard title="Endpoint Latency Comparison" description="Horizontal comparison of key endpoint latency.">
          {hasEndpointLatency ? (
            <div className="h-56 min-w-0">
              <AdminBarChart
                labels={charts.endpointLatency.map((e) => e.endpoint)}
                datasets={[{ label: 'Latency', data: charts.endpointLatency.map((e) => e.latency), backgroundColor: chartColors.mobile }]}
                height={220}
                horizontal={true}
              />
            </div>
          ) : (
            <ChartEmptyState title="No endpoint latency data" description="The endpoint comparison chart is empty for this refresh." />
          )}
        </ChartCard>
        ) : null}

        {activeTab === 'services' ? (
        <SectionCard
          title="Service Health"
          description="Live-style service cards using real backend checks where available, with safe demo fallback data."
          icon={Activity}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map(({ name, icon, status, responseTime, lastChecked, description }) => {
              const config = getStatus(status);
              const Icon = getIcon(icon);

              return (
                <article key={name} className={`rounded-[10px] border p-4 ${config.panel}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-surface-elevated text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground">{name}</h3>
                        <p className="text-xs text-muted-foreground">Checked {lastChecked}</p>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-[10px] bg-surface-elevated/70 p-3">
                    <div>
                      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Response</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{responseTime}</p>
                    </div>
                    <div>
                      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Last checked</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{lastChecked}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
        ) : null}

        {activeTab === 'services' ? (
        <SectionCard
          title="Endpoint Monitoring"
          description="Representative API probes for authentication, pharmacy data, medicines, chatbot, and CSV uploads."
          icon={Server}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <FileSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={endpointQuery}
                onChange={(e) => setEndpointQuery(e.target.value)}
                placeholder="Search method, path, or status..."
                className="pl-9"
                aria-label="Search endpoints"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredEndpoints.length}</span> of {endpoints.length} probes
            </p>
          </div>
          {filteredEndpoints.length === 0 ? (
            <EmptyState
              icon={Info}
              title="No matching endpoints"
              description="Try a different search term, or clear the filter to see all probes."
              actionLabel="Clear filter"
              onAction={() => setEndpointQuery('')}
            />
          ) : (
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-surface-muted">
                  <tr>
                    {['Method', 'Endpoint', 'Status code', 'Latency', 'Status', 'Last checked'].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface-elevated/70">
                  {filteredEndpoints.map(([method, endpoint, statusCode, latency, status, checked]) => (
                    <tr key={`${method}-${endpoint}`} className="transition-colors hover:bg-surface-muted/70">
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-[6px] border px-2 py-1 text-xs font-bold ${methodStyles[method]}`}>
                          {method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded-[4px] bg-surface-muted px-2 py-1 text-xs text-foreground">{endpoint}</code>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{statusCode}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{latency}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{checked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
        ) : null}

        {activeTab === 'chatbot' ? (
        <SectionCard
          title="Chatbot Monitoring"
          description="Live probes of the First-Aid RAG service (sentence-transformers + ChromaDB) backing the mobile assistant."
          icon={Bot}
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <article className={`bento-card p-5 xl:col-span-4 ${getStatus(chatbot.status).panel}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">First-Aid RAG</p>
                  <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                    {chatbot.ready ? 'Ready' : 'Not ready'}
                  </h3>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{chatbot.url}</p>
                </div>
                <StatusBadge status={chatbot.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[10px] border border-border bg-surface-elevated/70 p-3">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Answer latency</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {chatbot.answerLatencyMs ? `${chatbot.answerLatencyMs} ms` : 'Skipped'}
                  </p>
                </div>
                <div className="rounded-[10px] border border-border bg-surface-elevated/70 p-3">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Confidence</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {typeof chatbot.answerConfidence === 'number'
                      ? `${Math.round(chatbot.answerConfidence * 100)}%`
                      : '-'}
                  </p>
                </div>
                <div className="rounded-[10px] border border-border bg-surface-elevated/70 p-3">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Indexed chunks</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {typeof chatbot.chunks === 'number' ? chatbot.chunks.toLocaleString() : '-'}
                  </p>
                </div>
                <div className="rounded-[10px] border border-border bg-surface-elevated/70 p-3">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Last checked</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{chatbot.lastChecked || '-'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-[10px] border border-border bg-surface-elevated/70 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  <span className="truncate" title={chatbot.model || ''}>
                    {chatbot.model || 'Model unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="truncate" title={chatbot.collection || ''}>
                    {chatbot.collection || 'Collection unknown'}
                  </span>
                </div>
                {chatbot.answerMode ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>Answer mode: {chatbot.answerMode}</span>
                  </div>
                ) : null}
                {chatbot.lastError ? (
                  <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{chatbot.lastError}</span>
                  </div>
                ) : null}
              </div>
            </article>

            <div className="xl:col-span-8">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {chatbot.metrics.map(([label, value, status]) => (
                  <div key={label} className="rounded-[10px] border border-border bg-surface-elevated/75 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                      <StatusBadge status={status} label="" />
                    </div>
                    <p className="mt-3 truncate font-display text-lg font-bold text-foreground" title={String(value)}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 overflow-x-auto rounded-[10px] border border-border">
                <table className="w-full min-w-[560px] text-left">
                  <thead className="bg-surface-muted">
                    <tr>
                      {['Method', 'Endpoint', 'Status code', 'Latency', 'Status', 'Last checked'].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface-elevated/70">
                    {chatbot.endpoints.map(([method, endpoint, statusCode, latency, status, checked]) => (
                      <tr key={`chatbot-${method}-${endpoint}`} className="transition-colors hover:bg-surface-muted/70">
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-[6px] border px-2 py-1 text-xs font-bold ${methodStyles[method] || methodStyles.GET}`}>
                            {method}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded-[4px] bg-surface-muted px-2 py-1 text-xs text-foreground">{endpoint}</code>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{statusCode}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{latency}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{checked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SectionCard>
        ) : null}

        {activeTab === 'data' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SectionCard
            title="Database Health"
            description="Connectivity, query timing, table volume, and query failure indicators."
            icon={Database}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {databaseMetrics.map(([label, value, status]) => (
                <div key={label} className="rounded-[10px] border border-border bg-surface-elevated/75 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                    <StatusBadge status={status} label="" />
                  </div>
                  <p className="mt-3 font-display text-xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Import / Sync Health"
            description="CSV reliability signals for pharmacy and medicine imports."
            icon={UploadCloud}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {importMetrics.map(([label, value, status]) => (
                <div key={label} className="rounded-[10px] border border-border bg-surface-elevated/75 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                    <StatusBadge status={status} label="" />
                  </div>
                  <p className="mt-3 font-display text-xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
        ) : null}

        {activeTab === 'jobs' ? (
        <SectionCard
          title="Background Jobs"
          description="Operational jobs that keep pharmacy data, medicine data, backups, notifications, and logs current."
          icon={ListChecks}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            {jobs.map(([name, statusLabel, lastRun, duration, result, status]) => (
              <article key={name} className="rounded-[10px] border border-border bg-surface-elevated/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">{name}</h3>
                  <StatusBadge status={status} label={statusLabel} />
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Last run</p>
                    <p className="mt-1 font-semibold text-foreground">{lastRun}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Duration</p>
                    <p className="mt-1 font-semibold text-foreground">{duration}</p>
                  </div>
                  <p className="leading-5 text-muted-foreground">{result}</p>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
        ) : null}

        {activeTab === 'jobs' ? (
        <SectionCard
          title="Recent System Logs"
          description="Latest error, warning, and info events across core services."
          icon={HardDrive}
        >
          <div id="monitoring-logs" className="mb-4 flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: `All (${logLevelCounts.all})`, status: 'info' },
              { key: 'error', label: `Errors (${logLevelCounts.error})`, status: 'down' },
              { key: 'warning', label: `Warnings (${logLevelCounts.warning})`, status: 'warning' },
              { key: 'info', label: `Info (${logLevelCounts.info})`, status: 'info' },
            ].map(({ key, label, status }) => {
              const active = logLevelFilter === key;
              const config = getStatus(status);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLogLevelFilter(key)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? `${config.panel} ${config.text} border-transparent`
                      : 'border-border bg-surface-elevated/70 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                  {label}
                </button>
              );
            })}
          </div>
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={Info}
              title="No matching log entries"
              description="No events recorded for this level. Try switching to All."
              actionLabel="Show all"
              onAction={() => setLogLevelFilter('all')}
            />
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(([timestamp, level, service, message]) => {
                const status = level === 'Error' ? 'down' : level === 'Warning' ? 'warning' : 'info';
                const Icon = level === 'Error' ? XCircle : level === 'Warning' ? AlertTriangle : Info;

                return (
                  <div key={`${timestamp}-${service}-${message}`} className="flex flex-col gap-3 rounded-[10px] border border-border bg-surface-elevated/75 p-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${getStatus(status).panel} ${getStatus(status).text}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={status} label={level} />
                          <p className="text-sm font-bold text-foreground">{service}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
                      </div>
                    </div>
                    <p className="whitespace-nowrap text-xs font-semibold text-muted-foreground">{timestamp}</p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
        ) : null}
      </div>
    </div>
  );
};

export default EmergencyPage;
