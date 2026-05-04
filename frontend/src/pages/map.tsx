import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, Navigation, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useLocationStore } from '@/store/locationStore';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// We load Leaflet dynamically to avoid SSR issues
const MOCK_ZONES = [
  { id: 1, name: 'Connaught Place Speed Zone',    zone_type: 'speed_limit',   latitude: 28.6315, longitude: 77.2167, radius: 500, limit: '30 km/h' },
  { id: 2, name: 'IGI Airport No-Honking Zone',   zone_type: 'no_honking',    latitude: 28.5562, longitude: 77.0999, radius: 800, limit: null },
  { id: 3, name: 'Lajpat Nagar Enforcement Zone', zone_type: 'enforcement',   latitude: 28.5677, longitude: 77.2432, radius: 600, limit: null },
  { id: 4, name: 'Chandni Chowk School Zone',     zone_type: 'school_zone',   latitude: 28.6506, longitude: 77.2300, radius: 400, limit: '20 km/h' },
  { id: 5, name: 'DND Flyway Speed Camera',       zone_type: 'speed_camera',  latitude: 28.5921, longitude: 77.3200, radius: 200, limit: '80 km/h' },
];

const ZONE_COLORS: Record<string, string> = {
  speed_limit:  '#f59e0b',
  no_honking:   '#6366f1',
  enforcement:  '#ef4444',
  school_zone:  '#22c55e',
  speed_camera: '#38bdf8',
};

const ZONE_LABELS: Record<string, string> = {
  speed_limit:  'Speed Limit',
  no_honking:   'No Honking',
  enforcement:  'Enforcement Zone',
  school_zone:  'School Zone',
  speed_camera: 'Speed Camera',
};

export default function MapPage() {
  const { countryName } = useLocationStore();
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || leafletRef.current) return;

    import('leaflet').then((L) => {
      if (!mapRef.current || leafletRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: false }).setView([28.6139, 77.2090], 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 1. Fetch Enforcement Zones
      fetch(`${API}/geo/enforcement-zones`)
        .then(res => res.json())
        .then(zones => {
          zones.forEach((zone: any) => {
            const color = ZONE_COLORS[zone.zone_type] || '#3b82f6';
            const lat = zone.latitude || zone.lat;
            const lng = zone.longitude || zone.lng;

            L.circle([lat, lng], {
              radius: zone.radius_meters || 500,
              color,
              fillColor: color,
              fillOpacity: 0.15,
              weight: 2,
            }).addTo(map)
              .bindPopup(`
                <div style="font-family:Inter,sans-serif;min-width:160px">
                  <strong style="color:#f1f5f9">${zone.name}</strong><br/>
                  <span style="color:#94a3b8;font-size:11px">${ZONE_LABELS[zone.zone_type] ?? zone.zone_type}</span>
                  ${zone.speed_limit_kmh ? `<br/><span style="color:#f59e0b;font-size:12px">Limit: ${zone.speed_limit_kmh} km/h</span>` : ''}
                </div>
              `);

            const icon = L.divIcon({
              className: '',
              html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px ${color}"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });
            L.marker([lat, lng], { icon }).addTo(map);
          });
          setMapReady(true);
        })
        .catch(() => setMapReady(true));

      // 2. Fetch SOS Facilities
      fetch(`${API}/sos/facilities`)
        .then(res => res.json())
        .then(facilities => {
          facilities.forEach((f: any) => {
            const icon = L.divIcon({
              className: '',
              html: `<div style="width:28px;height:28px;background:${f.facility_type === 'hospital' ? '#ef4444' : '#3b82f6'};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.5)">${f.facility_type === 'hospital' ? 'H' : 'P'}</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            L.marker([f.lat, f.lng], { icon }).addTo(map)
              .bindPopup(`
                <div style="font-family:Inter,sans-serif;min-width:180px">
                  <strong style="color:#f1f5f9">${f.name}</strong><br/>
                  <span style="color:#94a3b8;font-size:11px">${f.facility_type.toUpperCase()} · Emergency</span><br/>
                  <a href="tel:${f.phone}" style="display:block;margin-top:8px;padding:6px;background:#ef4444;color:white;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;font-size:12px">📞 CALL ${f.phone}</a>
                </div>
              `);
          });
        });

      leafletRef.current = map;
    });

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Enforcement & SOS Map — DriveLegal</title>
        <meta name="description" content="View enforcement zones and nearby emergency facilities on an interactive map." />
      </Head>

      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/5 bg-surface-900/60 backdrop-blur-md px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <MapIcon className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none">Safe Map & SOS</h1>
                <p className="text-[11px] text-slate-500 mt-0.5">{countryName} · Live Layers</p>
              </div>
            </div>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <span className="text-[10px] font-bold text-red-400 uppercase">Emergency SOS Live</span>
              </div>
              {Object.entries(ZONE_LABELS).slice(0, 3).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: ZONE_COLORS[key] }} />
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map container */}
        <div className="relative flex-1">
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-950 z-10">
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <p className="text-slate-400 text-sm">Synchronizing layers…</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" id="enforcement-map" />

          {/* SOS Floating Button */}
          <button 
            className="absolute bottom-24 right-4 z-[400] w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl shadow-red-500/50 transition-transform active:scale-95 group"
            onClick={() => alert("SOS Triggered! Calling nearest Trauma Centre...")}
          >
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-12 right-0 bg-red-600 text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">EMERGENCY SOS</span>
          </button>

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 z-[400]">
            <div className="glass-sm px-3 py-2 flex items-center gap-2 text-xs text-slate-400 border border-white/5">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              Click icons for emergency contact details
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
