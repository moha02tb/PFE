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
import { useLanguage } from '../context/LanguageContext';

const UploadPharmaciesPage = () => {
  const { t } = useLanguage();
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
      setError(t('uploadPharmacies.csvOnlyError'));
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('uploadPharmacies.chooseFileError'));
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
          t('uploadPharmacies.uploadFailed')
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('uploadPharmacies.eyebrow')}
          title={t('uploadPharmacies.title')}
          description={t('uploadPharmacies.description')}
          actions={
            <>
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                <FileSpreadsheet className="h-4 w-4" />
                {t('upload.chooseFile')}
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                <UploadCloud className="h-4 w-4" />
                {isUploading ? t('upload.uploading') : t('uploadPharmacies.startUpload')}
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
                data-dragging={isDragging}
                className={`upload-zone flex min-h-[300px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed px-8 text-center ${
                  isDragging
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-muted'
                }`}
              >
                <div className="mb-5 rounded-[8px] bg-primary-soft p-4 text-primary">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-foreground">{t('uploadPharmacies.dropTitle')}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  {t('uploadPharmacies.requiredColumns')} <code>name</code>, <code>latitude</code>, <code>longitude</code>.
                  {' '}{t('uploadPharmacies.optionalAliases')} <code>lat</code>, <code>lon</code>, <code>address</code>, {t('upload.and')} <code>phone</code>.
                </p>
              </button>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedFile ? selectedFile.name : t('upload.noFileSelected')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : t('upload.sizeLimit')}
                  </p>
                </div>
                {selectedFile ? <Badge variant="primary">{t('upload.readyToUpload')}</Badge> : <Badge>{t('upload.waitingForFile')}</Badge>}
              </div>

              {error ? (
                <div className="mt-5 rounded-[8px] border border-border bg-surface-muted p-4 text-sm text-foreground">{error}</div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('upload.policyTitle')}</CardTitle>
                  <CardDescription>{t('uploadPharmacies.policyDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-[8px] border border-border/45 bg-surface-muted p-4">{t('upload.csvOnly')}</div>
                <div className="rounded-[8px] border border-border/45 bg-surface-muted p-4">{t('upload.maxSize')}</div>
                <div className="rounded-[8px] border border-border/45 bg-surface-muted p-4">{t('upload.maxRows')}</div>
                <div className="rounded-[8px] border border-border/45 bg-surface-muted p-4">{t('upload.adminRequired')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('upload.importResult')}</CardTitle>
                  <CardDescription>{t('uploadPharmacies.importResultDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[6px] bg-surface-muted p-4">
                        <p className="text-sm text-muted-foreground">{t('upload.rows')}</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-foreground">{result.total_rows}</p>
                      </div>
                      <div className="rounded-[6px] bg-surface-muted p-4">
                        <p className="text-sm text-foreground">{t('upload.accepted')}</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-foreground">{result.successful}</p>
                      </div>
                      <div className="rounded-[6px] bg-surface-muted p-4">
                        <p className="text-sm text-foreground">{t('upload.failed')}</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-foreground">{result.failed}</p>
                      </div>
                    </div>

                    <div className="rounded-[6px] border border-border">
                      <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">{t('upload.validationErrors')}</div>
                      <div className="max-h-80 overflow-auto">
                        {result.errors?.length ? (
                          result.errors.map((item, index) => (
                            <div key={`${item.row_number}-${index}`} className="border-b border-border px-4 py-3 last:border-b-0">
                              <p className="text-sm font-medium text-foreground">{t('upload.row', { number: item.row_number })}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{item.error_message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8">
                            <EmptyState
                              icon={AlertCircle}
                              title={t('upload.noValidationErrors')}
                              description={t('uploadPharmacies.noValidationErrorsDesc')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={FileSpreadsheet}
                    title={t('upload.noResultTitle')}
                    description={t('uploadPharmacies.noResultDesc')}
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
