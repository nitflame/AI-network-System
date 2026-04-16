import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Polygon } from 'react-leaflet';
import { ZONES } from '../lib/constants';

// Based on GITAM coordinates: 17.7829 N, 83.3772 E
const MAP_CENTER = [17.7831, 83.3768];

// Pre-compute coordinate offsets and aesthetics for the 5 zones
// to accurately represent them physically on a campus.
const ZONE_MAPPING = {
  Stadium: {
    center: [17.7800, 83.3745],
    colorBase: '#F87171',
    radiusBase: 50,
  },
  Academic_Block: {
    center: [17.7845, 83.3770],
    colorBase: '#4F8FF7',
    radiusBase: 40,
  },
  Hostel: {
    center: [17.7820, 83.3720],
    colorBase: '#A78BFA',
    radiusBase: 35,
  },
  Cafeteria: {
    center: [17.7830, 83.3755],
    colorBase: '#FBBF24',
    radiusBase: 25,
  },
  Library: {
    center: [17.7840, 83.3790],
    colorBase: '#22D3EE',
    radiusBase: 20,
  }
};

const getCongestionColor = (label, baseColor) => {
  if (label === 'HIGH') return '#F87171'; // Red pulse
  if (label === 'MEDIUM') return '#FBBF24'; // Yellow pulse
  if (label === 'LOW') return '#34D399'; // Green optimized
  return baseColor; // Default or loading
};

export default function LiveMap({ zoneData }) {
  // Use useMemo to prevent unnecessary re-renders of the heavy map wrapper
  const zonesToRender = useMemo(() => {
    return ZONES.map(z => {
      const geo = ZONE_MAPPING[z];
      if (!geo) return null;

      const sim = zoneData[z]?.simulation;
      const pred = zoneData[z]?.prediction;
      
      const activeColor = pred ? getCongestionColor(pred.congestion_label, geo.colorBase) : geo.colorBase;
      const isHigh = pred?.congestion_label === 'HIGH';
      
      // Dynamic radius based on user count to show physical "mass" of the network load
      const dynamicRadius = geo.radiusBase + (sim ? (sim.num_users_in_zone / 10) : 0);

      return {
        id: z,
        center: geo.center,
        color: activeColor,
        radius: dynamicRadius,
        strokeColor: isHigh ? '#F87171' : activeColor,
        sim,
        pred
      };
    }).filter(Boolean);
  }, [zoneData]);

  // Leaflet requires fixed height explicitly or it collapses
  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl border border-border-active bg-[#0d1117] z-0">
      <MapContainer 
        center={MAP_CENTER} 
        zoom={16} 
        style={{ height: '100%', width: '100%', background: '#0d1117' }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* World-class dark premium map tiles from CartoDB */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {zonesToRender.map((z) => (
          <React.Fragment key={z.id}>
            {/* Base physical ring */}
            <CircleMarker
              center={z.center}
              pathOptions={{
                color: z.strokeColor,
                fillColor: z.color,
                fillOpacity: 0.15,
                weight: z.pred?.congestion_label === 'HIGH' ? 3 : 1
              }}
              radius={Math.min(z.radius, 120)}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent className="map-tooltip">
                <div className="font-semibold" style={{ color: z.color, textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>
                  {z.id.replace('_', ' ')}
                </div>
              </Tooltip>
              <Popup className="premium-popup">
                <div className="bg-bg-elevated p-3 border border-border-active rounded-lg min-w-[150px]">
                  <div className="text-[12px] font-bold text-text-primary mb-2 border-b border-border-active pb-1">
                    {z.id.replace('_', ' ')}
                  </div>
                  {z.sim ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Users:</span>
                        <span className="font-mono text-text-primary">{z.sim.num_users_in_zone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Bandwidth:</span>
                        <span className="font-mono text-text-primary">{z.sim.bandwidth_usage.toFixed(1)} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Latency:</span>
                        <span className="font-mono text-text-primary">{z.sim.latency.toFixed(0)} ms</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border-active flex justify-between items-center">
                        <span className="text-text-muted uppercase text-[9px] font-bold tracking-wider">Status:</span>
                        <span className="font-bold text-[10px]" style={{ color: z.color }}>{z.pred?.congestion_label}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-text-muted">Loading sector telemetry...</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
            
            {/* Core Antenna marker */}
            <CircleMarker 
              center={z.center}
              radius={3}
              pathOptions={{ color: '#fff', fillColor: '#fff', fillOpacity: 0.8, weight: 1 }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
      
      {/* HUD overlay for map aesthetics */}
      <div className="absolute top-4 right-4 pointer-events-none z-[1000] flex gap-2">
         <div className="px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
            <span className="text-[10px] text-white/80 font-medium tracking-wider">HIGH LOAD</span>
         </div>
         <div className="px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-success" />
            <span className="text-[10px] text-white/80 font-medium tracking-wider">OPTIMAL</span>
         </div>
      </div>
      <div className="absolute top-4 left-4 pointer-events-none z-[1000]">
         <div className="px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="text-[11px] text-white/90 font-bold uppercase tracking-wider">Geospatial Topology</span>
         </div>
      </div>
    </div>
  );
}
