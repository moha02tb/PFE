import React, { useEffect, useState } from 'react';
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
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const PAGE_SIZE = 20;

const ManagementPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('pharmacies');

  // ========== PHARMACY STATE ==========
  const [pharmacyLoading, setPharmacyLoading] = useState(true);
  const [pharmacyError, setPharmacyError] = useState('');
  const [pharmacySuccess, setPharmacySuccess] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacyTotal, setPharmacyTotal] = useState(0);
  const [pharmacyPage, setPharmacyPage] = useState(1);
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacyGovernorate, setPharmacyGovernorate] = useState('all');
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [pharmacyModalMode, setPharmacyModalMode] = useState('create');
  const [pharmacyEditingId, setPharmacyEditingId] = useState(null);
  const [pharmacySubmitting, setPharmacySubmitting] = useState(false);
  const [pharmacyFormData, setPharmacyFormData] = useState({
    name: '',
    address: '',
    phone: '',
    governorate: '',
    latitude: '',
    longitude: '',
    osm_type: 'node',
    osm_id: '',
  });

  // ========== GARDE STATE ==========
  const [gardeLoading, setGardeLoading] = useState(true);
  const [gardeError, setGardeError] = useState('');
  const [gardeSuccess, setGardeSuccess] = useState('');
  const [gardes, setGardes] = useState([]);
  const [gardeTotal, setGardeTotal] = useState(0);
  const [gardePage, setGardePage] = useState(1);
  const [gardeSearch, setGardeSearch] = useState('');
  const [gardeFilterMonth, setGardeFilterMonth] = useState('all');
  const [showGardeModal, setShowGardeModal] = useState(false);
  const [gardeModalMode, setGardeModalMode] = useState('create');
  const [gardeEditingId, setGardeEditingId] = useState(null);
  const [gardeSubmitting, setGardeSubmitting] = useState(false);
  const [gardeFormData, setGardeFormData] = useState({
    date: '',
    pharmacy_name: '',
    start_time: '',
    end_time: '',
    city: '',
    governorate: '',
    shift_type: '',
    notes: '',
  });

  // Clear messages after timeout
  useEffect(() => {
    if (pharmacySuccess) {
      const timer = setTimeout(() => setPharmacySuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [pharmacySuccess]);

  useEffect(() => {
    if (gardeSuccess) {
      const timer = setTimeout(() => setGardeSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [gardeSuccess]);

  // ========== PHARMACY FUNCTIONS ==========

  useEffect(() => {
    loadPharmacies();
  }, [pharmacyPage]);

  const loadPharmacies = async () => {
    setPharmacyLoading(true);
    setPharmacyError('');

    try {
      const skip = (pharmacyPage - 1) * PAGE_SIZE;
      const [countResponse, pharmaciesResponse] = await Promise.all([
        api.get('/api/admin/pharmacies/count'),
        api.get('/api/admin/pharmacies', { params: { skip, limit: PAGE_SIZE } }),
      ]);

      setPharmacyTotal(countResponse.data?.total || 0);
      setPharmacies(Array.isArray(pharmaciesResponse.data) ? pharmaciesResponse.data : []);
    } catch (err) {
      setPharmacyError(err.response?.data?.detail || err.message || t('management.failedLoadPharmacies'));
    } finally {
      setPharmacyLoading(false);
    }
  };

  const openPharmacyCreateModal = () => {
    setPharmacyFormData({
      name: '',
      address: '',
      phone: '',
      governorate: '',
      latitude: '',
      longitude: '',
      osm_type: 'node',
      osm_id: '',
    });
    setPharmacyModalMode('create');
    setPharmacyEditingId(null);
    setShowPharmacyModal(true);
  };

  const openPharmacyEditModal = (pharmacy) => {
    setPharmacyFormData({
      name: pharmacy.name || '',
      address: pharmacy.address || '',
      phone: pharmacy.phone || '',
      governorate: pharmacy.governorate || '',
      latitude: pharmacy.latitude || '',
      longitude: pharmacy.longitude || '',
      osm_type: pharmacy.osm_type || 'node',
      osm_id: pharmacy.osm_id || '',
    });
    setPharmacyModalMode('edit');
    setPharmacyEditingId(pharmacy.id);
    setShowPharmacyModal(true);
  };

  const handlePharmacyFormChange = (e) => {
    const { name, value } = e.target;
    setPharmacyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePharmacyForm = () => {
    if (!pharmacyFormData.name.trim()) {
      setPharmacyError(t('management.pharmacyNameRequired'));
      return false;
    }
    if (!pharmacyFormData.latitude || isNaN(parseFloat(pharmacyFormData.latitude))) {
      setPharmacyError(t('management.validLatitudeRequired'));
      return false;
    }
    if (!pharmacyFormData.longitude || isNaN(parseFloat(pharmacyFormData.longitude))) {
      setPharmacyError(t('management.validLongitudeRequired'));
      return false;
    }
    const lat = parseFloat(pharmacyFormData.latitude);
    const lon = parseFloat(pharmacyFormData.longitude);
    if (lat < -90 || lat > 90) {
      setPharmacyError(t('management.latitudeRange'));
      return false;
    }
    if (lon < -180 || lon > 180) {
      setPharmacyError(t('management.longitudeRange'));
      return false;
    }
    return true;
  };

  const handlePharmacySubmit = async (e) => {
    e.preventDefault();
    setPharmacyError('');
    setPharmacySuccess('');

    if (!validatePharmacyForm()) return;

    setPharmacySubmitting(true);

    try {
      const payload = {
        name: pharmacyFormData.name,
        address: pharmacyFormData.address || null,
        phone: pharmacyFormData.phone || null,
        governorate: pharmacyFormData.governorate || null,
        latitude: parseFloat(pharmacyFormData.latitude),
        longitude: parseFloat(pharmacyFormData.longitude),
        osm_type: pharmacyFormData.osm_type || 'node',
        osm_id: pharmacyFormData.osm_id ? parseInt(pharmacyFormData.osm_id) : null,
      };

      if (pharmacyModalMode === 'create') {
        await api.post('/api/admin/pharmacies', payload);
        setPharmacySuccess(t('management.pharmacyCreated'));
      } else {
        await api.put(`/api/admin/pharmacies/${pharmacyEditingId}`, payload);
        setPharmacySuccess(t('management.pharmacyUpdated'));
      }

      setShowPharmacyModal(false);
      await loadPharmacies();
    } catch (err) {
      setPharmacyError(err.response?.data?.detail || err.message || t('management.operationFailed'));
    } finally {
      setPharmacySubmitting(false);
    }
  };

  const handlePharmacyDelete = async (pharmacyId) => {
    if (!window.confirm(t('management.confirmDeletePharmacy'))) return;

    setPharmacyError('');
    setPharmacySuccess('');

    try {
      await api.delete(`/api/admin/pharmacies/${pharmacyId}`);
      setPharmacySuccess(t('management.pharmacyDeleted'));
      await loadPharmacies();
    } catch (err) {
      setPharmacyError(err.response?.data?.detail || err.message || t('management.failedDeletePharmacy'));
    }
  };

  const pharmacyGovernorates = Array.from(new Set(pharmacies.map((item) => item.governorate).filter(Boolean)));
  const filteredPharmacies = pharmacies.filter((item) => {
    const matchesSearch =
      !pharmacySearch ||
      [item.name, item.address, item.phone, item.governorate]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(pharmacySearch.toLowerCase()));
    const matchesGovernorate = pharmacyGovernorate === 'all' || item.governorate === pharmacyGovernorate;
    return matchesSearch && matchesGovernorate;
  });
  const pharmacyTotalPages = Math.max(1, Math.ceil(pharmacyTotal / PAGE_SIZE));

  // ========== GARDE FUNCTIONS ==========

  useEffect(() => {
    loadGardes();
  }, [gardePage]);

  const loadGardes = async () => {
    setGardeLoading(true);
    setGardeError('');

    try {
      const skip = (gardePage - 1) * PAGE_SIZE;
      const [countResponse, gardesResponse] = await Promise.all([
        api.get('/api/admin/gardes/count'),
        api.get('/api/admin/gardes', { params: { skip, limit: PAGE_SIZE } }),
      ]);

      setGardeTotal(countResponse.data?.total || 0);
      setGardes(Array.isArray(gardesResponse.data) ? gardesResponse.data : []);
    } catch (err) {
      setGardeError(err.response?.data?.detail || err.message || t('management.failedLoadGardes'));
    } finally {
      setGardeLoading(false);
    }
  };

  const openGardeCreateModal = () => {
    setGardeFormData({
      date: '',
      pharmacy_name: '',
      start_time: '',
      end_time: '',
      city: '',
      governorate: '',
      shift_type: '',
      notes: '',
    });
    setGardeModalMode('create');
    setGardeEditingId(null);
    setShowGardeModal(true);
  };

  const openGardeEditModal = (garde) => {
    setGardeFormData({
      date: garde.date || '',
      pharmacy_name: garde.pharmacy_name || '',
      start_time: garde.start_time || '',
      end_time: garde.end_time || '',
      city: garde.city || '',
      governorate: garde.governorate || '',
      shift_type: garde.shift_type || '',
      notes: garde.notes || '',
    });
    setGardeModalMode('edit');
    setGardeEditingId(garde.id);
    setShowGardeModal(true);
  };

  const handleGardeFormChange = (e) => {
    const { name, value } = e.target;
    setGardeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateGardeForm = () => {
    if (!gardeFormData.date.trim()) {
      setGardeError(t('management.dateRequired'));
      return false;
    }
    if (!gardeFormData.pharmacy_name.trim()) {
      setGardeError(t('management.pharmacyNameRequired'));
      return false;
    }
    if (!gardeFormData.start_time.trim()) {
      setGardeError(t('management.startTimeRequired'));
      return false;
    }
    if (!gardeFormData.end_time.trim()) {
      setGardeError(t('management.endTimeRequired'));
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(gardeFormData.date)) {
      setGardeError(t('management.dateFormat'));
      return false;
    }

    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(gardeFormData.start_time)) {
      setGardeError(t('management.startTimeFormat'));
      return false;
    }
    if (!timeRegex.test(gardeFormData.end_time)) {
      setGardeError(t('management.endTimeFormat'));
      return false;
    }

    return true;
  };

  const handleGardeSubmit = async (e) => {
    e.preventDefault();
    setGardeError('');
    setGardeSuccess('');

    if (!validateGardeForm()) return;

    setGardeSubmitting(true);

    try {
      const payload = {
        date: gardeFormData.date,
        pharmacy_name: gardeFormData.pharmacy_name,
        start_time: gardeFormData.start_time,
        end_time: gardeFormData.end_time,
        city: gardeFormData.city || null,
        governorate: gardeFormData.governorate || null,
        shift_type: gardeFormData.shift_type || null,
        notes: gardeFormData.notes || null,
      };

      if (gardeModalMode === 'create') {
        await api.post('/api/admin/gardes', payload);
        setGardeSuccess(t('management.gardeCreated'));
      } else {
        await api.put(`/api/admin/gardes/${gardeEditingId}`, payload);
        setGardeSuccess(t('management.gardeUpdated'));
      }

      setShowGardeModal(false);
      await loadGardes();
    } catch (err) {
      setGardeError(err.response?.data?.detail || err.message || t('management.operationFailed'));
    } finally {
      setGardeSubmitting(false);
    }
  };

  const handleGardeDelete = async (gardeId) => {
    if (!window.confirm(t('management.confirmDeleteGarde'))) return;

    setGardeError('');
    setGardeSuccess('');

    try {
      await api.delete(`/api/admin/gardes/${gardeId}`);
      setGardeSuccess(t('management.gardeDeleted'));
      await loadGardes();
    } catch (err) {
      setGardeError(err.response?.data?.detail || err.message || t('management.failedDeleteGarde'));
    }
  };

  const getMonthFromDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('-').slice(0, 2).join('-');
  };

  const gardeMonths = Array.from(new Set(gardes.map((g) => getMonthFromDate(g.date)).filter(Boolean)));
  const filteredGardes = gardes.filter((item) => {
    const matchesSearch =
      !gardeSearch ||
      [item.pharmacy_name, item.city, item.governorate, item.shift_type]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(gardeSearch.toLowerCase()));
    const matchesMonth = gardeFilterMonth === 'all' || getMonthFromDate(item.date) === gardeFilterMonth;
    return matchesSearch && matchesMonth;
  });
  const gardeTotalPages = Math.max(1, Math.ceil(gardeTotal / PAGE_SIZE));

  return (
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow={t('management.eyebrow')}
          title={t('management.title')}
          description={t('management.description')}
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { value: 'pharmacies', label: t('management.pharmacies') },
              { value: 'gardes', label: t('management.gardeSchedules') },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <div className="rounded-[8px] border border-border bg-surface-elevated px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{t('management.registryRows')}</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{pharmacyLoading ? '...' : pharmacyTotal}</p>
            </div>
            <div className="rounded-[8px] border border-border bg-surface-elevated px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{t('management.gardeRows')}</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{gardeLoading ? '...' : gardeTotal}</p>
            </div>
          </div>
        </div>

        {/* PHARMACY TAB */}
        {activeTab === 'pharmacies' && (
          <div className="grid gap-4">
            {pharmacyError ? (
              <Card className="border-border bg-surface-muted mb-4">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertCircle className="h-4 w-4 text-foreground" />
                  <p className="text-sm text-foreground">{pharmacyError}</p>
                </CardContent>
              </Card>
            ) : null}

            {pharmacySuccess ? (
              <Card className="border-border bg-surface-muted mb-4">
                <CardContent className="flex items-center gap-3 p-4">
                  <Check className="h-4 w-4 text-foreground" />
                  <p className="text-sm text-foreground">{pharmacySuccess}</p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('management.pharmacies')}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{t('management.managePharmacyRecords')}</p>
                  </div>
                  <Button onClick={openPharmacyCreateModal}>
                    <Plus className="h-4 w-4" />
                    {t('management.addPharmacy')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4 p-5 pb-0 sm:p-6 sm:pb-0">
                  <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.5fr]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={pharmacySearch}
                        onChange={(event) => setPharmacySearch(event.target.value)}
                        placeholder={t('management.searchPharmacyPlaceholder')}
                        className="pl-9"
                      />
                    </div>
                    <Select value={pharmacyGovernorate} onChange={(event) => setPharmacyGovernorate(event.target.value)}>
                      <option value="all">{t('pharmacies.allGovernorates')}</option>
                      {pharmacyGovernorates.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                    <div className="flex items-center rounded-[6px] border border-border bg-surface px-4 text-sm font-medium text-muted-foreground">
                      {pharmacyLoading ? t('common.loading') : t('management.records', { count: pharmacyTotal })}
                    </div>
                  </div>
                </div>

                {filteredPharmacies.length ? (
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>{t('management.name')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.address')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.phone')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.governorate')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.coordinates')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.actions')}</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {filteredPharmacies.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-foreground">
                            <div>
                              <p className="font-medium text-foreground">{item.name || t('management.unnamed')}</p>
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
                              : t('pharmacies.missing')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openPharmacyEditModal(item)}
                                title={t('management.editPharmacy')}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handlePharmacyDelete(item.id)}
                                title={t('management.deletePharmacy')}
                                className="text-foreground hover:bg-surface-strong/10"
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
                      title={pharmacyLoading ? t('pharmacies.loadingPharmacies') : t('management.noPharmaciesFound')}
                      description={
                        pharmacyLoading
                          ? t('management.fetchingPharmacyData')
                          : t('management.noPharmaciesFoundDesc')
                      }
                    />
                  </div>
                )}

                <div className="flex flex-col gap-4 border-t border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t('management.showingVisibleRows', { count: filteredPharmacies.length })}
                  </p>
                  <Pagination
                    page={pharmacyPage}
                    totalPages={pharmacyTotalPages}
                    onPrevious={() => setPharmacyPage((current) => Math.max(1, current - 1))}
                    onNext={() => setPharmacyPage((current) => Math.min(pharmacyTotalPages, current + 1))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* GARDE TAB */}
        {activeTab === 'gardes' && (
          <div className="grid gap-4">
            {gardeError ? (
              <Card className="border-border bg-surface-muted mb-4">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertCircle className="h-4 w-4 text-foreground" />
                  <p className="text-sm text-foreground">{gardeError}</p>
                </CardContent>
              </Card>
            ) : null}

            {gardeSuccess ? (
              <Card className="border-border bg-surface-muted mb-4">
                <CardContent className="flex items-center gap-3 p-4">
                  <Check className="h-4 w-4 text-foreground" />
                  <p className="text-sm text-foreground">{gardeSuccess}</p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('management.gardeSchedules')}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{t('management.manageGardeSchedules')}</p>
                  </div>
                  <Button onClick={openGardeCreateModal}>
                    <Plus className="h-4 w-4" />
                    {t('management.addSchedule')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4 p-5 pb-0 sm:p-6 sm:pb-0">
                  <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.5fr]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={gardeSearch}
                        onChange={(event) => setGardeSearch(event.target.value)}
                        placeholder={t('management.searchGardePlaceholder')}
                        className="pl-9"
                      />
                    </div>
                    <Select value={gardeFilterMonth} onChange={(event) => setGardeFilterMonth(event.target.value)}>
                      <option value="all">{t('management.allMonths')}</option>
                      {gardeMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </Select>
                    <div className="flex items-center rounded-[6px] border border-border bg-surface px-4 text-sm font-medium text-muted-foreground">
                      {gardeLoading ? t('common.loading') : t('management.schedules', { count: gardeTotal })}
                    </div>
                  </div>
                </div>

                {filteredGardes.length ? (
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>{t('management.date')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.pharmacy')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.time')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.city')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.shiftType')}</TableHeaderCell>
                        <TableHeaderCell>{t('management.actions')}</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {filteredGardes.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.date || '-'}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{item.pharmacy_name || t('management.unknown')}</p>
                              <p className="mt-1 text-xs text-muted-foreground">#{item.id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.start_time && item.end_time ? `${item.start_time} - ${item.end_time}` : '-'}
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
                                onClick={() => openGardeEditModal(item)}
                                title={t('management.editSchedule')}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleGardeDelete(item.id)}
                                title={t('management.deleteSchedule')}
                                className="text-foreground hover:bg-surface-strong/10"
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
                      title={gardeLoading ? t('management.loadingSchedules') : t('management.noSchedulesFound')}
                      description={
                        gardeLoading
                          ? t('management.fetchingGardeData')
                          : t('management.noSchedulesFoundDesc')
                      }
                    />
                  </div>
                )}

                <div className="flex flex-col gap-4 border-t border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t('management.showingVisibleSchedules', { count: filteredGardes.length })}
                  </p>
                  <Pagination
                    page={gardePage}
                    totalPages={gardeTotalPages}
                    onPrevious={() => setGardePage((current) => Math.max(1, current - 1))}
                    onNext={() => setGardePage((current) => Math.min(gardeTotalPages, current + 1))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PHARMACY MODAL */}
        <Modal
          open={showPharmacyModal}
          onClose={() => setShowPharmacyModal(false)}
          title={pharmacyModalMode === 'create' ? t('management.createPharmacy') : t('management.editPharmacy')}
          description={pharmacyModalMode === 'create' ? t('management.createPharmacyDesc') : t('management.editPharmacyDesc')}
        >
          <form onSubmit={handlePharmacySubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                {t('management.pharmacyName')} <span className="text-foreground">*</span>
              </label>
              <Input
                type="text"
                name="name"
                value={pharmacyFormData.name}
                onChange={handlePharmacyFormChange}
                placeholder={t('management.enterPharmacyName')}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.address')}</label>
              <Input
                type="text"
                name="address"
                value={pharmacyFormData.address}
                onChange={handlePharmacyFormChange}
                placeholder={t('management.enterStreetAddress')}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.phone')}</label>
              <Input
                type="tel"
                name="phone"
                value={pharmacyFormData.phone}
                onChange={handlePharmacyFormChange}
                placeholder={t('management.enterPhoneNumber')}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.governorate')}</label>
              <Input
                type="text"
                name="governorate"
                value={pharmacyFormData.governorate}
                onChange={handlePharmacyFormChange}
                placeholder={t('management.enterGovernorate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('management.latitude')} <span className="text-foreground">*</span>
                </label>
                <Input
                  type="number"
                  name="latitude"
                  value={pharmacyFormData.latitude}
                  onChange={handlePharmacyFormChange}
                  placeholder="-90 to 90"
                  step="0.0001"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('management.longitude')} <span className="text-foreground">*</span>
                </label>
                <Input
                  type="number"
                  name="longitude"
                  value={pharmacyFormData.longitude}
                  onChange={handlePharmacyFormChange}
                  placeholder="-180 to 180"
                  step="0.0001"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.osmType')}</label>
                <Select name="osm_type" value={pharmacyFormData.osm_type} onChange={handlePharmacyFormChange}>
                  <option value="node">{t('management.node')}</option>
                  <option value="way">{t('management.way')}</option>
                  <option value="relation">{t('management.relation')}</option>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.osmId')}</label>
                <Input
                  type="number"
                  name="osm_id"
                  value={pharmacyFormData.osm_id}
                  onChange={handlePharmacyFormChange}
                  placeholder={t('management.openStreetMapId')}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPharmacyModal(false)}
                disabled={pharmacySubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={pharmacySubmitting}>
                {pharmacySubmitting ? t('management.saving') : pharmacyModalMode === 'create' ? t('management.create') : t('management.update')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* GARDE MODAL */}
        <Modal
          open={showGardeModal}
          onClose={() => setShowGardeModal(false)}
          title={gardeModalMode === 'create' ? t('management.createGardeSchedule') : t('management.editGardeSchedule')}
          description={
            gardeModalMode === 'create'
              ? t('management.createGardeScheduleDesc')
              : t('management.editGardeScheduleDesc')
          }
        >
          <form onSubmit={handleGardeSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                {t('management.date')} <span className="text-foreground">*</span>
              </label>
              <Input
                type="date"
                name="date"
                value={gardeFormData.date}
                onChange={handleGardeFormChange}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                {t('management.pharmacyName')} <span className="text-foreground">*</span>
              </label>
              <Input
                type="text"
                name="pharmacy_name"
                value={gardeFormData.pharmacy_name}
                onChange={handleGardeFormChange}
                placeholder={t('management.enterPharmacyName')}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('management.startTime')} <span className="text-foreground">*</span>
                </label>
                <Input
                  type="time"
                  name="start_time"
                  value={gardeFormData.start_time}
                  onChange={handleGardeFormChange}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('management.endTime')} <span className="text-foreground">*</span>
                </label>
                <Input
                  type="time"
                  name="end_time"
                  value={gardeFormData.end_time}
                  onChange={handleGardeFormChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.city')}</label>
                <Input
                  type="text"
                  name="city"
                  value={gardeFormData.city}
                  onChange={handleGardeFormChange}
                  placeholder={t('management.enterCity')}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.governorate')}</label>
                <Input
                  type="text"
                  name="governorate"
                  value={gardeFormData.governorate}
                  onChange={handleGardeFormChange}
                  placeholder={t('management.enterGovernorate')}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.shiftType')}</label>
              <Select name="shift_type" value={gardeFormData.shift_type} onChange={handleGardeFormChange}>
                <option value="">{t('management.selectShiftType')}</option>
                <option value="day_shift">{t('management.dayShift')}</option>
                <option value="night_shift">{t('management.nightShift')}</option>
                <option value="full_day">{t('management.fullDay')}</option>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">{t('management.notes')}</label>
              <Input
                type="text"
                name="notes"
                value={gardeFormData.notes}
                onChange={handleGardeFormChange}
                placeholder={t('management.enterAdditionalNotes')}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowGardeModal(false)}
                disabled={gardeSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={gardeSubmitting}>
                {gardeSubmitting ? t('management.saving') : gardeModalMode === 'create' ? t('management.create') : t('management.update')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default ManagementPage;
