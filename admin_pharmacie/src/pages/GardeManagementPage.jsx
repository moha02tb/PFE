import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Plus, Search, Trash2, Check, AlertCircle, Calendar } from 'lucide-react';
import api from '../lib/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Modal,
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

const GardeManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gardes, setGardes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    pharmacy_name: '',
    start_time: '',
    end_time: '',
    city: '',
    governorate: '',
    shift_type: '',
    notes: '',
  });

  useEffect(() => {
    loadGardes();
  }, [page]);

  const loadGardes = async () => {
    setLoading(true);
    setError('');

    try {
      const skip = (page - 1) * PAGE_SIZE;
      const [countResponse, gardesResponse] = await Promise.all([
        api.get('/api/admin/gardes/count'),
        api.get('/api/admin/gardes', { params: { skip, limit: PAGE_SIZE } }),
      ]);

      setTotal(countResponse.data?.total || 0);
      setGardes(Array.isArray(gardesResponse.data) ? gardesResponse.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load gardes.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      date: '',
      pharmacy_name: '',
      start_time: '',
      end_time: '',
      city: '',
      governorate: '',
      shift_type: '',
      notes: '',
    });
    setModalMode('create');
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (garde) => {
    setFormData({
      date: garde.date || '',
      pharmacy_name: garde.pharmacy_name || '',
      start_time: garde.start_time || '',
      end_time: garde.end_time || '',
      city: garde.city || '',
      governorate: garde.governorate || '',
      shift_type: garde.shift_type || '',
      notes: garde.notes || '',
    });
    setModalMode('edit');
    setEditingId(garde.id);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.date.trim()) {
      setError('Date is required (YYYY-MM-DD format)');
      return false;
    }
    if (!formData.pharmacy_name.trim()) {
      setError('Pharmacy name is required');
      return false;
    }
    if (!formData.start_time.trim()) {
      setError('Start time is required (HH:MM format)');
      return false;
    }
    if (!formData.end_time.trim()) {
      setError('End time is required (HH:MM format)');
      return false;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.date)) {
      setError('Date must be in YYYY-MM-DD format');
      return false;
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(formData.start_time)) {
      setError('Start time must be in HH:MM format');
      return false;
    }
    if (!timeRegex.test(formData.end_time)) {
      setError('End time must be in HH:MM format');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        date: formData.date,
        pharmacy_name: formData.pharmacy_name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        city: formData.city || null,
        governorate: formData.governorate || null,
        shift_type: formData.shift_type || null,
        notes: formData.notes || null,
      };

      if (modalMode === 'create') {
        await api.post('/api/admin/gardes', payload);
        setSuccess('Garde schedule created successfully!');
      } else {
        await api.put(`/api/admin/gardes/${editingId}`, payload);
        setSuccess('Garde schedule updated successfully!');
      }

      setShowModal(false);
      setFormData({
        date: '',
        pharmacy_name: '',
        start_time: '',
        end_time: '',
        city: '',
        governorate: '',
        shift_type: '',
        notes: '',
      });

      // Reload gardes
      await loadGardes();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (gardeId) => {
    if (!window.confirm('Are you sure you want to delete this garde schedule?')) return;

    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/admin/gardes/${gardeId}`);
      setSuccess('Garde schedule deleted successfully!');
      await loadGardes();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete garde');
    }
  };

  const getMonthFromDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('-').slice(0, 2).join('-');
  };

  const months = Array.from(new Set(gardes.map((g) => getMonthFromDate(g.date)).filter(Boolean)));
  const filteredGardes = gardes.filter((item) => {
    const matchesSearch =
      !search ||
      [item.pharmacy_name, item.city, item.governorate, item.shift_type]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()));
    const matchesMonth =
      filterMonth === 'all' || getMonthFromDate(item.date) === filterMonth;
    return matchesSearch && matchesMonth;
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow="Management"
          title="Garde Schedule Management"
          description="Create, edit, and delete garde schedules. Manage pharmacy on-call schedules and shift planning."
          actions={
            <>
              <Button variant="secondary" asChild>
                <Link to="/upload-gardes">
                  <Calendar className="h-4 w-4" />
                  Upload CSV
                </Link>
              </Button>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </>
          }
        />

        {error ? (
          <Card className="border-danger/30 bg-danger-soft">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-4 w-4 text-danger" />
              <p className="text-sm text-danger">{error}</p>
            </CardContent>
          </Card>
        ) : null}

        {success ? (
          <Card className="border-success/30 bg-success-soft">
            <CardContent className="flex items-center gap-3 p-4">
              <Check className="h-4 w-4 text-success" />
              <p className="text-sm text-success">{success}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1.4fr_0.8fr_0.5fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by pharmacy, city, governorate, shift type"
                className="pl-9"
              />
            </div>
            <Select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)}>
              <option value="all">All months</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
            <div className="flex items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-muted-foreground">
              {loading ? 'Loading...' : `${total} schedules`}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <div>
              <CardTitle>Garde Schedules</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage pharmacy on-call and shift schedules.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {filteredGardes.length ? (
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Pharmacy</TableHeaderCell>
                    <TableHeaderCell>Time</TableHeaderCell>
                    <TableHeaderCell>City</TableHeaderCell>
                    <TableHeaderCell>Shift Type</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {filteredGardes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.date || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{item.pharmacy_name || 'Unknown'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">#{item.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.start_time && item.end_time
                          ? `${item.start_time} - ${item.end_time}`
                          : '-'}
                      </TableCell>
                      <TableCell>{item.city || '-'}</TableCell>
                      <TableCell>
                        {item.shift_type ? (
                          <Badge variant="secondary">{item.shift_type}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(item)}
                            title="Edit schedule"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Delete schedule"
                            className="text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={Calendar}
                  title={loading ? 'Loading schedules' : 'No schedules found'}
                  description={
                    loading
                      ? 'Fetching garde schedule data from the admin API.'
                      : 'No garde schedules match your filters. Try adjusting your search.'
                  }
                />
              </div>
            )}
          </CardContent>
          <div className="flex flex-col gap-4 border-t border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredGardes.length} visible schedules in the current page batch.
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

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'create' ? 'Create Garde Schedule' : 'Edit Garde Schedule'}
        description={
          modalMode === 'create'
            ? 'Add a new pharmacy on-call schedule'
            : 'Update garde schedule information'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Date <span className="text-danger">*</span>
            </label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleFormChange}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">YYYY-MM-DD format</p>
          </div>

          {/* Pharmacy Name */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Pharmacy Name <span className="text-danger">*</span>
            </label>
            <Input
              type="text"
              name="pharmacy_name"
              value={formData.pharmacy_name}
              onChange={handleFormChange}
              placeholder="Enter pharmacy name"
              required
            />
          </div>

          {/* Start and End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Start Time <span className="text-danger">*</span>
              </label>
              <Input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleFormChange}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">HH:MM format</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                End Time <span className="text-danger">*</span>
              </label>
              <Input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleFormChange}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">HH:MM format</p>
            </div>
          </div>

          {/* City and Governorate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">City</label>
              <Input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Governorate</label>
              <Input
                type="text"
                name="governorate"
                value={formData.governorate}
                onChange={handleFormChange}
                placeholder="Enter governorate"
              />
            </div>
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-medium text-foreground">Shift Type</label>
            <Select name="shift_type" value={formData.shift_type} onChange={handleFormChange}>
              <option value="">Select shift type</option>
              <option value="day_shift">Day Shift</option>
              <option value="night_shift">Night Shift</option>
              <option value="full_day">Full Day</option>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground">Notes</label>
            <Input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="Enter additional notes"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GardeManagementPage;
