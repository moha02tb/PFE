/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import api from '../lib/api';
import { Badge, Button, EmptyState, Input } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { getPharmacyOpenStatus } from '../lib/pharmacySchedule';

const TUNISIA_CENTER = [34.2, 9.5];
const TUNISIA_BOUNDS = [
  [30.0, 7.0],
  [37.7, 12.1],
];
const TUNISIA_LIMITS = {
  minLat: 30.0,
  maxLat: 37.7,
  minLng: 7.0,
  maxLng: 12.1,
};
const TILE_LAYERS = [
  {
    key: 'carto-voyager',
    url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
  },
  {
    key: 'esri-street',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  {
    key: 'osm-standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    key: 'osm-de',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
];

const PREVIEW_PHARMACIES = [
  {
    id: 'preview-tunis',
    name: 'Pharmacie Centrale Tunis',
    address: 'Avenue Habib Bourguiba, Tunis',
    governorate: 'Tunis',
    latitude: 36.8008,
    longitude: 10.1801,
    phone: '+216 71 000 000',
  },
  {
    id: 'preview-sfax',
    name: 'Pharmacie Sfax Medina',
    address: 'Rue de la Republique, Sfax',
    governorate: 'Sfax',
    latitude: 34.7406,
    longitude: 10.7603,
    phone: '+216 74 000 000',
  },
  {
    id: 'preview-sousse',
    name: 'Pharmacie Sousse Corniche',
    address: 'Boulevard 14 Janvier, Sousse',
    governorate: 'Sousse',
    latitude: 35.8256,
    longitude: 10.6084,
    phone: '+216 73 000 000',
  },
  {
    id: 'preview-gabes',
    name: 'Pharmacie Gabes Sud',
    address: 'Route de Medenine, Gabes',
    governorate: 'Gabes',
    latitude: 33.8815,
    longitude: 10.0982,
    phone: '+216 75 000 000',
  },
];

const STATUS_STYLES = {
  all: {
    label: 'All',
    color: '#2563EB',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  open: {
    color: '#059669',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  garde: {
    color: '#F97316',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  night: {
    color: '#7C3AED',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  closed: {
    color: '#DC2626',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
};

const FALLBACK_STATUS = {
  isOpen: false,
  label: 'Unknown',
  statusType: 'closed',
  color: '#DC2626',
};

const createMarkerIcon = (color, selected = false) =>
  L.divIcon({
    className: `map-pharmacy-dot${selected ? ' map-pharmacy-dot--selected' : ''}`,
    html: `<span style="background:${color}"></span>`,
    iconSize: selected ? [24, 24] : [18, 18],
    iconAnchor: selected ? [12, 12] : [9, 9],
    popupAnchor: [0, -10],
  });

const parseCoordinate = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const isInsideTunisia = (latitude, longitude) =>
  latitude >= TUNISIA_LIMITS.minLat &&
  latitude <= TUNISIA_LIMITS.maxLat &&
  longitude >= TUNISIA_LIMITS.minLng &&
  longitude <= TUNISIA_LIMITS.maxLng;

const normalizePharmacy = (pharmacy) => {
  let latitude = parseCoordinate(pharmacy?.latitude ?? pharmacy?.lat);
  let longitude = parseCoordinate(pharmacy?.longitude ?? pharmacy?.lng ?? pharmacy?.lon);

  if (
    latitude === null ||
    longitude === null ||
    (latitude === 0 && longitude === 0) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  if (!isInsideTunisia(latitude, longitude) && isInsideTunisia(longitude, latitude)) {
    [latitude, longitude] = [longitude, latitude];
  }

  if (!isInsideTunisia(latitude, longitude)) return null;

  return {
    ...pharmacy,
    id: pharmacy.id ?? `${pharmacy.name}-${latitude}-${longitude}`,
    name: pharmacy.name || 'Unnamed pharmacy',
    address: pharmacy.address || '',
    governorate: pharmacy.governorate || '',
    latitude,
    longitude,
  };
};

const getSafePharmacyStatus = (pharmacy) => {
  try {
    const status = getPharmacyOpenStatus(pharmacy);
    if (!status || !STATUS_STYLES[status.statusType]) return FALLBACK_STATUS;
    return status;
  } catch (err) {
    console.error('getPharmacyOpenStatus failed for map pharmacy:', pharmacy, err);
    return FALLBACK_STATUS;
  }
};

const MapBridge = ({ mapRef, pharmacies, selectedPharmacy }) => {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const container = map.getContainer();
    let frameId = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    const invalidate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const { width, height } = container.getBoundingClientRect();
        if (Math.round(width) === lastWidth && Math.round(height) === lastHeight) return;
        lastWidth = Math.round(width);
        lastHeight = Math.round(height);
        map.invalidateSize({ pan: false });
      });
    };

    invalidate();
    const firstTimer = window.setTimeout(invalidate, 120);
    const secondTimer = window.setTimeout(invalidate, 450);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidate) : null;
    if (observer && container) observer.observe(container);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
      observer?.disconnect();
    };
  }, [map]);

  useEffect(() => {
    map.invalidateSize({ pan: false });

    if (selectedPharmacy && Number.isFinite(selectedPharmacy.latitude) && Number.isFinite(selectedPharmacy.longitude)) {
      map.flyTo([selectedPharmacy.latitude, selectedPharmacy.longitude], Math.max(map.getZoom(), 13), {
        duration: 0.7,
      });
      return;
    }

    const timerId = window.setTimeout(() => {
      if (pharmacies.length > 1) {
        const bounds = L.latLngBounds(pharmacies.map((item) => [item.latitude, item.longitude]));
        map.fitBounds(bounds.pad(0.18), { maxZoom: 7, animate: false });
        return;
      }

      if (pharmacies.length === 1) {
        map.setView([pharmacies[0].latitude, pharmacies[0].longitude], 13, { animate: false });
        return;
      }

      map.fitBounds(TUNISIA_BOUNDS, { maxZoom: 7, animate: false });
    }, 80);

    return () => window.clearTimeout(timerId);
  }, [map, pharmacies, selectedPharmacy]);

  return null;
};

const MapDiagnostics = ({ enabled, layerKey }) => {
  const map = useMap();
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;

    const update = () => {
      const container = map.getContainer();
      const tileCount = container.querySelectorAll('.leaflet-tile').length;
      const loadedTileCount = container.querySelectorAll('.leaflet-tile-loaded').length;
      const markerCount = container.querySelectorAll('.leaflet-marker-icon').length;
      const firstTile = container.querySelector('.leaflet-tile');
      const tileStyle = firstTile ? window.getComputedStyle(firstTile) : null;
      const center = map.getCenter();
      setSummary(
        `${layerKey} | tiles ${loadedTileCount}/${tileCount} | markers ${markerCount} | z${map.getZoom()} | ${center.lat.toFixed(3)}, ${center.lng.toFixed(3)}${tileStyle ? ` | ${tileStyle.visibility}/${tileStyle.opacity}/${tileStyle.mixBlendMode}` : ''}`
      );
    };

    update();
    map.on('load moveend zoomend tileload tileerror layeradd', update);
    const timerId = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(timerId);
      map.off('load moveend zoomend tileload tileerror layeradd', update);
    };
  }, [enabled, layerKey, map]);

  if (!enabled || !summary) return null;

  return (
    <div className="map-debug-panel">
      {summary}
    </div>
  );
};

