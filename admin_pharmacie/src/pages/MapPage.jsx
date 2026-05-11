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

// Create custom marker icons
const greenMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjQgMkMxNy4zNzMgMiAxMiA3LjM3MyAxMiAxNGMwIDEwLjEyNSAxMiAzMiAxMiAzMnMxMi0yMS44NzUgMTItMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnoiIGZpbGw9IiMxMEI5ODEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
  iconSize: [32, 40],
  popupAnchor: [0, -40],
  className: 'map-marker-green',
});

const blueMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjQgMkMxNy4zNzMgMiAxMiA3LjM3MyAxMiAxNGMwIDEwLjEyNSAxMiAzMiAxMiAzMnMxMi0yMS44NzUgMTItMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnoiIGZpbGw9IiMyMzYzRUEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
  iconSize: [32, 40],
  popupAnchor: [0, -40],
  className: 'map-marker-blue',
});

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
  return null;
};

const DirectoryItem = ({ pharmacy, selected, onClick }) => {
  const { t } = useLanguage();
  return (
    <button type="button" onClick={onClick} className={selected ? 'map-directory-item map-directory-item--selected' : 'map-directory-item'}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-foreground">{pharmacy.name}</h3>
        <span className={selected ? 'registry-status registry-status--garde' : 'registry-status registry-status--active'}>
          {selected ? t('map.nightGuard') : t('common.active')}
        </span>
      </div>
      <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {pharmacy.address || pharmacy.governorate || t('map.noAddress')}
      </p>
      <div className="flex items-center gap-4 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {selected ? t('map.alwaysOpen') : '08:00 - 20:00'}
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

  return (
    <div className="map-page-shell">
      <section className="map-directory-panel">
        <div className="border-b border-border p-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{t('map.title')}</h1>
          <p className="mt-2 text-xs text-muted-foreground">{t('map.description', { count: pharmacies.length || 0 })}</p>
          {error ? <p className="mt-2 text-xs font-medium text-amber-700">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="map-filter-chip map-filter-chip--active">
              <CircleDot className="h-3.5 w-3.5" />
              {t('map.openNow')}
            </button>
            <button className="map-filter-chip">{t('map.garde24')}</button>
            <button className="map-filter-chip">{t('map.wholesale')}</button>
          </div>
          <div className="relative mt-4">
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

      <section className="map-main-canvas relative min-w-0 flex-1 overflow-hidden bg-slate-200">
        {typeof window !== 'undefined' && (
          <MapContainer
            ref={mapRef}
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
            <MapController center={center} zoom={zoom} onCenterChange={setCenter} onZoomChange={setZoom} />
            {filteredPharmacies.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.latitude, marker.longitude]}
                icon={marker.id === selectedPharmacy?.id ? blueMarkerIcon : greenMarkerIcon}
                eventHandlers={{
                  click: () => focusPharmacy(marker),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-bold">{marker.name}</h3>
                    <p className="text-xs text-gray-600">{marker.address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
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
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-emerald-500 text-emerald-500" /> {t('map.openFacility')}</span>
              <strong>{Math.max(0, pharmacies.length - (selectedPharmacy ? 1 : 0))}</strong>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-blue-500 text-blue-500" /> {t('map.onCallGarde')}</span>
              <strong>{selectedPharmacy ? 1 : 0}</strong>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 fill-slate-400 text-slate-400" /> {t('map.closed')}</span>
              <strong>0</strong>
            </div>
          </div>
        </div>

        {selectedPharmacy ? (
          <div className="map-popover">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <h3 className="font-display text-sm font-bold text-foreground">{selectedPharmacy.name}</h3>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">{selectedPharmacy.address || t('map.selectedForNightDuty')}</p>
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
