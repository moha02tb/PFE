import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinned, Search, Upload } from 'lucide-react';
import api from '../lib/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
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
} from '../components/ui';

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
          api.get('/api/admin/pharmacies', { params: { skip, limit: PAGE_SIZE } }),
        ]);

        if (!active) return;

        setTotal(countResponse.data?.total || 0);
        setPharmacies(Array.isArray(pharmaciesResponse.data) ? pharmaciesResponse.data : []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || err.message || 'Failed to load the pharmacy registry.');
      } finally {
        if (active) setLoading(false);
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
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow="Registry"
          title="Pharmacy registry"
          description="Search, filter, and review live pharmacy records from the admin API with cleaner table density and more readable metadata."
          actions={
            <>
              <Button variant="secondary" asChild>
                <Link to="/map">
                  <MapPinned className="h-4 w-4" />
                  Open map
                </Link>
              </Button>
              <Button asChild>
                <Link to="/upload-pharmacies">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </Link>
              </Button>
            </>
          }
        />

        {error ? (
          <Card className="border-danger/30 bg-danger-soft">
            <CardContent className="p-4 text-sm text-danger">{error}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1.4fr_0.8fr_0.5fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, address, phone, governorate"
                className="pl-9"
              />
            </div>
            <Select value={governorate} onChange={(event) => setGovernorate(event.target.value)}>
              <option value="all">All governorates</option>
              {governorates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <div className="flex items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-muted-foreground">
              {loading ? 'Loading...' : `${total} records`}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <div>
              <CardTitle>Directory table</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Page batch filtered locally by search and governorate.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {filteredPharmacies.length ? (
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Address</TableHeaderCell>
                    <TableHeaderCell>Phone</TableHeaderCell>
                    <TableHeaderCell>Governorate</TableHeaderCell>
                    <TableHeaderCell>Coordinates</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {filteredPharmacies.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-foreground">
                        <div>
                          <p className="font-medium text-foreground">{item.name || 'Unnamed pharmacy'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">#{item.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.address || '-'}</TableCell>
                      <TableCell>{item.phone || '-'}</TableCell>
                      <TableCell>
                        {item.governorate ? <Badge variant="primary">{item.governorate}</Badge> : '-'}
                      </TableCell>
                      <TableCell>
                        {typeof item.latitude === 'number' && typeof item.longitude === 'number'
                          ? `${item.latitude}, ${item.longitude}`
                          : 'Missing'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={MapPinned}
                  title={loading ? 'Loading pharmacies' : 'No matching pharmacies'}
                  description={
                    loading
                      ? 'Fetching the registry from the admin API.'
                      : 'No pharmacies in the current page batch match your filters.'
                  }
                />
              </div>
            )}
          </CardContent>
          <div className="flex flex-col gap-4 border-t border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPharmacies.length} visible rows in the current page batch.
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PharmaciesPage;
