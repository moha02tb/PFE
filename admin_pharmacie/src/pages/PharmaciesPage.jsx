import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/common/IconHelper';
import api from '../lib/api';

const PAGE_SIZE = 20;

const PharmaciesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [governorate, setGovernorate] = useState('all');

  useEffect(() => {
    let active = true;

    const loadPharmacies = async () => {
      setLoading(true);
      setError('');

      try {
        const skip = (page - 1) * PAGE_SIZE;
        const [countResponse, pharmaciesResponse] = await Promise.all([
          api.get('/api/admin/pharmacies/count'),
          api.get('/api/admin/pharmacies', {
            params: { skip, limit: PAGE_SIZE },
          }),
        ]);

        if (!active) {
          return;
        }

        setTotal(countResponse.data?.total || 0);
        setPharmacies(Array.isArray(pharmaciesResponse.data) ? pharmaciesResponse.data : []);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err.response?.data?.detail ||
            err.message ||
            'Failed to load the pharmacy registry.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPharmacies();

    return () => {
      active = false;
    };
  }, [page]);

  const governorates = Array.from(new Set(pharmacies.map((item) => item.governorate).filter(Boolean)));

  const filteredPharmacies = pharmacies.filter((item) => {
    const matchesSearch =
      !search ||
      [item.name, item.address, item.phone, item.governorate]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()));

    const matchesGovernorate = governorate === 'all' || item.governorate === governorate;

    return matchesSearch && matchesGovernorate;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              <Icon name="pharmacies" size={14} />
              Registry
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
              Pharmacies
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              Real admin registry backed by <code>/api/admin/pharmacies</code> instead of the old static mock list.
            </p>
          </div>
          <Link
            to="/upload-pharmacies"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <Icon name="upload" size={16} />
            Import New CSV
          </Link>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </section>
        )}

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.4fr_0.7fr_0.7fr] dark:border-slate-800 dark:bg-slate-900">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Search
            </span>
            <div className="relative">
              <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, address, phone, governorate"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Governorate
            </span>
            <select
              value={governorate}
              onChange={(event) => setGovernorate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="all">All governorates</option>
              {governorates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Total Records
            </span>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {loading ? 'Loading...' : total}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Address</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Phone</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Governorate</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {filteredPharmacies.length ? (
                  filteredPharmacies.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name || 'Unnamed pharmacy'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.address || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.phone || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.governorate || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {item.latitude}, {item.longitude}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-6 text-slate-600 dark:text-slate-400" colSpan={5}>
                      {loading ? 'Loading pharmacies...' : 'No pharmacies match the current filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages} with {filteredPharmacies.length} visible rows in the current batch.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <Icon name="navigate_before" size={16} />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                Next
                <Icon name="navigate_next" size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PharmaciesPage;
