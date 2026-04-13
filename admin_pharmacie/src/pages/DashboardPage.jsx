import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/common/IconHelper';
import api from '../lib/api';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [pharmacies, setPharmacies] = useState([]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [countResponse, pharmaciesResponse] = await Promise.all([
          api.get('/api/admin/pharmacies/count'),
          api.get('/api/admin/pharmacies', {
            params: { skip: 0, limit: 8 },
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
            'Failed to load dashboard data from the backend.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const pharmaciesWithPhone = pharmacies.filter((item) => item.phone).length;
  const pharmaciesWithAddress = pharmacies.filter((item) => item.address).length;
  const governorates = new Set(pharmacies.map((item) => item.governorate).filter(Boolean)).size;

  const stats = [
    {
      label: 'Total Pharmacies',
      value: total,
      description: 'Current records in the backend registry',
      tone: 'blue',
      icon: 'pharmacies',
    },
    {
      label: 'Visible Recent Rows',
      value: pharmacies.length,
      description: 'Newest rows loaded into this dashboard',
      tone: 'emerald',
      icon: 'activity',
    },
    {
      label: 'With Phone',
      value: pharmaciesWithPhone,
      description: 'Recent records that include phone data',
      tone: 'amber',
      icon: 'phone',
    },
    {
      label: 'Governorates',
      value: governorates,
      description: 'Recent records grouped by governorate',
      tone: 'slate',
      icon: 'location',
    },
  ];

  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300">
              <Icon name="dashboard" size={14} />
              Live Admin
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              The old mock dashboard has been replaced with a backend-driven overview using the admin
              pharmacy endpoints already present in the API.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/upload-pharmacies"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
            >
              <Icon name="upload" size={16} />
              Upload Pharmacies
            </Link>
            <Link
              to="/upload-garde"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              <Icon name="calendar" size={16} />
              Upload Garde
            </Link>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </section>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${toneClasses[stat.tone]}`}>
                  <Icon name={stat.icon} size={20} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{stat.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Pharmacies</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Newest entries returned by <code>/api/admin/pharmacies</code>.
                </p>
              </div>
              <Link to="/pharmacies" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Governorate</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Phone</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-400">Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacies.length ? (
                    pharmacies.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name || 'Unnamed pharmacy'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.governorate || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.phone || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {item.latitude}, {item.longitude}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-6 text-slate-600 dark:text-slate-400" colSpan={4}>
                        {loading ? 'Loading recent records...' : 'No pharmacy records found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload readiness</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Address coverage</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {loading ? '...' : `${pharmaciesWithAddress}/${pharmacies.length || 0}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Recent rows with an address value available.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Next action</p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                    Use Upload Pharmacies for real imports and Upload Garde for CSV validation.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Current scope</p>
              <h2 className="mt-3 text-2xl font-bold">Admin flows restored</h2>
              <p className="mt-3 text-sm text-slate-300">
                Pharmacy upload is fully connected to the backend. Garde upload is restored as a UI
                validation flow pending a backend endpoint.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
