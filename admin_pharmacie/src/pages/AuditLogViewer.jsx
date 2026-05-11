import { useCallback, useEffect, useState } from 'react';
import { Calendar, FileText, AlertCircle, Check } from 'lucide-react';
import api from '../lib/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Pagination,
  SectionHeader,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  EmptyState,
} from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const PAGE_SIZE = 50;

const ACTION_COLORS = {
  admin_created: 'primary',
  admin_updated: 'secondary',
  admin_deleted: 'danger',
  user_registered: 'primary',
  user_login: 'secondary',
  user_login_failed: 'danger',
  admin_login: 'secondary',
  admin_login_failed: 'danger',
  password_changed: 'secondary',
  account_deactivated: 'warning',
  account_reactivated: 'secondary',
};

const AuditLogViewer = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const skip = (page - 1) * PAGE_SIZE;
      const params = new URLSearchParams({
        skip,
        limit: PAGE_SIZE,
      });

      if (actionFilter) params.append('action_type', actionFilter);
      if (entityFilter) params.append('entity_type', entityFilter);

      const [countResponse, logsResponse] = await Promise.all([
        api.get('/api/admin/audit-logs/count'),
        api.get(`/api/admin/audit-logs?${params}`),
      ]);

      setTotal(countResponse.data?.total || 0);
      setLogs(Array.isArray(logsResponse.data) ? logsResponse.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || t('audit.failedLoadLogs'));
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, t]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const getActionLabel = (action) => {
    const key = `audit.action${action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/ /g, '')}`;
    return t(key) || action;
  };

  const getDetailsSummary = (log) => {
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      if (!details) return null;
      
      // Show assistant-specific details
      if (log.action === 'admin_created' && details.role === 'assistant') {
        return `Created assistant for region: ${details.region_scope}`;
      }
      if (log.action === 'admin_updated' && details.role === 'assistant') {
        return `Updated assistant: ${details.changed_fields?.join(', ') || 'unknown changes'}`;
      }
      if (log.action === 'admin_deleted' && details.role === 'assistant') {
        return `Deleted assistant from region: ${details.region_scope}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const parseDetails = (detailsJson) => {
    try {
      return typeof detailsJson === 'string' ? JSON.parse(detailsJson) : detailsJson;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <SectionHeader
        title={t('audit.auditLogs')}
        description={t('audit.auditLogsDesc')}
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>{t('audit.filters')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">{t('audit.allActions')}</option>
              <option value="admin_created">{t('audit.actionAdminCreated')}</option>
              <option value="admin_updated">{t('audit.actionAdminUpdated')}</option>
              <option value="admin_deleted">{t('audit.actionAdminDeleted')}</option>
              <option value="user_login">{t('audit.actionUserLogin')}</option>
              <option value="password_changed">{t('audit.actionPasswordChanged')}</option>
            </Select>

            <Select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}>
              <option value="">{t('audit.allEntities')}</option>
              <option value="administrateur">{t('audit.entityAdmin')}</option>
              <option value="utilisateur">{t('audit.entityUser')}</option>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder={t('audit.dateFrom')}
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder={t('audit.dateTo')}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-border bg-surface-muted mb-4">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>{t('audit.activityLog')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length ? (
            <>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>{t('audit.action')}</TableHeaderCell>
                    <TableHeaderCell>{t('audit.entity')}</TableHeaderCell>
                    <TableHeaderCell>{t('audit.details')}</TableHeaderCell>
                    <TableHeaderCell>{t('audit.actor')}</TableHeaderCell>
                    <TableHeaderCell>{t('audit.status')}</TableHeaderCell>
                    <TableHeaderCell>{t('audit.timestamp')}</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={ACTION_COLORS[log.action] || 'secondary'}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {log.entity_type} #{log.entity_id}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">
                          {getDetailsSummary(log) || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {log.actor_type && log.actor_id ? `${log.actor_type} #${log.actor_id}` : '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.status === 'success' ? 'secondary' : log.status === 'failed' ? 'danger' : 'warning'}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-border px-6 py-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                  onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
                />
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title={loading ? t('audit.loadingLogs') : t('audit.noLogs')}
                description={
                  loading
                    ? t('audit.fetchingLogs')
                    : t('audit.noLogsDesc')
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogViewer;
