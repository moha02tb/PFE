import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleDot,
  Clock3,
  LocateFixed,
  MapPin,
  MapPinned,
  Minus,
  Navigation,
  Plus,
  Search,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { Button, EmptyState, Input } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { getPharmacyOpenStatus } from '../lib/pharmacySchedule';

const TUNISIA_CENTER = [36.8065, 10.1815];
const TUNISIA_DEFAULT_ZOOM = 6;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

const PREVIEW_PHARMACIES = [
  {
    id: 'preview-1',
    name: 'Pharmacie de Carthage',
    address: 'Av. Habib Bourguiba, Carthage',
    governorate: 'Tunis',
    latitude: 36.8528,
    longitude: 10.3233,
  },
  {
    id: 'preview-2',
    name: 'Pharmacie Ennasr 24/7',
    address: 'Rue Hedi Nouira, Ariana',
    governorate: 'Ariana',
    latitude: 36.8665,
    longitude: 10.1647,
  },
  {
    id: 'preview-3',
    name: 'Pharmacie du Lac 1',
    address: 'Les Berges du Lac, Tunis',
    governorate: 'Tunis',
    latitude: 36.8421,
    longitude: 10.2478,
  },
  {
    id: 'preview-4',
    name: 'Sidi Bou Said Pharmacy',
    address: 'Hilltop View, Sidi Bou Said',
    governorate: 'Tunis',
    latitude: 36.8702,
    longitude: 10.3418,
  },
  {
    id: 'preview-5',
    name: 'La Marsa Central',
    address: 'Plage de la Marsa, Tunis',
    governorate: 'Tunis',
    latitude: 36.8782,
    longitude: 10.3247,
  },
];

const parseCoordinate = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizePharmacy = (item) => {
  const latitude = parseCoordinate(item?.latitude);
  const longitude = parseCoordinate(item?.longitude);
  if (latitude === null || longitude === null) return null;

  return {
    ...item,
    latitude,
    longitude,
  };
};

// Create custom marker icon generator
const createMarkerIcon = (color) => {
  const svgUrl = `data:image/svg+xml;base64,${btoa(
    `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 2C17.373 2 12 7.373 12 14c0 10.125 12 32 12 32s12-21.875 12-32c0-6.627-5.373-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>`
  )}`;
  return new L.Icon({
    iconUrl: svgUrl,
    iconSize: [32, 40],
    popupAnchor: [0, -40],
    className: `map-marker-${color.replace('#', '')}`,
  });
};

// Create custom marker icons for each status
const markerIcons = {
  open: createMarkerIcon('#10B981'),     // Green
  closed: createMarkerIcon('#EF4444'),   // Red
  garde: createMarkerIcon('#F97316'),    // Orange
  night: createMarkerIcon('#A78BFA'),    // Purple
  selected: createMarkerIcon('#2563EB'), // Blue (for selected)
};

// Backward compatibility - keep original icons
const greenMarkerIcon = markerIcons.open;
const blueMarkerIcon = markerIcons.selected;

// Map controller component
const MapController = ({ center, zoom, onCenterChange, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  useEffect(() => {
    const handleMove = () => {
      const mapCenter = map.getCenter();
      const mapZoom = map.getZoom();
      onCenterChange([mapCenter.lat, mapCenter.lng]);
      onZoomChange(mapZoom);
    };

    map.on('move', handleMove);
    return () => map.off('move', handleMove);
  }, [map, onCenterChange, onZoomChange]);

  return null;
};

const FixMapSize = () => {
  const map = useMap();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let animationFrameId = 0;
    const invalidate = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
      });
    };

    invalidate();

    const container = map.getContainer();
    const observer = typeof ResizeObserver !== 'undefined' && container
      ? new ResizeObserver(() => invalidate())
      : null;

    if (observer && container) {
      observer.observe(container);
    }

    const timeoutId = window.setTimeout(invalidate, 100);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [map]);

  return null;
};

