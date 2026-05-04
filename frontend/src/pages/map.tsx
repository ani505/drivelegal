// This is our Map page. We use Leaflet for the map.
// It shows speed zones and emergency things like hospitals.
import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, Navigation, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useLocationStore } from '@/store/locationStore';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// some colors for the map circles
const COLORS: Record<string, string> = {
  speed_limit:  '#f59e0b',
  no_honking:   '#6366f1',
  enforcement:  '#ef4444',
  school_zone:  '#22c55e',
  speed_camera: '#38bdf8',
};

const LABELS: Record<string, string> = {
  speed_limit:  'Speed Limit',
  no_honking:   'No Honking',
  enforcement:  'Enforcement Zone',
  school_zone:  'School Zone',
  speed_camera: 'Speed Camera',
};

export default function MapPage() {
  const { countryName } = useLocationStore();
  
  // refs for the map div and the leaflet object
  const mapDivRef = useRef<HTMLDivElement>(null);
  const myMap = useRef<any>(null);
  
  const [isReady, setIsReady] = useState(false);

  // useeffect runs once when page loads
  useEffect(() => {
    if (typeof window === 'undefined' || myMap.current) return;

    // load leaflet dynamically
    import('leaflet').then((L) => {
      if (!mapDivRef.current || myMap.current) return;

      // create the map
      const mapInstance = L.map(mapDivRef.current, { zoomControl: false }).setView([28.6139, 77.2090], 11);
      
      // dark map theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Map data &copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapInstance);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

      // fetch enforcement zones from our api
      fetch(`${API}/geo/enforcement-zones`)
        .then(res => res.json())
        .then(data => {
          data.forEach((z: any) => {
            const zColor = COLORS[z.zone_type] || '#3b82f6';
            const lat = z.latitude || z.lat;
            const lng = z.longitude || z.lng;

            // draw a circle for the zone
            L.circle([lat, lng], {
              radius: z.radius_meters || 500,
              color: zColor,
              fillColor: zColor,
              fillOpacity: 0.2,
            }).addTo(mapInstance)
              .bindPopup(`<b>${z.name}</b><br/>${LABELS[z.zone_type] || z.zone_type}`);

            // a small dot in the middle
            L.marker([lat, lng], { 
              icon: L.divIcon({
                className: '',
                html: `<div style="width:10px;height:100%;border-radius:50%;background:${zColor};border:1px solid white"></div>`,
                iconSize: [10, 10],
              }) 
            }).addTo(mapInstance);
          });
          setIsReady(true);
        })
        .catch(err => {
          console.log("Error loading zones:", err);
          setIsReady(true);
        });

      // fetch emergency facilities (RoadSOS)
      fetch(`${API}/sos/facilities`)
        .then(res => res.json())
        .then(facs => {
          facs.forEach((f: any) => {
            const facIcon = L.divIcon({
              className: '',
              html: `<div style="width:30px;height:30px;background:${f.facility_type === 'hospital' ? '#ef4444' : '#3b82f6'};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3)">${f.facility_type === 'hospital' ? 'H' : 'P'}</div>`,
              iconSize: [30, 30],
            });
            
            L.marker([f.lat, f.lng], { icon: facIcon }).addTo(mapInstance)
              .bindPopup(`
                <div style="padding:5px">
                  <h4 style="margin:0;color:black">${f.name}</h4>
                  <p style="margin:5px 0;font-size:12px;color:#666">${f.facility_type} - Emergency</p>
                  <a href="tel:${f.phone}" style="background:#ef4444;color:white;padding:5px 10px;border-radius:5px;text-decoration:none;display:inline-block;margin-top:5px">Call: ${f.phone}</a>
                </div>
              `);
          });
        });

      myMap.current = mapInstance;
    });

    // cleanup map when leaving page
    return () => {
      myMap.current?.remove();
      myMap.current = null;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Safe Map & SOS - DriveLegal</title>
      </Head>

      {/* leaflet style */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* top header */}
        <div className="bg-surface-900 border-b border-white/5 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapIcon className="text-sky-400" />
            <h2 className="text-lg font-bold text-white">Interactive Safe Map</h2>
          </div>
          <div className="hidden sm:flex gap-4">
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="text-xs text-slate-400">SOS Active</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-xs text-slate-400">Speed Zones</span></div>
          </div>
        </div>

        {/* the actual map */}
        <div className="relative flex-1 bg-slate-900">
          {!isReady && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface-950">
               <Spinner />
            </div>
          )}
          <div ref={mapDivRef} className="w-full h-full" />

          {/* Big SOS button in corner */}
          <button 
            className="absolute bottom-10 right-6 z-[1000] w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-95"
            onClick={() => alert("SOS Triggered! Calling emergency services...")}
          >
            <AlertTriangle className="text-white w-8 h-8 animate-pulse" />
          </button>
        </div>
      </div>
    </>
  );
}
