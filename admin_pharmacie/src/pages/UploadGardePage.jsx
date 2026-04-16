import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/ui';

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
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
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
      setError('Use a CSV file for garde uploads.');
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
      setError('Choose a garde CSV before uploading.');
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
          'Garde upload failed. Check the CSV columns and admin session.'
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
          eyebrow="Planner import"
          title="Upload garde planning"
          description="Validate canonical and planner-format CSV files before pushing garde rows into the live scheduling backend."
          actions={
            <>
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                <FileSpreadsheet className="h-4 w-4" />
                Choose CSV
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                <UploadCloud className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload garde'}
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
                className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-8 text-center transition hover:border-primary/40 hover:bg-surface-muted"
              >
                <div className="mb-5 rounded-3xl bg-warning-soft p-4 text-warning">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-foreground">Load a garde CSV</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Required canonical columns: <code>date</code>, <code>pharmacy_name</code>, <code>start_time</code>, <code>end_time</code>.
                  Planner format is also accepted with <code>Category</code>, <code>Month/Holiday</code>, <code>Date</code>, <code>Pharmacist_1</code>, and <code>Pharmacist_2</code>.
                </p>
              </button>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-sm text-muted-foreground">Selected file</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{selectedFile ? selectedFile.name : 'No file selected'}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-sm text-muted-foreground">Preview rows</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-foreground">{rows.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-sm text-muted-foreground">Detected format</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {canonicalReady ? 'Canonical' : plannerReady ? 'Planner' : headers.length ? 'Incomplete' : 'Waiting for file'}
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</div>
              ) : null}

              {result ? (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-surface-muted p-4">
                    <p className="text-sm text-muted-foreground">Rows</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-foreground">{result.total_rows}</p>
                  </div>
                  <div className="rounded-2xl bg-success-soft p-4">
                    <p className="text-sm text-success">Saved</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-success">{result.successful}</p>
                  </div>
                  <div className="rounded-2xl bg-danger-soft p-4">
                    <p className="text-sm text-danger">Failed</p>
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
                  <CardTitle>Validation summary</CardTitle>
                  <CardDescription>Column readiness before upload.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {REQUIRED_COLUMNS.map((column) => {
                  const present = plannerReady || headers.includes(column);
                  return (
                    <div key={column} className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
                      <span className="text-sm text-foreground">{column}</span>
                      <Badge variant={present ? 'success' : 'warning'}>{present ? 'Ready' : 'Missing'}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Recent garde rows</CardTitle>
                  <CardDescription>Latest entries returned from the scheduling API.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {recentGardes.length ? (
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Pharmacy</TableHeaderCell>
                        <TableHeaderCell>Shift</TableHeaderCell>
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
                    title={loadingRecent ? 'Loading garde rows' : 'No garde rows yet'}
                    description={
                      loadingRecent
                        ? 'Fetching recent saved rows from the backend.'
                        : 'Upload a garde file to populate recent scheduling activity.'
                    }
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