const PharmacyRow = ({ pharmacy, selected, onSelect }) => {
  const { t } = useLanguage();
  const status = pharmacy.status || getSafePharmacyStatus(pharmacy);
  const badgeClass = STATUS_STYLES[status.statusType]?.badge || STATUS_STYLES.closed.badge;

  return (
    <button
      type="button"
      className={`map-directory-item${selected ? ' map-directory-item--selected border-l-2 border-l-primary' : ''}`}
      onClick={onSelect}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-bold text-foreground">{pharmacy.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{pharmacy.address || pharmacy.governorate || t('map.noAddress')}</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase ${badgeClass}`}>
          {status.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        <span>{pharmacy.governorate || t('management.unknown')}</span>
        <span>{pharmacy.phone || t('pharmacies.notAvailable')}</span>
      </div>
    </button>
  );
};

const MapPage = () => {
  const { t } = useLanguage();
  const [totalRecords, setTotalRecords] = useState(0);
  const [pharmacies, setPharmacies] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tileError, setTileError] = useState(false);
  const [tileLayerIndex, setTileLayerIndex] = useState(0);
  const mapRef = useRef(null);

  const loadPharmacies = useCallback(async () => {
    setLoading(true);
    setError('');
    setTileError(false);
    setTileLayerIndex(0);

    try {
      const response = await api.get('/api/pharmacies', { params: { skip: 0, limit: 500 } });
      const rawRows = Array.isArray(response.data) ? response.data : [];
      const mappedRows = rawRows.map(normalizePharmacy).filter(Boolean);
      const nextRows = mappedRows.length ? mappedRows : PREVIEW_PHARMACIES;

      setTotalRecords(rawRows.length || nextRows.length);
      setPharmacies(nextRows);
      setSelectedId(null);
      if (rawRows.length && mappedRows.length < rawRows.length) {
        setError(`${mappedRows.length} of ${rawRows.length} pharmacies have usable Tunisia coordinates. Records with missing, zero, or invalid coordinates are not shown on the map.`);
      } else if (!mappedRows.length) {
        setError(t('map.previewDataError'));
      }
    } catch (err) {
      setTotalRecords(PREVIEW_PHARMACIES.length);
      setPharmacies(PREVIEW_PHARMACIES);
      setSelectedId(null);
      setError(err.response?.data?.detail || err.message || t('map.previewDataError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPharmacies();
  }, [loadPharmacies]);

  const enrichedPharmacies = useMemo(
    () =>
      pharmacies.map((pharmacy) => ({
        ...pharmacy,
        status: getSafePharmacyStatus(pharmacy),
      })),
    [pharmacies]
  );

  const statusCounts = useMemo(
    () =>
      enrichedPharmacies.reduce(
        (counts, pharmacy) => ({
          ...counts,
          [pharmacy.status.statusType]: (counts[pharmacy.status.statusType] || 0) + 1,
        }),
        { all: enrichedPharmacies.length, open: 0, garde: 0, night: 0, closed: 0 }
      ),
    [enrichedPharmacies]
  );

  const filteredPharmacies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return enrichedPharmacies.filter((pharmacy) => {
      const matchesStatus = statusFilter === 'all' || pharmacy.status.statusType === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [pharmacy.name, pharmacy.address, pharmacy.governorate, pharmacy.phone]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [enrichedPharmacies, query, statusFilter]);

  const selectedPharmacy = selectedId
    ? filteredPharmacies.find((pharmacy) => pharmacy.id === selectedId) ||
      enrichedPharmacies.find((pharmacy) => pharmacy.id === selectedId) ||
      null
    : null;

  const visibleSelectedPharmacy = selectedPharmacy || null;

  const selectPharmacy = (pharmacy) => {
    setSelectedId(pharmacy.id);
  };

  const resetMap = () => {
    setSelectedId(null);
    mapRef.current?.fitBounds(TUNISIA_BOUNDS, { maxZoom: 7, animate: true });
  };

  const activeTileLayer = TILE_LAYERS[tileLayerIndex] || TILE_LAYERS[0];

  return (
    <div className="map-page-shell">
      <header className="col-span-full border-b border-border bg-surface/90 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary">
              OpenStreetMap
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('map.title')}</h1>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
              {t('map.description', { count: totalRecords || pharmacies.length })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'open', 'garde', 'night', 'closed'].map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                className={`map-filter-chip ${statusFilter === statusKey ? 'map-filter-chip--active' : ''}`}
                onClick={() => {
                  setStatusFilter(statusKey);
                  setSelectedId(null);
                }}
              >
                {statusKey === 'all' ? STATUS_STYLES.all.label : t(`map.${statusKey === 'garde' ? 'onCallGarde' : statusKey === 'night' ? 'nightGuard' : statusKey === 'open' ? 'openNow' : 'closed'}`)}
                <span className="ml-1">{statusKey === 'all' ? totalRecords || statusCounts.all : statusCounts[statusKey] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {error ? (
        <div className="col-span-full border-b border-warning/25 bg-warning-soft px-6 py-3 text-xs font-medium text-warning">
          {error}
        </div>
      ) : null}

      <aside className="map-directory-panel">
        <div className="space-y-4 border-b border-border p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
              placeholder={t('map.searchPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-[0.625rem] font-bold uppercase text-muted-foreground">{t('map.legend')}</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">{filteredPharmacies.length}</p>
              <p className="mt-1 text-[0.625rem] font-bold uppercase text-muted-foreground">mapped</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-[0.625rem] font-bold uppercase text-muted-foreground">{t('map.openNow')}</p>
              <p className="mt-1 font-display text-xl font-bold text-emerald-600">{statusCounts.open}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-[0.625rem] font-bold uppercase text-muted-foreground">{t('map.onCallGarde')}</p>
              <p className="mt-1 font-display text-xl font-bold text-orange-600">{statusCounts.garde + statusCounts.night}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center p-6 text-sm font-semibold text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('map.loadingPharmacies')}
            </div>
          ) : filteredPharmacies.length ? (
            filteredPharmacies.map((pharmacy) => (
              <PharmacyRow
                key={pharmacy.id}
                pharmacy={pharmacy}
                selected={visibleSelectedPharmacy?.id === pharmacy.id}
                onSelect={() => selectPharmacy(pharmacy)}
              />
            ))
          ) : (
            <div className="p-6">
              <EmptyState icon={MapPin} title={t('map.noMatches')} description={t('map.noMatchesDesc')} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border bg-surface-muted p-4">
          <Button variant="secondary" onClick={resetMap}>
            <LocateFixed className="h-4 w-4" />
            {t('map.centerTunisia')}
          </Button>
          <Button onClick={loadPharmacies} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </aside>

      <main className="map-main-canvas">
        <MapContainer
          center={TUNISIA_CENTER}
          zoom={7}
          minZoom={5}
          maxZoom={18}
          maxBounds={TUNISIA_BOUNDS}
          maxBoundsViscosity={0.7}
          zoomControl
          scrollWheelZoom
          className="map-leaflet-container"
        >
          <TileLayer
            key={activeTileLayer.key}
            attribution={activeTileLayer.attribution}
            url={activeTileLayer.url}
            tileSize={256}
            zoomOffset={0}
            keepBuffer={1}
            updateWhenIdle
            updateWhenZooming={false}
            updateInterval={400}
            {...(activeTileLayer.subdomains ? { subdomains: activeTileLayer.subdomains } : {})}
            eventHandlers={{
              tileerror: () => {
                setTileError(true);
                setTileLayerIndex((current) => Math.min(current + 1, TILE_LAYERS.length - 1));
              },
              tileload: () => setTileError(false),
            }}
          />
          <MapBridge mapRef={mapRef} pharmacies={filteredPharmacies} selectedPharmacy={visibleSelectedPharmacy} />
          <MapDiagnostics enabled={import.meta.env.DEV} layerKey={activeTileLayer.key} />
          <MarkerClusterGroup
            chunkedLoading
            chunkInterval={200}
            chunkDelay={50}
            maxClusterRadius={60}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            disableClusteringAtZoom={14}
          >
            {filteredPharmacies.map((pharmacy) => {
              const isSelected = visibleSelectedPharmacy?.id === pharmacy.id;
              const color = isSelected
                ? STATUS_STYLES.all.color
                : STATUS_STYLES[pharmacy.status.statusType]?.color || STATUS_STYLES.closed.color;

              return (
                <Marker
                  key={pharmacy.id}
                  position={[pharmacy.latitude, pharmacy.longitude]}
                  icon={createMarkerIcon(color, isSelected)}
                  eventHandlers={{ click: () => selectPharmacy(pharmacy) }}
                >
                  <Popup>
                    <div className="min-w-[210px] p-3">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-primary">
                            {pharmacy.governorate || t('management.unknown')}
                          </p>
                          <h3 className="mt-1 font-display text-sm font-bold text-foreground">{pharmacy.name}</h3>
                        </div>
                        <Badge className={STATUS_STYLES[pharmacy.status.statusType]?.badge}>
                          {pharmacy.status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{pharmacy.address || t('map.noAddress')}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Navigation className="h-3.5 w-3.5" />
                        {pharmacy.latitude.toFixed(4)}, {pharmacy.longitude.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {tileError ? (
          <div className="absolute left-1/2 top-4 z-[8] -translate-x-1/2 rounded-lg border border-warning/30 bg-warning-soft px-4 py-2 text-xs font-semibold text-warning shadow-card">
            Map tiles unavailable. If using Brave, disable Shields for this site, or try Chrome/Firefox.
          </div>
        ) : null}

        {visibleSelectedPharmacy ? (
          <div className="map-legend">
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-foreground">
                Selected pharmacy
              </span>
              <Crosshair className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display text-sm font-bold text-foreground">{visibleSelectedPharmacy.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {visibleSelectedPharmacy.address || visibleSelectedPharmacy.governorate || t('map.noAddress')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className={STATUS_STYLES[visibleSelectedPharmacy.status.statusType]?.badge}>
                {visibleSelectedPharmacy.status.label}
              </Badge>
              <Badge variant="outline">
                {visibleSelectedPharmacy.latitude.toFixed(3)}, {visibleSelectedPharmacy.longitude.toFixed(3)}
              </Badge>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="map-summary-bar">
        <span>{t('map.dataStreamRealtime')}</span>
        <span>
          <strong className="text-white">{totalRecords || pharmacies.length}</strong> {t('map.totalRegisteredEntities')}
        </span>
      </footer>
    </div>
  );
};

export default MapPage;
