import React, { useRef, useState } from 'react';
import { Icon } from '../components/common/IconHelper';

const REQUIRED_COLUMNS = ['date', 'pharmacy_name', 'start_time', 'end_time'];

const parseCsv = (content) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

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

const UploadGardePage = () => {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    setError('');
    setHeaders([]);
    setRows([]);

    if (!file) {
      setFileName('');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileName('');
      setError('Use CSV for garde import preview. There is no backend garde upload endpoint yet.');
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);

    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
  };

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              <Icon name="calendar" size={14} />
              Garde Upload
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
              Upload Garde Planning
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              The current backend has no garde upload API. This page restores the missing UI flow by
              validating and previewing garde CSV files in the admin panel, so the schedule format is ready
              when the backend endpoint is added.
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            <Icon name="upload" size={16} />
            Choose Garde CSV
          </button>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
              className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-amber-400 hover:bg-amber-50/50 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-amber-500 dark:hover:bg-amber-950/10"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <Icon name="calendar" size={28} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Load a garde CSV for validation
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Expected columns: <code>date</code>, <code>pharmacy_name</code>, <code>start_time</code>,
                <code>end_time</code>. Optional fields like <code>city</code> or <code>governorate</code> can be included too.
              </p>
            </button>

            {fileName && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Loaded file
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{fileName}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{rows.length} garde rows detected</p>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Validation summary</h2>
            <div className="mt-6 space-y-3">
              {REQUIRED_COLUMNS.map((column) => {
                const present = headers.includes(column);
                return (
                  <div
                    key={column}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${
                      present
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300'
                    }`}
                  >
                    <span className="font-medium">{column}</span>
                    <span>{present ? 'present' : 'missing'}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              {headers.length
                ? missingColumns.length
                  ? `This file is not ready yet. Missing required columns: ${missingColumns.join(', ')}.`
                  : 'This garde file structure is ready for backend integration.'
                : 'Load a CSV file to validate garde columns and preview schedule rows.'}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preview</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                First imported garde rows from the selected CSV file.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Row</th>
                  {headers.map((header) => (
                    <th key={header} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.slice(0, 20).map((row) => (
                    <tr key={row.__row} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.__row}</td>
                      {headers.map((header) => (
                        <td key={`${row.__row}-${header}`} className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-slate-600 dark:text-slate-400" colSpan={Math.max(headers.length + 1, 2)}>
                      No garde data loaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UploadGardePage;
