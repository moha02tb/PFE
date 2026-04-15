import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, Pill, UploadCloud } from 'lucide-react';
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

const UploadMedicinesPage = () => {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [recentMedicines, setRecentMedicines] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadRecentMedicines = async () => {
    setLoadingRecent(true);
    try {
      const response = await api.get('/api/admin/medicines', { params: { skip: 0, limit: 8 } });
      setRecentMedicines(Array.isArray(response.data) ? response.data : []);
    } catch (_err) {
      setRecentMedicines([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    loadRecentMedicines();
  }, []);

  const selectFile = (file) => {
    setError('');
    setResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(null);
      setError('Only CSV files are supported for medicine imports.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Choose a medicine CSV before uploading.');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('fichier', selectedFile);
      const response = await api.post('/api/admin/medicines/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      await loadRecentMedicines();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Medicine upload failed. Check that you are logged in and the CSV columns are valid.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow="Medicine import"
          title="Upload medicines"
          description="Import medicine catalog CSV files, upsert rows by code_pct, and review validation output before exposing the catalog to mobile users."
          actions={
            <>
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                <FileSpreadsheet className="h-4 w-4" />
                Choose CSV
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                <UploadCloud className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload medicines'}
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
                onChange={(event) => selectFile(event.target.files?.[0])}
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
                  selectFile(event.dataTransfer.files?.[0]);
                }}
                className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-3xl border border-dashed px-8 text-center transition ${
                  isDragging
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-muted'
                }`}
              >
                <div className="mb-5 rounded-3xl bg-primary-soft p-4 text-primary">
                  <Pill className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-foreground">Drop a medicine CSV here</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Required columns: <code>code_pct</code>, <code>nom_commercial</code>, <code>prix_public_DT</code>, <code>tarif_reference_DT</code>, <code>categorie_remboursement</code>, <code>dci</code>, <code>ap</code>.
                </p>
              </button>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedFile ? selectedFile.name : 'No file selected'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Upload size limit: 5 MB'}
                  </p>
                </div>
                {selectedFile ? <Badge variant="primary">Ready to upload</Badge> : <Badge>Waiting for file</Badge>}
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Upload policy</CardTitle>
                  <CardDescription>Rules enforced by the medicine import API.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl bg-surface-muted p-4">Only CSV files are accepted.</div>
                <div className="rounded-2xl bg-surface-muted p-4">Rows are upserted by code_pct.</div>
                <div className="rounded-2xl bg-surface-muted p-4">Maximum upload size: 5 MB and 5,000 rows.</div>
                <div className="rounded-2xl bg-surface-muted p-4">Duplicate code_pct values in one file keep the last row and return a warning.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Import result</CardTitle>
                  <CardDescription>Live API response after processing the uploaded CSV.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-4">
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
                      <div className="rounded-2xl bg-warning-soft p-4">
                        <p className="text-sm text-warning">Warnings</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-warning">{result.warnings?.length || 0}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border">
                      <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Validation errors</div>
                      <div className="max-h-52 overflow-auto">
                        {result.errors?.length ? (
                          result.errors.map((item, index) => (
                            <div key={`${item.row_number}-${index}`} className="border-b border-border px-4 py-3 last:border-b-0">
                              <p className="text-sm font-medium text-foreground">Row {item.row_number}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{item.error_message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8">
                            <EmptyState
                              icon={AlertTriangle}
                              title="No validation errors"
                              description="The backend accepted the uploaded rows without returning blocking errors."
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border">
                      <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Warnings</div>
                      <div className="max-h-52 overflow-auto">
                        {result.warnings?.length ? (
                          result.warnings.map((item, index) => (
                            <div key={`${item.row_number}-warning-${index}`} className="border-b border-border px-4 py-3 last:border-b-0">
                              <p className="text-sm font-medium text-foreground">Row {item.row_number}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{item.error_message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8">
                            <EmptyState
                              icon={AlertTriangle}
                              title="No warnings"
                              description="No duplicate code_pct rows or non-blocking issues were returned."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={FileSpreadsheet}
                    title="No upload result yet"
                    description="Choose a medicine CSV and run the import to view processing details here."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <div>
              <CardTitle>Recent medicines</CardTitle>
              <CardDescription>Latest medicine rows available from the admin API.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {recentMedicines.length ? (
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Code</TableHeaderCell>
                    <TableHeaderCell>Commercial name</TableHeaderCell>
                    <TableHeaderCell>DCI</TableHeaderCell>
                    <TableHeaderCell>Public price</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {recentMedicines.map((item) => (
                    <TableRow key={item.code_pct}>
                      <TableCell>{item.code_pct}</TableCell>
                      <TableCell className="text-foreground">{item.nom_commercial}</TableCell>
                      <TableCell>{item.dci}</TableCell>
                      <TableCell>{item.prix_public_dt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Pill}
                title={loadingRecent ? 'Loading medicines' : 'No medicines yet'}
                description={
                  loadingRecent
                    ? 'Fetching recent medicine rows from the backend.'
                    : 'Upload a medicine CSV to populate the medicine catalog.'
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadMedicinesPage;
