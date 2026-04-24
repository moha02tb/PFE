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
import api from '../lib/api';
import { Button, EmptyState, Input } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const TILE_SIZE = 256;
const TUNISIA_CENTER = { lat: 36.8065, lon: 10.1815 };
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
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const project = (lat, lon, zoom) => {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
};

const unproject = (x, y, zoom) => {
  const scale = TILE_SIZE * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lon };
};

const OSMMap = ({ center, zoom, markers, selectedId, onSelectMarker, onCenterChange, onZoomChange }) => {
  const containerRef = useRef(null);
  const dragStateRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle wheel event with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      onZoomChange(clamp(zoom + (event.deltaY < 0 ? 1 : -1), 5, 18));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange]);

  const centerWorld = project(center.lat, center.lon, zoom);
  const originX = centerWorld.x - size.width / 2;
  const originY = centerWorld.y - size.height / 2;
  const tileCount = 2 ** zoom;
  const minTileX = Math.floor(originX / TILE_SIZE);
  const maxTileX = Math.floor((originX + size.width) / TILE_SIZE);
  const minTileY = Math.max(0, Math.floor(originY / TILE_SIZE));
  const maxTileY = Math.min(tileCount - 1, Math.floor((originY + size.height) / TILE_SIZE));

  const tiles = [];
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}-${wrappedX}-${tileY}-${tileX}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
        left: tileX * TILE_SIZE - originX,
        top: tileY * TILE_SIZE - originY,
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className="map-canvas absolute inset-0 overflow-hidden bg-slate-200"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startCenter: project(center.lat, center.lon, zoom),
        };
      }}
      onPointerMove={(event) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        const nextCenter = unproject(dragState.startCenter.x - deltaX, dragState.startCenter.y - deltaY, zoom);
        onCenterChange({ lat: clamp(nextCenter.lat, -85, 85), lon: nextCenter.lon });
      }}
      onPointerUp={(event) => {
        if (dragStateRef.current?.pointerId === event.pointerId) dragStateRef.current = null;
      }}
      onPointerLeave={(event) => {
        if (dragStateRef.current?.pointerId === event.pointerId) dragStateRef.current = null;
      }}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          draggable="false"
          className="pointer-events-none absolute h-64 w-64 max-w-none select-none"
          style={{ left: tile.left, top: tile.top, opacity: 0.62, filter: 'saturate(0.72) contrast(0.96)' }}
        />
      ))}
      <div className="map-canvas-grid" />

      {markers.map((marker) => {
        const point = project(marker.latitude, marker.longitude, zoom);
        const left = point.x - originX;
        const top = point.y - originY;
        if (left < -40 || top < -40 || left > size.width + 40 || top > size.height + 40) return null;
        const selected = marker.id === selectedId;
        return (
          <button
            key={marker.id}
            type="button"
            onClick={() => onSelectMarker(marker)}
            className="map-pin-marker absolute -translate-x-1/2 -translate-y-full"
            data-selected={selected}
            style={{ left, top }}
          >
            <MapPin className={selected ? 'h-11 w-11 fill-blue-600 text-blue-600 drop-shadow-lg' : 'h-10 w-10 fill-emerald-600 text-emerald-600 drop-shadow-lg'} />
          </button>
        );
      })}
    </div>
  );
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
        {Math.max(1, Math.round(Math.abs(pharmacy.latitude - TUNISIA_CENTER.lat) * 10))} km
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
  const [zoom, setZoom] = useState(11);

  useEffect(() => {
    let active = true;
    const loadPharmacies = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/admin/pharmacies', { params: { skip: 0, limit: 300 } });
        if (!active) return;
        const rows = Array.isArray(response.data)
          ? response.data.filter((item) => typeof item.latitude === 'number' && typeof item.longitude === 'number')
          : [];
        const nextRows = rows.length ? rows : PREVIEW_PHARMACIES;
        setPharmacies(nextRows);
        if (nextRows[0]) {
          const selected = nextRows[1] || nextRows[0];
          setSelectedPharmacy(selected);
          setCenter({ lat: selected.latitude, lon: selected.longitude });
        }
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || err.message || t('map.previewDataError'));
        setPharmacies(PREVIEW_PHARMACIES);
        setSelectedPharmacy(PREVIEW_PHARMACIES[1]);
        setCenter({ lat: PREVIEW_PHARMACIES[1].latitude, lon: PREVIEW_PHARMACIES[1].longitude });
      } finally {
        if (active) setLoading(false);
      }
    };
    loadPharmacies();
    return () => {
      active = false;
    };
  }, []);

  const filteredPharmacies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pharmacies;
    return pharmacies.filter((item) =>
      [item.name, item.address, item.governorate].filter(Boolean).some((value) => value.toLowerCase().includes(query))
    );
  }, [pharmacies, searchTerm]);

  const focusPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setCenter({ lat: pharmacy.latitude, lon: pharmacy.longitude });
    setZoom(14);
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
        <OSMMap
          center={center}
          zoom={zoom}
          markers={filteredPharmacies}
          selectedId={selectedPharmacy?.id}
          onSelectMarker={focusPharmacy}
          onCenterChange={setCenter}
          onZoomChange={setZoom}
        />
        <div className="map-control-stack">
          <div className="overflow-hidden rounded-[12px] border border-border bg-surface-elevated shadow-elevated">
            <button className="block border-b border-border p-3 hover:bg-surface-muted" onClick={() => setZoom((current) => clamp(current + 1, 5, 18))} aria-label={t('map.zoomIn')}>
              <Plus className="h-5 w-5" />
            </button>
            <button className="block p-3 hover:bg-surface-muted" onClick={() => setZoom((current) => clamp(current - 1, 5, 18))} aria-label={t('map.zoomOut')}>
              <Minus className="h-5 w-5" />
            </button>
          </div>
          <button
            className="rounded-[12px] border border-border bg-surface-elevated p-3 shadow-elevated hover:bg-surface-muted"
            onClick={() => navigator.geolocation?.getCurrentPosition(({ coords }) => {
              setCenter({ lat: coords.latitude, lon: coords.longitude });
              setZoom(13);
            })}
          >
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
              <strong>{Math.max(0, pharmacies.length - 2)}</strong>
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
