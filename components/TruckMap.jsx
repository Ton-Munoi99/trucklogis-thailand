// components/TruckMap.jsx — Leaflet map wrapper
const { useState, useEffect, useRef } = React;

// ── POI icon factory ──────────────────────────────────────────────────────────
const POI_CONFIG = {
  fuel:       { color: '#F59E0B', emoji: '⛽', label: 'ปั๊มน้ำมัน' },
  rest_area:  { color: '#059669', emoji: '🛑', label: 'จุดพักรถ' },
  truck_stop: { color: '#2563EB', emoji: '🚛', label: 'ที่จอดรถบรรทุก' },
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function makePOIIcon(type) {
  const cfg = POI_CONFIG[type] || POI_CONFIG.rest_area;
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${cfg.color};color:white;width:26px;height:26px;border-radius:50%;
      border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;font-size:13px;
    ">${cfg.emoji}</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -16],
  });
}

const TruckMap = ({ origin, destination, onOriginSelect, onDestSelect, osrmGeometry, pois = [] }) => {
  const mapRef      = useRef(null);
  const mapInst     = useRef(null);
  const markerO     = useRef(null);
  const markerD     = useRef(null);
  const routeLine   = useRef(null);
  const poiLayer    = useRef(null);
  const cbOrigin    = useRef(onOriginSelect);
  const cbDest      = useRef(onDestSelect);

  // Keep callbacks current without re-creating the map
  useEffect(() => { cbOrigin.current = onOriginSelect; }, [onOriginSelect]);
  useEffect(() => { cbDest.current   = onDestSelect;   }, [onDestSelect]);

  // ── Icon factory ──────────────────────────────────────────────────────────
  const makeIcon = (color, letter) => L.divIcon({
    className: '',
    html: `<div style="
      background:${color};color:white;width:30px;height:30px;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:2.5px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;
    "><span style="transform:rotate(45deg)">${letter}</span></div>`,
    iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -32],
  });

  const iconA = makeIcon('#059669', 'A');
  const iconB = makeIcon('#DC2626', 'B');

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInst.current) return;

    mapInst.current = L.map(mapRef.current, {
      center: [13.5, 101.5], zoom: 6,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(mapInst.current);

    // OpenStreetMap — more reliable in preview environments
    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(mapInst.current);

    // Map click → popup with set-as-origin / set-as-dest
    mapInst.current.on('click', e => {
      const { lat, lng } = e.latlng;
      const popup = L.popup({ className: 'truck-popup' })
        .setLatLng([lat, lng])
        .setContent(`
          <div style="font-family:'Sarabun',sans-serif;min-width:200px;padding:4px">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px">📍 พิกัดที่เลือก</div>
            <div style="font-size:12px;color:#475569;margin-bottom:2px">Lat: ${lat.toFixed(5)}&nbsp;&nbsp;Lng: ${lng.toFixed(5)}</div>
            <div style="margin-top:10px;display:flex;gap:8px">
              <button onclick="window.__tmSetOrigin(${lat},${lng})"
                style="background:#059669;color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Sarabun',sans-serif;font-weight:600">
                ตั้งจุดเริ่ม
              </button>
              <button onclick="window.__tmSetDest(${lat},${lng})"
                style="background:#DC2626;color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Sarabun',sans-serif;font-weight:600">
                ตั้งปลายทาง
              </button>
            </div>
          </div>
        `)
        .openOn(mapInst.current);
    });

    // Global callbacks used by popup button onclick
    window.__tmSetOrigin = (lat, lng) => {
      if (cbOrigin.current) cbOrigin.current({ name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, coords: [lat, lng] });
      mapInst.current && mapInst.current.closePopup();
    };
    window.__tmSetDest = (lat, lng) => {
      if (cbDest.current) cbDest.current({ name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, coords: [lat, lng] });
      mapInst.current && mapInst.current.closePopup();
    };

    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, []);

  // ── Update markers & route line when points change ────────────────────────
  useEffect(() => {
    if (!mapInst.current) return;
    const map = mapInst.current;

    if (markerO.current) { markerO.current.remove(); markerO.current = null; }
    if (markerD.current) { markerD.current.remove(); markerD.current = null; }
    if (routeLine.current) { routeLine.current.remove(); routeLine.current = null; }

    const bounds = [];

    if (origin?.coords) {
      const originName = escapeHtml(origin.name || 'จุดเริ่มต้น');
      markerO.current = L.marker(origin.coords, { icon: iconA })
        .bindPopup(`<b style="font-family:'Sarabun',sans-serif">${originName}</b><br><small style="color:#475569">จุดเริ่มต้น</small>`)
        .addTo(map);
      bounds.push(origin.coords);
    }

    if (destination?.coords) {
      const destinationName = escapeHtml(destination.name || 'จุดหมาย');
      markerD.current = L.marker(destination.coords, { icon: iconB })
        .bindPopup(`<b style="font-family:'Sarabun',sans-serif">${destinationName}</b><br><small style="color:#475569">จุดหมาย</small>`)
        .addTo(map);
      bounds.push(destination.coords);
    }

    if (origin?.coords && destination?.coords) {
      // Prefer OSRM real geometry if available
      let pts;
      if (osrmGeometry && window.Routing) {
        pts = window.Routing.osrmGeometryToLatLngs(osrmGeometry);
      }
      // Fallback: curved bezier estimate
      if (!pts) {
        const lat1 = origin.coords[0], lon1 = origin.coords[1];
        const lat2 = destination.coords[0], lon2 = destination.coords[1];
        const midLat = (lat1 + lat2) / 2 + (lon2 - lon1) * 0.08;
        const midLon = (lon1 + lon2) / 2 - (lat2 - lat1) * 0.08;
        pts = [];
        for (let t = 0; t <= 1; t += 0.05) {
          const s = 1 - t;
          pts.push([
            s * s * lat1 + 2 * s * t * midLat + t * t * lat2,
            s * s * lon1 + 2 * s * t * midLon + t * t * lon2,
          ]);
        }
      }
      routeLine.current = L.polyline(pts, {
        color: osrmGeometry ? '#059669' : '#2563EB',
        weight: osrmGeometry ? 4 : 3,
        opacity: 0.85,
        dashArray: osrmGeometry ? null : '10 6',
      }).addTo(map);

      map.fitBounds(L.latLngBounds(bounds), { padding: [60, 60] });
    } else if (bounds.length === 1) {
      map.flyTo(bounds[0], 10, { duration: 1 });
    }
  }, [origin, destination, osrmGeometry]);

  // ── Resize fix when panel opens ───────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => mapInst.current && mapInst.current.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [origin, destination]);

  // ── POI markers layer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInst.current) return;
    // Clear existing POI layer
    if (poiLayer.current) { poiLayer.current.clearLayers(); }
    else { poiLayer.current = L.layerGroup().addTo(mapInst.current); }

    pois.forEach(poi => {
      const cfg = POI_CONFIG[poi.type] || POI_CONFIG.rest_area;
      const marker = L.marker([poi.lat, poi.lng], { icon: makePOIIcon(poi.type) });
      const name = escapeHtml(poi.name || cfg.label);
      const brand = escapeHtml(poi.brand);
      const opening = escapeHtml(poi.opening);
      const phone = escapeHtml(poi.phone);
      marker.bindPopup(`
        <div style="font-family:'Sarabun',sans-serif;min-width:180px;padding:4px">
          <div style="font-size:14px;margin-bottom:2px">${cfg.emoji} <b>${name}</b></div>
          ${brand    ? `<div style="font-size:11px;color:#475569">🏷 ${brand}</div>` : ''}
          ${opening  ? `<div style="font-size:11px;color:#475569">🕐 ${opening}</div>` : ''}
          ${phone    ? `<div style="font-size:11px;color:#475569">📞 ${phone}</div>` : ''}
          <div style="font-size:9px;color:#94A3B8;margin-top:4px">📍 ${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}</div>
          <div style="font-size:9px;color:#94A3B8">ข้อมูล: OpenStreetMap Overpass API</div>
        </div>
      `, { maxWidth: 220 });
      poiLayer.current.addLayer(marker);
    });
  }, [pois]);

  // ── Route info overlay ────────────────────────────────────────────────────
  const routeInfo = origin?.routeInfo;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#E8EDF2' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>

      {/* Route summary card */}
      {origin && destination && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 500,
          background: 'white', borderRadius: 12, padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', minWidth: 210, maxWidth: 240,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#94A3B8', marginBottom: 8 }}>
            เส้นทางที่เลือก
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', flexShrink: 0, marginTop: 3 }}></span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{origin.name}</span>
          </div>
          <div style={{ marginLeft: 14, borderLeft: '2px dashed #E2E8F0', height: 12, marginBottom: 4 }}></div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626', flexShrink: 0, marginTop: 3 }}></span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{destination.name}</span>
          </div>
          {origin?.routeInfo && (
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, display: 'flex', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>ระยะทาง</div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'IBM Plex Mono', color: '#2563EB' }}>
                  {origin.routeInfo.distance} <span style={{ fontSize: 11, fontWeight: 500 }}>กม.</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>เวลา</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{origin.routeInfo.timeText}</div>
              </div>
              {origin.routeInfo.source && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: '#94A3B8' }}>data source</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: origin.routeInfo.source === 'osrm' ? '#059669' : origin.routeInfo.source === 'here_truck' ? '#2563EB' : '#94A3B8' }}>
                    {{ osrm:'🛣 OSRM', here_truck:'🚛 HERE', local:'📋 Local' }[origin.routeInfo.source] || origin.routeInfo.source}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty-state hint */}
      {!origin && !destination && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 400,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
          borderRadius: 12, padding: '16px 22px', textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🗺️</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>เลือกต้นทาง-ปลายทาง</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>หรือคลิกบนแผนที่เพื่อตั้งจุด</div>
        </div>
      )}

      {origin?.routeInfo?.source === 'osrm' ? (
        <div style={{
          position: 'absolute', bottom: 28, left: 10, zIndex: 400,
          background: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: '4px 8px',
          fontSize: 10, color: '#059669', fontWeight: 700,
        }}>
          🛣 OSRM — เส้นทางถนนจริง (OpenStreetMap)
        </div>
      ) : (
        <div style={{
          position: 'absolute', bottom: 28, left: 10, zIndex: 400,
          background: 'rgba(255,255,255,0.88)', borderRadius: 6, padding: '4px 8px',
          fontSize: 10, color: '#94A3B8',
        }}>
          🔵 เส้นทางโดยประมาณ | Production: HERE Truck Routing (Free 250K/mo)
        </div>
      )}

      {/* Truck restriction warning banner */}
      {origin && destination && (
        <div style={{
          position: 'absolute', bottom: 28, right: 12, zIndex: 400,
          background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8,
          padding: '6px 12px', fontSize: 11, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 6, maxWidth: 260,
        }}>
          ⚠️ ตรวจสอบข้อจำกัดรถบรรทุกก่อนออกเดินทางจริง
        </div>
      )}
    </div>
  );
};

Object.assign(window, { TruckMap });
