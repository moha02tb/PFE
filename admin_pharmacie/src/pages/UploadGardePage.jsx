import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react';
import api from '../lib/api';
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
import { useLanguage } from '../context/LanguageContext';

const REQUIRED_COLUMNS = ['date', 'pharmacy_name', 'start_time', 'end_time'];
const PLANNER_COLUMNS = ['Category', 'Month/Holiday', 'Date', 'Pharmacist_1', 'Pharmacist_2'];

const parseCsv = (content) => {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((item) => item.trim());
  const rows = lines.slice(1).map((line, rowIndex) => {
    const values = line.split(',').map((item) => item.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    row.__row = rowIndex + 2;
    return row;
  });
  return { headers, rows };
};

const hasCanonicalFormat = (headers) => REQUIRED_COLUMNS.every((column) => headers.includes(column));
const hasPlannerFormat = (headers) =>
  PLANNER_COLUMNS.every((column) => headers.some((header) => header.toLowerCase() === column.toLowerCase()));

const UploadGardePage = () => {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recentGardes, setRecentGardes] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadRecentGardes = async () => {
    setLoadingRecent(true);
    try {
      const response = await api.get('/api/admin/gardes', { params: { skip: 0, limit: 12 } });
      setRecentGardes(Array.isArray(response.data) ? response.data : []);
    } catch (_err) {
      setRecentGardes([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    loadRecentGardes();
  }, []);

  const handleFile = async (file) => {
    setError('');
    setResult(null);
    setHeaders([]);
    setRows([]);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(null);
      setError(t('uploadGarde.csvOnlyError'));
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    setSelectedFile(file);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('uploadGarde.chooseFileError'));
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('fichier', selectedFile);
      const response = await api.post('/api/admin/gardes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      await loadRecentGardes();
    } catch (err) {
      setError(
          err.response?.data?.detail ||
          err.message ||
          t('uploadGarde.uploadFailed')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const canonicalReady = hasCanonicalFormat(headers);
  const plannerReady = hasPlannerFormat(headers);

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('uploadGarde.eyebrow')}
          title={t('uploadGarde.title')}
          description={t('uploadGarde.description')}
          actions={
            <>
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                <FileSpreadsheet className="h-4 w-4" />
                {t('upload.chooseCsv')}
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                <UploadCloud className="h-4 w-4" />
                {isUploading ? t('upload.uploading') : t('uploadGarde.uploadGarde')}
              </Button>
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardContent className="p-6">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  handleFile(event.dataTransfer.files?.[0]);
                }}
                data-dragging={isDragging}
                className={`upload-zone flex min-h-[280px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed px-8 text-center ${
                  isDragging
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-muted'
                }`}
              >
                <div className="mb-5 rounded-[8px] bg-primary-soft p-4 text-primary">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-foreground">{t('uploadGarde.dropTitle')}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t('uploadGarde.requiredCanonical')} <code>date</code>, <code>pharmacy_name</code>, <code>start_time</code>, <code>end_time</code>.
                  {' '}{t('uploadGarde.plannerAccepted')} <code>Category</code>, <code>Month/Holiday</code>, <code>Date</code>, <code>Pharmacist_1</code>, {t('upload.and')} <code>Pharmacist_2</code>.
                </p>
              </button>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[8px] border border-border bg-surface p-4">
                  <p className="text-sm text-muted-foreground">{t('upload.selectedFile')}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{selectedFile ? selectedFile.name : t('upload.noFileSelected')}</p>
                </div>
                <div className="rounded-[8px] border border-border bg-surface p-4">
                  <p className="text-sm text-muted-foreground">{t('uploadGarde.previewRows')}</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-foreground">{rows.length}</p>
                </div>
                <div className="rounded-[8px] border border-border bg-surface p-4">
                  <p className="text-sm text-muted-foreground">{t('uploadGarde.detectedFormat')}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {canonicalReady ? t('uploadGarde.canonical') : plannerReady ? t('uploadGarde.planner') : headers.length ? t('uploadGarde.incomplete') : t('upload.waitingForFile')}
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mt-5 flex items-start gap-3 rounded-[8px] border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {result ? (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[6px] bg-surface-muted p-4">
                    <p className="text-sm text-muted-foreground">{t('upload.rows')}</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-foreground">{result.total_rows}</p>
                  </div>
                  <div className="rounded-[6px] bg-surface-muted p-4">
                    <p className="text-sm text-muted-foreground">{t('upload.saved')}</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-success">{result.successful}</p>
                  </div>
                  <div className="rounded-[6px] bg-surface-muted p-4">
                    <p className="text-sm text-muted-foreground">{t('upload.failed')}</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-danger">{result.failed}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('uploadGarde.validationSummary')}</CardTitle>
                  <CardDescription>{t('uploadGarde.validationSummaryDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {REQUIRED_COLUMNS.map((column) => {
                  const present = plannerReady || headers.includes(column);
                  return (
                    <div key={column} className="flex items-center justify-between rounded-[8px] border border-border/45 bg-surface-muted px-4 py-3">
                      <span className="text-sm text-foreground">{column}</span>
                      <Badge variant={present ? 'success' : 'warning'}>{present ? t('upload.ready') : t('upload.missing')}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('uploadGarde.recentRows')}</CardTitle>
                  <CardDescription>{t('uploadGarde.recentRowsDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingRecent ? (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 4 }, (_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : recentGardes.length ? (
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>{t('management.date')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.pharmacy')}</TableHeaderCell>
                        <TableHeaderCell>{t('calendar.shift')}</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {recentGardes.slice(0, 6).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.date || '-'}</TableCell>
                          <TableCell className="text-foreground">{item.pharmacy_name || '-'}</TableCell>
                          <TableCell>{item.start_time} - {item.end_time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={CheckCircle2}
                    title={t('uploadGarde.noRows')}
                    description={t('uploadGarde.noRowsDesc')}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadGardePage;
