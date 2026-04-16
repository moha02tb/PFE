/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
  Clock3,
  MapPinned,
  Pill,
  Shield,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import api from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  SectionHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/ui';

const formatNumber = (value) => new Intl.NumberFormat().format(value || 0);
const formatDay = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '-';

const StatCard = ({ title, value, subtitle, icon: Icon, tone = 'primary' }) => (
  <Card className="h-full">
    <CardContent className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`rounded-2xl p-3 ${
            tone === 'success'
              ? 'bg-success-soft text-success'
              : tone === 'warning'
                ? 'bg-warning-soft text-warning'
                : 'bg-primary-soft text-primary'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Bars = ({ items, valueKey }) => {
  const max = Math.max(1, ...items.map((item) => item[valueKey] || 0));
  return (
    <div className="flex h-56 items-end gap-3">
      {items.map((item, index) => {
        const height = Math.max(14, ((item[valueKey] || 0) / max) * 180);
        return (
          <div key={`${index}-${item.day}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-end rounded-2xl bg-surface-muted p-1">
              <div className="w-full rounded-xl bg-primary" style={{ height }} />
            </div>
            <span className="text-xs text-muted-foreground">{formatDay(item.day)}</span>
          </div>
        );
      })}
    </div>
  );
};

const ProgressRow = ({ label, value, total, tone = 'primary' }) => {
  const percent = Math.min(100, total ? Math.round(((value || 0) / total) * 100) : 0);
  const toneClass =
    tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-primary';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-medium text-muted-foreground">
          {formatNumber(value)} ({percent}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-muted">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${percent}%` }} />
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
  const gardeAnalytics = dashboard?.gardes || {};
  const recentRegistrations = useMemo(() => (activity?.user_registrations || []).slice(-7), [activity]);
  const recentLogins = useMemo(() => (activity?.logins || []).slice(-7), [activity]);
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

  return (
    <div className="page-shell">
      <div className="page-content">
        <div className="dashboard-hero overflow-hidden rounded-[32px] border border-white/10 px-6 py-6 shadow-panel sm:px-8 sm:py-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_58%)] lg:block" />
          <div className="relative z-[1] grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <SectionHeader
                eyebrow={t('dashboard.eyebrow')}
                title={t('dashboard.title')}
                description={t('dashboard.description')}
                className="gap-5"
                actions={
                  <>
                    <Button asChild>
                      <Link to="/upload-pharmacies">
                        <Upload className="h-4 w-4" />
                        {t('dashboard.uploadPharmacies')}
                      </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <Link to="/upload-garde">
                        <CalendarDays className="h-4 w-4" />
                        {t('dashboard.uploadGarde')}
                      </Link>
                    </Button>
                  </>
                }
              />

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-white">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-medium">30-day growth</span>
                  </div>
                  <p className="mt-4 font-display text-4xl font-semibold text-white">
                    {loading ? '...' : formatNumber(growth.users_last_30_days)}
                  </p>
                  <p className="mt-2 text-sm text-blue-50/80">New user registrations in the last 30 days.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/20 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-white">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-medium">Auth success</span>
                  </div>
                  <p className="mt-4 font-display text-4xl font-semibold text-white">
                    {loading ? '...' : `${authSuccessRate}%`}
                  </p>
                  <p className="mt-2 text-sm text-blue-50/80">Successful sign-ins across the last 30 days.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Data readiness</span>
                  </div>
                  <p className="mt-4 font-display text-4xl font-semibold text-white">
                    {loading ? '...' : `${coverageAverage}%`}
                  </p>
                  <p className="mt-2 text-sm text-blue-50/80">Average completeness across key pharmacy fields.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/12 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Operational pulse</p>
                    <p className="mt-1 text-sm text-blue-50/80">A quick summary of live platform health.</p>
                  </div>
                  <Badge variant={authSuccessRate >= 85 ? 'success' : 'warning'}>
                    {authSuccessRate >= 85 ? 'Healthy' : 'Needs review'}
                  </Badge>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-950/20 px-4 py-3">
                    <div className="flex items-center gap-3 text-white">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Users</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{loading ? '...' : formatNumber(totals.users)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-950/20 px-4 py-3">
                    <div className="flex items-center gap-3 text-white">
                      <Pill className="h-4 w-4" />
                      <span className="text-sm">Pharmacies</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{loading ? '...' : formatNumber(totals.pharmacies)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-950/20 px-4 py-3">
                    <div className="flex items-center gap-3 text-white">
                      <Clock3 className="h-4 w-4" />
                      <span className="text-sm">Garde rows</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{loading ? '...' : formatNumber(totals.gardes)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <Card className="border-danger/30 bg-danger-soft">
            <CardContent className="p-4 text-sm text-danger">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)
          ) : (
            <>
              <StatCard
                title={t('dashboard.users')}
                value={formatNumber(totals.users)}
                subtitle={t('dashboard.usersSubtitle', { count: formatNumber(growth.users_last_30_days) })}
                icon={Users}
              />
              <StatCard
                title={t('dashboard.admins')}
                value={formatNumber(totals.admins)}
                subtitle={t('dashboard.adminsSubtitle')}
                icon={ShieldCheck}
                tone="success"
              />
              <StatCard
                title={t('dashboard.pharmacyUploads')}
                value={formatNumber(pharmacyAnalytics.bulk_uploads_last_30_days)}
                subtitle={t('dashboard.pharmacyUploadsSubtitle', { count: formatNumber(totals.pharmacies) })}
                icon={Upload}
              />
              <StatCard
                title={t('dashboard.gardeRows')}
                value={formatNumber(totals.gardes)}
                subtitle={t('dashboard.gardeRowsSubtitle', { count: formatNumber(gardeAnalytics.bulk_uploads_last_30_days) })}
                icon={CalendarDays}
                tone="warning"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>{t('dashboard.registrationMomentum')}</CardTitle>
                <CardDescription>{t('dashboard.registrationMomentumDesc')}</CardDescription>
              </div>
              <Badge variant="primary">{t('dashboard.in7Days', { count: formatNumber(growth.users_last_7_days) })}</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 rounded-2xl" />
              ) : recentRegistrations.length ? (
                <Bars items={recentRegistrations} valueKey="count" />
              ) : (
                <EmptyState
                  icon={Activity}
                  title={t('dashboard.noRegistrationData')}
                  description={t('dashboard.noRegistrationDataDesc')}
                />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>{t('dashboard.authHealth')}</CardTitle>
                <CardDescription>{t('dashboard.authHealthDesc')}</CardDescription>
              </div>
              <Badge variant={authSuccessRate >= 85 ? 'success' : 'warning'}>{t('dashboard.authSuccess', { rate: authSuccessRate })}</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-success-soft p-5">
                  <p className="text-sm font-medium text-success">{t('dashboard.successfulLogins')}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-success">
                    {loading ? '...' : formatNumber(auth.login_success_last_30_days)}
                  </p>
                </div>
                <div className="rounded-2xl bg-danger-soft p-5">
                  <p className="text-sm font-medium text-danger">{t('dashboard.failedLogins')}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-danger">
                    {loading ? '...' : formatNumber(auth.login_failed_last_30_days)}
                  </p>
                </div>
              </div>
              <ProgressRow label={t('dashboard.successfulAuthentication')} value={auth.login_success_last_30_days} total={loginTotal30d} tone="success" />
              <ProgressRow label={t('dashboard.failedAuthentication')} value={auth.login_failed_last_30_days} total={loginTotal30d} tone="warning" />
              <div className="rounded-2xl bg-surface-muted p-4 text-sm text-muted-foreground">
                {t('dashboard.recentSeries', {
                  success: formatNumber(recentLogins.reduce((sum, item) => sum + (item.success || 0), 0)),
                  failed: formatNumber(recentLogins.reduce((sum, item) => sum + (item.failed || 0), 0)),
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>{t('dashboard.dataReadiness')}</CardTitle>
                <CardDescription>{t('dashboard.dataReadinessDesc')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ProgressRow label={t('dashboard.mapCoordinates')} value={mapCoverage} total={latestPharmacies.length || 1} />
              <ProgressRow label={t('dashboard.phoneCoverage')} value={phoneCoverage} total={latestPharmacies.length || 1} tone="success" />
              <ProgressRow label={t('dashboard.addressCoverage')} value={addressCoverage} total={latestPharmacies.length || 1} tone="warning" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>{t('dashboard.latestPharmacies')}</CardTitle>
                <CardDescription>{t('dashboard.latestPharmaciesDesc')}</CardDescription>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/pharmacies">
                  {t('common.viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>{t('dashboard.name')}</TableHeaderCell>
                    <TableHeaderCell>{t('dashboard.governorate')}</TableHeaderCell>
                    <TableHeaderCell>{t('dashboard.phone')}</TableHeaderCell>
                    <TableHeaderCell>{t('dashboard.status')}</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {latestPharmacies.length ? (
                    latestPharmacies.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-foreground">
                          <div>
                            <p className="font-medium text-foreground">{item.name || t('dashboard.unnamedPharmacy')}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{item.address || t('dashboard.noAddressAvailable')}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.governorate || '-'}</TableCell>
                        <TableCell>{item.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={typeof item.latitude === 'number' && typeof item.longitude === 'number' ? 'success' : 'warning'}>
                            {typeof item.latitude === 'number' && typeof item.longitude === 'number' ? t('dashboard.mapped') : t('dashboard.missingMapData')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <tr>
                      <TableCell colSpan={4}>{loading ? t('common.loading') : t('dashboard.noPharmacyRecords')}</TableCell>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div>
                <CardTitle>{t('dashboard.topActions')}</CardTitle>
                <CardDescription>{t('dashboard.topActionsDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="secondary" className="justify-between" asChild>
                  <Link to="/pharmacies">
                    <span className="flex items-center gap-2"><Pill className="h-4 w-4" /> {t('dashboard.reviewRegistry')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-between" asChild>
                  <Link to="/map">
                    <span className="flex items-center gap-2"><MapPinned className="h-4 w-4" /> {t('dashboard.validateMap')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-between" asChild>
                  <Link to="/calendar">
                    <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {t('dashboard.inspectCalendar')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
