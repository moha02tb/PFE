import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Plus, Search, Trash2, Check, AlertCircle } from 'lucide-react';
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

const PharmacyManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [governorate, setGovernorate] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    governorate: '',
    latitude: '',
    longitude: '',
    osm_type: 'node',
    osm_id: '',
  });

  useEffect(() => {
    loadPharmacies();
  }, [page]);

  const loadPharmacies = async () => {
    setLoading(true);
    setError('');

    try {
      const skip = (page - 1) * PAGE_SIZE;
      const [countResponse, pharmaciesResponse] = await Promise.all([
        api.get('/api/admin/pharmacies/count'),
        api.get('/api/admin/pharmacies', { params: { skip, limit: PAGE_SIZE } }),
      ]);

      setTotal(countResponse.data?.total || 0);
      setPharmacies(Array.isArray(pharmaciesResponse.data) ? pharmaciesResponse.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load pharmacies.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      governorate: '',
      latitude: '',
      longitude: '',
      osm_type: 'node',
      osm_id: '',
    });
    setModalMode('create');
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (pharmacy) => {
    setFormData({
      name: pharmacy.name || '',
      address: pharmacy.address || '',
      phone: pharmacy.phone || '',
      governorate: pharmacy.governorate || '',
      latitude: pharmacy.latitude || '',
      longitude: pharmacy.longitude || '',
      osm_type: pharmacy.osm_type || 'node',
      osm_id: pharmacy.osm_id || '',
    });
    setModalMode('edit');
    setEditingId(pharmacy.id);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Pharmacy name is required');
      return false;
    }
    if (!formData.latitude || isNaN(parseFloat(formData.latitude))) {
      setError('Valid latitude is required');
      return false;
    }
    if (!formData.longitude || isNaN(parseFloat(formData.longitude))) {
      setError('Valid longitude is required');
      return false;
    }
    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);
    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return false;
    }
    if (lon < -180 || lon > 180) {
      setError('Longitude must be between -180 and 180');
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
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        governorate: formData.governorate || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        osm_type: formData.osm_type || 'node',
        osm_id: formData.osm_id ? parseInt(formData.osm_id) : null,
      };

      if (modalMode === 'create') {
        await api.post('/api/admin/pharmacies', payload);
        setSuccess('Pharmacy created successfully!');
      } else {
        await api.put(`/api/admin/pharmacies/${editingId}`, payload);
        setSuccess('Pharmacy updated successfully!');
      }

      setShowModal(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        governorate: '',
        latitude: '',
        longitude: '',
        osm_type: 'node',
        osm_id: '',
      });

      // Reload pharmacies
      await loadPharmacies();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pharmacyId) => {
    if (!window.confirm('Are you sure you want to delete this pharmacy?')) return;

    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/admin/pharmacies/${pharmacyId}`);
      setSuccess('Pharmacy deleted successfully!');
      await loadPharmacies();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete pharmacy');
    }
  };

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
          eyebrow="Management"
          title="Pharmacy Management"
          description="Create, edit, and delete pharmacy records. Manage the complete pharmacy registry for your system."
          actions={
            <>
              <Button variant="secondary" asChild>
                <Link to="/pharmacies">
                  <Search className="h-4 w-4" />
                  View Registry
                </Link>
              </Button>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Add Pharmacy
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
                placeholder="Search by name, address, phone"
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
              <CardTitle>Pharmacy Records</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Manage and update pharmacy information.</p>
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
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {filteredPharmacies.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-foreground">
                        <div>
                          <p className="font-medium text-foreground">{item.name || 'Unnamed'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">#{item.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.address || '-'}</TableCell>
                      <TableCell>{item.phone || '-'}</TableCell>
                      <TableCell>
                        {item.governorate ? <Badge variant="primary">{item.governorate}</Badge> : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {typeof item.latitude === 'number' && typeof item.longitude === 'number'
                          ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                          : 'Missing'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(item)}
                            title="Edit pharmacy"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Delete pharmacy"
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
                  icon={Search}
                  title={loading ? 'Loading pharmacies' : 'No pharmacies found'}
                  description={
                    loading
                      ? 'Fetching pharmacy data from the admin API.'
                      : 'No pharmacies match your filters. Try adjusting your search.'
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

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'create' ? 'Create Pharmacy' : 'Edit Pharmacy'}
        description={modalMode === 'create' ? 'Add a new pharmacy to the registry' : 'Update pharmacy information'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Pharmacy Name <span className="text-danger">*</span>
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Enter pharmacy name"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-foreground">Address</label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              placeholder="Enter street address"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground">Phone</label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="Enter phone number"
            />
          </div>

          {/* Governorate */}
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

          {/* Latitude and Longitude */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Latitude <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleFormChange}
                placeholder="-90 to 90"
                step="0.0001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Longitude <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleFormChange}
                placeholder="-180 to 180"
                step="0.0001"
                required
              />
            </div>
          </div>

          {/* OSM Type and ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">OSM Type</label>
              <Select name="osm_type" value={formData.osm_type} onChange={handleFormChange}>
                <option value="node">Node</option>
                <option value="way">Way</option>
                <option value="relation">Relation</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">OSM ID</label>
              <Input
                type="number"
                name="osm_id"
                value={formData.osm_id}
                onChange={handleFormChange}
                placeholder="OpenStreetMap ID"
              />
            </div>
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

export default PharmacyManagementPage;
