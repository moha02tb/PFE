import React, { useRef, useState } from 'react';
import { AlertCircle, FileSpreadsheet, UploadCloud } from 'lucide-react';
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
} from '../components/ui';

const UploadPharmaciesPage = () => {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const selectFile = (file) => {
    setError('');
    setResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(null);
      setError('Only CSV files are supported by the current backend upload API.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Choose a CSV file before uploading.');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('fichier', selectedFile);
      const response = await api.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Upload failed. Check that you are logged in as admin and the backend is running.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow="CSV import"
          title="Upload pharmacies"
          description="Send pharmacy CSV files to the live upload endpoint, review validation errors, and keep the import flow consistent with the rest of the admin system."
          actions={
            <>
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                <FileSpreadsheet className="h-4 w-4" />
                Choose file
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                <UploadCloud className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Start upload'}
              </Button>
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-foreground">Drop a pharmacy CSV here</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Required columns: <code>name</code>, <code>latitude</code>, <code>longitude</code>.
                  Optional aliases like <code>lat</code>, <code>lon</code>, <code>address</code>, and <code>phone</code> are supported by the backend.
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
                  <CardDescription>Rules enforced by the current backend import flow.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl bg-surface-muted p-4">Only CSV files are accepted.</div>
                <div className="rounded-2xl bg-surface-muted p-4">Maximum upload size: 5 MB.</div>
                <div className="rounded-2xl bg-surface-muted p-4">Maximum rows per upload: 5,000.</div>
                <div className="rounded-2xl bg-surface-muted p-4">Authenticated admin access is required.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Import result</CardTitle>
                  <CardDescription>Validation and processing summary returned by the API.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-surface-muted p-4">
                        <p className="text-sm text-muted-foreground">Rows</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-foreground">{result.total_rows}</p>
                      </div>
                      <div className="rounded-2xl bg-success-soft p-4">
                        <p className="text-sm text-success">Accepted</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-success">{result.successful}</p>
                      </div>
                      <div className="rounded-2xl bg-danger-soft p-4">
                        <p className="text-sm text-danger">Failed</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-danger">{result.failed}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border">
                      <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Validation errors</div>
                      <div className="max-h-80 overflow-auto">
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
                              icon={AlertCircle}
                              title="No validation errors"
                              description="The backend accepted the uploaded rows without returning validation issues."
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
                    description="Choose a file and run the import to view processing details here."
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

export default UploadPharmaciesPage;
