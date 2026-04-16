import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, MapPinned, Minus, Plus, Search } from 'lucide-react';
import api from '../lib/api';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Input, SectionHeader } from '../components/ui';

const TILE_SIZE = 256;
const TUNISIA_CENTER = { lat: 36.8065, lon: 10.1815 };
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
      className="relative h-full w-full overflow-hidden rounded-[28px] bg-surface-muted"
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
      onWheel={(event) => {
        event.preventDefault();
        onZoomChange(clamp(zoom + (event.deltaY < 0 ? 1 : -1), 5, 18));
      }}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          draggable="false"
          className="pointer-events-none absolute h-64 w-64 max-w-none select-none"
          style={{ left: tile.left, top: tile.top }}
        />
      ))}

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
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left, top }}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-card ${selected ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'}`}>
              <MapPinned className="h-4 w-4" />
            </div>
            <div className={`mx-auto h-3 w-3 -translate-y-1 rotate-45 ${selected ? 'bg-warning' : 'bg-primary'}`} />
          </button>
        );
      })}
    </div>
  );
};

const MapPage = () => {
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
        setPharmacies(rows);
        if (rows[0]) {
          setSelectedPharmacy(rows[0]);
          setCenter({ lat: rows[0].latitude, lon: rows[0].longitude });
        }
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || err.message || 'Failed to load pharmacies for the map.');
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
    <div className="page-shell">
      <div className="page-content">
        <SectionHeader
          eyebrow="Mapping"
          title="Pharmacy map"
          description="Live pharmacy coordinates rendered on OpenStreetMap with a cleaner operator surface and better scanability."
        />

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Directory</CardTitle>
                <CardDescription>Search visible mapped pharmacies.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-9" placeholder="Search pharmacy or governorate" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => { setCenter(TUNISIA_CENTER); setZoom(7); }}>Tunisia view</Button>
                <Button variant="secondary" onClick={() => navigator.geolocation?.getCurrentPosition(({ coords }) => { setCenter({ lat: coords.latitude, lon: coords.longitude }); setZoom(13); })}>
                  <LocateFixed className="h-4 w-4" />
                  Locate
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-surface-muted p-4 text-center">
                  <p className="text-xs text-muted-foreground">Visible</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-foreground">{filteredPharmacies.length}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted p-4 text-center">
                  <p className="text-xs text-muted-foreground">Zoom</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-foreground">{zoom}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted p-4 text-center">
                  <p className="text-xs text-muted-foreground">Tiles</p>
                  <p className="mt-2 text-sm font-medium text-foreground">OSM</p>
                </div>
              </div>
              <div className="max-h-[520px] space-y-3 overflow-auto">
                {loading ? (
                  <EmptyState icon={MapPinned} title="Loading pharmacies" description="Fetching mapped pharmacies from the admin API." />
                ) : error ? (
                  <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</div>
                ) : filteredPharmacies.length ? (
                  filteredPharmacies.map((pharmacy) => (
                    <button
                      key={pharmacy.id}
                      type="button"
                      onClick={() => focusPharmacy(pharmacy)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${selectedPharmacy?.id === pharmacy.id ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-surface-muted'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{pharmacy.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{pharmacy.address || pharmacy.governorate || 'No address'}</p>
                        </div>
                        <Badge variant="primary">{pharmacy.governorate || 'N/A'}</Badge>
                      </div>
                    </button>
                  ))
                ) : (
                  <EmptyState icon={MapPinned} title="No matches" description="No pharmacies match the current map search." />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="relative min-h-[720px]">
            <OSMMap
              center={center}
              zoom={zoom}
              markers={filteredPharmacies}
              selectedId={selectedPharmacy?.id}
              onSelectMarker={focusPharmacy}
              onCenterChange={setCenter}
              onZoomChange={setZoom}
            />
            <div className="absolute right-5 top-5 flex flex-col gap-2">
              <Button variant="secondary" size="icon" onClick={() => setZoom((current) => clamp(current + 1, 5, 18))}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" onClick={() => setZoom((current) => clamp(current - 1, 5, 18))}>
                <Minus className="h-4 w-4" />
              </Button>
            </div>
            {selectedPharmacy ? (
              <div className="absolute inset-x-5 bottom-5 max-w-2xl rounded-[28px] border border-border bg-background/90 p-5 shadow-panel backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary">Selected pharmacy</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">{selectedPharmacy.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedPharmacy.address || 'No address available'}</p>
                  </div>
                  <Badge variant="success">Mapped</Badge>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
