import React, { useRef, useState } from 'react';
import { Icon } from '../components/common/IconHelper';
import api from '../lib/api';

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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              <Icon name="upload" size={14} />
              Pharmacy Upload
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
              Upload Pharmacies
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              This page is wired to the real backend endpoint at <code>/api/admin/upload</code>.
              Upload a CSV file with pharmacy records and review validation errors directly here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <Icon name="upload" size={16} />
            Choose CSV
          </button>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
              className={`flex min-h-[280px] w-full flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-blue-500 dark:hover:bg-blue-950/10'
              }`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Icon name="upload" size={28} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Drag and drop your CSV file
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Required columns: <code>name</code>, <code>latitude</code>, <code>longitude</code>.
                Optional aliases like <code>lat</code>, <code>lon</code>, <code>address</code>, and <code>phone</code> are supported by the backend.
              </p>
            </button>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Selected File
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </p>
                  {selectedFile && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-white dark:text-slate-900 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  <Icon name={isUploading ? 'loading' : 'tick'} size={16} className={isUploading ? 'animate-spin' : ''} />
                  {isUploading ? 'Uploading...' : 'Start Upload'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Backend rules</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>Only CSV files are accepted at the moment.</p>
              <p>Maximum upload size: 5 MB.</p>
              <p>Maximum rows per upload: 5,000.</p>
              <p>Authenticated admin access is required.</p>
            </div>

            {result && (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Rows</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{result.total_rows}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Accepted</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{result.successful}</p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/20">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-700 dark:text-red-300">Failed</p>
                    <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">{result.failed}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Validation errors</h3>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {result.errors?.length ? (
                      result.errors.map((item, index) => (
                        <div
                          key={`${item.row_number}-${index}`}
                          className="border-b border-slate-200 px-4 py-3 text-sm last:border-b-0 dark:border-slate-800"
                        >
                          <p className="font-medium text-slate-900 dark:text-white">Row {item.row_number}</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-400">{item.error_message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-slate-600 dark:text-slate-400">
                        No validation errors were returned.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UploadPharmaciesPage;