const DirectoryItem = ({ pharmacy, selected, onClick }) => {
  const { t } = useLanguage();
  const status = getPharmacyOpenStatus(pharmacy);
  const statusBadge = {
    open:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    closed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    garde:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    night:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  const statusLabels = {
    open:   t('map.openNow'),
    closed: t('map.closed'),
    garde:  t('map.onCallGarde'),
    night:  t('map.nightGuard'),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`map-directory-item${selected ? ' map-directory-item--selected border-l-2 border-l-primary' : ''}`}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-foreground">{pharmacy.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em] ${statusBadge[status.statusType]}`}>
          {statusLabels[status.statusType]}
        </span>
      </div>
      <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{pharmacy.address || pharmacy.governorate || t('map.noAddress')}</span>
      </p>
      <div className="flex items-center gap-4 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {status.label}
        </span>
        <span className="flex items-center gap-1">
          <Navigation className="h-3.5 w-3.5" />
          {Math.max(1, Math.round(Math.hypot(pharmacy.latitude - TUNISIA_CENTER[0], pharmacy.longitude - TUNISIA_CENTER[1]) * 111))} km
        </span>
      </div>
    </button>
  );
};

const MapPage = () => {
  const { t } = useLanguage();
  const [pharmacies, setPharmacies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [center, setCenter] = useState(TUNISIA_CENTER);
  const [zoom, setZoom] = useState(TUNISIA_DEFAULT_ZOOM);
  const mapRef = useRef(null);

  useEffect(() => {
    let active = true;
    const loadPharmacies = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/admin/pharmacies', { params: { skip: 0, limit: 300 } });
        if (!active) return;
        const rows = Array.isArray(response.data)
          ? response.data.map(normalizePharmacy).filter(Boolean)
          : [];
        const nextRows = rows.length ? rows : PREVIEW_PHARMACIES;
        setPharmacies(nextRows);
        if (nextRows[0]) {
          setSelectedPharmacy(nextRows[0]);
          setCenter(TUNISIA_CENTER);
          setZoom(TUNISIA_DEFAULT_ZOOM);
        }
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || err.message || t('map.previewDataError'));
        setPharmacies(PREVIEW_PHARMACIES);
        setSelectedPharmacy(PREVIEW_PHARMACIES[0]);
        setCenter(TUNISIA_CENTER);
        setZoom(TUNISIA_DEFAULT_ZOOM);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadPharmacies();
    return () => {
      active = false;
    };
  }, [t]);

  const filteredPharmacies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pharmacies;
    return pharmacies.filter((item) =>
      [item.name, item.address, item.governorate].filter(Boolean).some((value) => value.toLowerCase().includes(query))
    );
  }, [pharmacies, searchTerm]);

  const focusPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setCenter([pharmacy.latitude, pharmacy.longitude]);
    setZoom(14);
  };

  const resetToTunisiaView = () => {
    setCenter(TUNISIA_CENTER);
    setZoom(TUNISIA_DEFAULT_ZOOM);
  };

  const handleZoomIn = () => {
    setZoom((current) => Math.min(current + 1, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom((current) => Math.max(current - 1, MIN_ZOOM));
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setCenter([coords.latitude, coords.longitude]);
          setZoom(13);
        },
        () => resetToTunisiaView()
      );
    } else {
      resetToTunisiaView();
    }
  };

  const selectedStatus = selectedPharmacy ? getPharmacyOpenStatus(selectedPharmacy) : null;

  return (
    <div className="map-page-shell">
      <div className="border-b border-border bg-surface/80 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary">{t('nav.map')}</div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('map.title')}</h1>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
              {t('map.description', { count: pharmacies.length || 0 })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="map-filter-chip map-filter-chip--active">
              <CircleDot className="h-3.5 w-3.5" />
              {t('map.openNow')}
            </button>
            <button className="map-filter-chip">{t('map.garde24')}</button>
            <button className="map-filter-chip">{t('map.wholesale')}</button>
          </div>
        </div>
      </div>
      {error ? (
        <div className="border-b border-warning/25 bg-warning-soft px-6 py-3 text-xs font-medium text-warning">{error}</div>
      ) : null}

      <section className="map-directory-panel">
        <div className="border-b border-border p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-10" placeholder={t('map.searchPlaceholder')} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !pharmacies.length ? (
            <div className="p-6">
              <EmptyState icon={MapPinned} title={t('map.loadingPharmacies')} description={t('map.loadingPharmaciesDesc')} />
            </div>
          ) : filteredPharmacies.length ? (
            filteredPharmacies.map((pharmacy) => (
              <DirectoryItem
                key={pharmacy.id}
                pharmacy={pharmacy}
                selected={selectedPharmacy?.id === pharmacy.id}
                onClick={() => focusPharmacy(pharmacy)}
              />
            ))
          ) : (
            <div className="p-6">
              <EmptyState icon={MapPinned} title={t('map.noMatches')} description={t('map.noMatchesDesc')} />
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface-muted p-4">
          <Button className="w-full">
            <Plus className="h-4 w-4" />
            {t('map.registerNewPharmacy')}
          </Button>
        </div>
      </section>

      <section className="map-main-canvas relative min-w-0 flex-1 overflow-hidden bg-slate-200" style={{ minHeight: '720px' }}>
        {typeof window !== 'undefined' && (
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            className="map-leaflet-container"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={MAX_ZOOM}
              minZoom={MIN_ZOOM}
            />
            <FixMapSize />
            <MapController center={center} zoom={zoom} onCenterChange={setCenter} onZoomChange={setZoom} />
            {filteredPharmacies.map((marker) => {
              const status = getPharmacyOpenStatus(marker);
              const isSelected = marker.id === selectedPharmacy?.id;
              const icon = isSelected ? markerIcons.selected : markerIcons[status.statusType];
              
              return (
                <Marker
                  key={marker.id}
                  position={[marker.latitude, marker.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => focusPharmacy(marker),
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px] p-1">
                      <p className="mb-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">{marker.governorate}</p>
                      <h3 className="font-display text-sm font-bold text-foreground">{marker.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{marker.address}</p>
                      <span
                        className="mt-2 inline-block rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em]"
                        style={{ background: `${status.color}1A`, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        <div className="map-control-stack">
          <div className="overflow-hidden rounded-[12px] border border-border bg-surface-elevated shadow-elevated">
            <button className="block border-b border-border p-3 hover:bg-surface-muted" onClick={handleZoomIn} aria-label={t('map.zoomIn')}>
              <Plus className="h-5 w-5" />
            </button>
            <button className="block p-3 hover:bg-surface-muted" onClick={handleZoomOut} aria-label={t('map.zoomOut')}>
              <Minus className="h-5 w-5" />
            </button>
          </div>
          <button className="rounded-[12px] border border-border bg-surface-elevated p-3 shadow-elevated hover:bg-surface-muted" onClick={handleLocate} aria-label={t('map.centerTunisia')}>
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>

        <div className="map-legend">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-foreground">{t('map.legend')}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-8 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-green-500 text-green-500" /> {t('map.openNow')}</span>
              <strong>{pharmacies.filter(p => getPharmacyOpenStatus(p).statusType === 'open').length}</strong>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-orange-500 text-orange-500" /> {t('map.onCallGarde')}</span>
              <strong>{pharmacies.filter(p => getPharmacyOpenStatus(p).statusType === 'garde').length}</strong>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-purple-500 text-purple-500" /> {t('map.nightGuard')}</span>
              <strong>{pharmacies.filter(p => getPharmacyOpenStatus(p).statusType === 'night').length}</strong>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-red-500 text-red-500" /> {t('map.closed')}</span>
              <strong>{pharmacies.filter(p => getPharmacyOpenStatus(p).statusType === 'closed').length}</strong>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-blue-500 text-blue-500" /> {t('map.selectedForNightDuty')}</span>
              <strong>{selectedPharmacy ? 1 : 0}</strong>
            </div>
          </div>
        </div>

        {selectedPharmacy && selectedStatus ? (
          <div className="map-popover">
            <p className="mb-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-primary">{selectedPharmacy.governorate}</p>
            <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
              <h3 className="min-w-0 truncate font-display text-sm font-bold text-foreground">{selectedPharmacy.name}</h3>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em]"
                style={{ background: `${selectedStatus.color}1A`, color: selectedStatus.color }}
              >
                {selectedStatus.label}
              </span>
            </div>
            <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{selectedPharmacy.address || t('map.noAddress')}</span>
            </p>
            <Button className="w-full" size="sm">{t('map.viewFullRecords')}</Button>
            <span className="map-popover-arrow" />
          </div>
        ) : null}
      </section>

      <footer className="map-summary-bar">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{t('map.dataStreamRealtime')}</span>
          </div>
          <span className="text-white/50">{t('map.lastUpdate')}</span>
        </div>
        <div className="flex items-center gap-6">
          <span><strong className="text-white">{Math.min(78, pharmacies.length)}</strong> {t('map.nightDutyTonight')}</span>
          <span><strong className="text-white">{pharmacies.length}</strong> {t('map.totalRegisteredEntities')}</span>
        </div>
      </footer>
    </div>
  );
};

export default MapPage;
