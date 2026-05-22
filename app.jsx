// app.jsx — Main application with sidebar navigation + page routing
const { useState, useCallback } = React;

// ── Navigation items ──────────────────────────────────────────────────────────
const NAV = [
  { id: 'calculator',   icon: '🧮', label: 'คำนวณต้นทุนเที่ยวรถ',      group: 'main' },
  { id: 'map',          icon: '🗺️', label: 'แผนที่เส้นทางรถบรรทุก',    group: 'main' },
  { id: 'trucks',       icon: '🚛', label: 'โปรไฟล์รถบรรทุก',          group: 'main' },
  { id: 'fuel',         icon: '⛽', label: 'ราคาน้ำมัน',               group: 'main' },
  { id: 'dashboard',    icon: '📊', label: 'Analytics Dashboard',       group: 'tools' },
  { id: 'export',       icon: '📤', label: 'Export & Reporting',        group: 'tools' },
  { id: 'scenarios',    icon: '🔄', label: 'เทียบ Scenario',            group: 'tools' },
  { id: 'saved',        icon: '📌', label: 'เส้นทางที่บันทึกไว้',       group: 'tools' },
  { id: 'triplog',      icon: '📋', label: 'ประวัติเที่ยวรถ',           group: 'tools' },
  { id: 'settings',     icon: '⚙️', label: 'ตั้งค่า API / Data Source', group: 'tools' },
];

const PAGE_TITLES = {
  calculator: { th: 'คำนวณต้นทุนเที่ยวรถ',     sub: 'Truck Trip Cost Calculator' },
  map:        { th: 'แผนที่เส้นทางรถบรรทุก',   sub: 'Interactive Truck Route Map' },
  trucks:     { th: 'โปรไฟล์รถบรรทุก',         sub: 'Fleet Vehicle Profiles' },
  fuel:       { th: 'ราคาน้ำมัน',              sub: 'Live Fuel Price Data Source' },
  dashboard:  { th: 'Analytics Dashboard',        sub: 'Fleet Cost · Trends · Efficiency' },
  export:     { th: 'Export & Reporting',         sub: 'PDF Reports · CSV Download · Print' },
  scenarios:  { th: 'เปรียบเทียบ Scenario',    sub: 'Multi-Truck Cost Comparison' },
  saved:      { th: 'เส้นทางที่บันทึกไว้',     sub: 'Saved Logistics Routes' },
  triplog:    { th: 'ประวัติเที่ยวรถ',             sub: 'Route History · Trip Log · CSV Export' },
  settings:   { th: 'ตั้งค่า API / Data Source', sub: 'System & API Configuration' },
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ active, setActive, fuelPrice }) => (
  <div style={{
    width: 240, background: '#0D1B2A', display: 'flex', flexDirection: 'column',
    height: '100vh', flexShrink: 0, borderRight: '1px solid #1A2E45',
  }}>
    {/* Logo */}
    <div style={{ padding: '18px 16px', borderBottom: '1px solid #1A2E45' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>🚛</div>
        <div>
          <div style={{ color: 'white', fontSize: 14, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>TruckLogis</div>
          <div style={{ color: '#4E7090', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Thailand Platform</div>
        </div>
      </div>
    </div>

    {/* Nav groups */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
      {['main', 'tools'].map(group => (
        <div key={group}>
          <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#2E4A61', padding: '10px 16px 4px' }}>
            {group === 'main' ? 'หลัก' : 'เครื่องมือ'}
          </div>
          {NAV.filter(n => n.group === group).map(item => (
            <div key={item.id} onClick={() => setActive(item.id)} data-nav-export={item.id === 'export' ? 'true' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', cursor: 'pointer',
                color: active === item.id ? '#FFFFFF' : '#5E7E9A',
                background: active === item.id ? 'rgba(37,99,235,0.18)' : 'transparent',
                borderLeft: `3px solid ${active === item.id ? '#2563EB' : 'transparent'}`,
                transition: 'all 0.14s', fontSize: 13.5, fontWeight: active === item.id ? 700 : 500,
              }}
              onMouseEnter={e => { if (active !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94A3B8'; } }}
              onMouseLeave={e => { if (active !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5E7E9A'; } }}>
              <span style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
              <span style={{ lineHeight: 1.3 }}>{item.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>

    {/* Fuel price badge */}
    <div style={{ padding: 14, borderTop: '1px solid #1A2E45' }}>
      <div style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#4E7090', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>ราคาน้ำมัน ดีเซล B7</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 20, fontWeight: 800, color: '#3B82F6', lineHeight: 1 }}>
          ฿{fuelPrice}
        </div>
        <div style={{ fontSize: 10, color: '#2E4A61', marginTop: 3 }}>บาท/ลิตร · PTT OilPrice</div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#2E4A61' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
        Prototype Mode · Mock Data
      </div>
    </div>
  </div>
);

// ── Top bar ───────────────────────────────────────────────────────────────────
const TopBar = ({ page, onNotice }) => {
  const info = PAGE_TITLES[page] || PAGE_TITLES.calculator;
  return (
    <div style={{
      height: 54, background: 'white', borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
      flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{info.th}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{info.sub}</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#92400E' }}>
          ⚠️ Prototype — Mock Data
        </span>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, cursor: 'pointer' }}>
          👤
        </div>
      </div>
    </div>
  );
};

// ── Map page (full-page map with real Nominatim search + Geolocation) ─────────
const MapPage = () => {
  const [origin,    setOrigin]    = useState(null);
  const [dest,      setDest]      = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [geoLoading,   setGeoLoading]   = useState(false);
  const [geoError,     setGeoError]     = useState('');
  const [originQuery,  setOriginQuery]  = useState('');
  const [destQuery,    setDestQuery]    = useState('');
  const [originRes,    setOriginRes]    = useState([]);
  const [destRes,      setDestRes]      = useState([]);

  // ── POI layer state ──────────────────────────────────────────────────────
  const [poiLayers,  setPoiLayers]  = useState({ fuel: false, rest_area: false, truck_stop: false });
  const [pois,       setPois]       = useState([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const [poiCounts,  setPoiCounts]  = useState({});
  const [originOpen,   setOriginOpen]   = useState(false);
  const [destOpen,     setDestOpen]     = useState(false);
  const debO = React.useRef(null);
  const debD = React.useRef(null);

  const search = async (val, setRes, setOpen) => {
    if (!val || val.length < 2) { setRes([]); setOpen(false); return; }
    const lower = val.toLowerCase();
    const local = (window.AppData?.THAI_CITIES || [])
      .filter(c => c.name.toLowerCase().includes(lower) || c.province.toLowerCase().includes(lower))
      .slice(0, 5).map(c => ({ ...c, lat: c.coords[0], lng: c.coords[1], source: 'local' }));
    setRes(local); setOpen(local.length > 0);
    if (window.Routing) {
      const remote = await window.Routing.searchWithFallback(val);
      setRes(remote); setOpen(remote.length > 0);
    }
  };

  const selectOrigin = item => {
    const p = { name: item.name, coords: [item.lat ?? item.coords?.[0], item.lng ?? item.coords?.[1]], province: item.province, type: item.type };
    setOrigin(p); setOriginQuery(item.name); setOriginOpen(false);
  };
  const selectDest = item => {
    const p = { name: item.name, coords: [item.lat ?? item.coords?.[0], item.lng ?? item.coords?.[1]], province: item.province, type: item.type };
    setDest(p); setDestQuery(item.name); setDestOpen(false);
  };

  const handleGeo = async () => {
    if (!window.Routing) return;
    setGeoLoading(true); setGeoError('');
    try {
      const pos   = await window.Routing.getCurrentPosition();
      const place = await window.Routing.reverseGeocode(pos.lat, pos.lng);
      selectOrigin({ ...place, lat: pos.lat, lng: pos.lng });
      setOriginQuery(place.name);
    } catch (e) { setGeoError(e.message || 'ไม่สามารถระบุตำแหน่งได้'); }
    setGeoLoading(false);
  };

  // Fetch OSRM route when both points selected
  React.useEffect(() => {
    if (!origin || !dest) { setRouteInfo(null); return; }
    setRouteLoading(true);
    (window.Routing ? window.Routing.getRouteInfo(origin.name, dest.name, origin.coords, dest.coords)
                    : Promise.resolve(window.CalcEngine.getRouteInfo(origin.name, dest.name, origin.coords, dest.coords)))
      .then(info => setRouteInfo(info))
      .catch(() => setRouteInfo(window.CalcEngine.getRouteInfo(origin.name, dest.name, origin.coords, dest.coords)))
      .finally(() => setRouteLoading(false));
  }, [origin?.name, dest?.name]);

  // Fetch POIs when layers toggled or route changes
  React.useEffect(() => {
    const activeTypes = Object.entries(poiLayers).filter(([,v])=>v).map(([k])=>k);
    if (!activeTypes.length || (!origin && !dest)) { setPois([]); setPoiCounts({}); return; }
    setPoiLoading(true);
    const oCoords = origin?.coords || dest?.coords;
    const dCoords = dest?.coords   || origin?.coords;
    window.Routing?.getRoutePOIs(oCoords, dCoords, activeTypes)
      .then(data => {
        // Filter to only active types
        const filtered = data.filter(p => activeTypes.includes(p.type));
        setPois(filtered);
        const counts = {};
        activeTypes.forEach(t => { counts[t] = filtered.filter(p=>p.type===t).length; });
        setPoiCounts(counts);
      })
      .catch(() => setPois([]))
      .finally(() => setPoiLoading(false));
  }, [poiLayers, origin?.name, dest?.name]);

  const typeIcon = { city:'🏙', port:'⚓', warehouse:'🏭', industrial:'🏗', factory:'🏭', place:'📍' };
  const srcLabel = { osrm:'🛣 OSRM (ถนนจริง)', here_truck:'🚛 HERE Truck', local:'📋 Local estimate' };

  const SearchBox = ({ label, query, setQuery, results, open, setOpen, onSelect, accent, debRef }) => (
    <div style={{ position:'relative' }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ display:'flex', gap:5 }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', width:9, height:9, borderRadius:'50%', background: accent }}></span>
          <input value={query}
            onChange={e => { setQuery(e.target.value); clearTimeout(debRef.current); debRef.current = setTimeout(() => search(e.target.value, results.setter || (() => {}), setOpen), 600); setQuery(e.target.value); search(e.target.value, (v) => {}, () => {}); }}
            onFocus={() => query.length > 0 && setOpen(true)}
            placeholder="ค้นหาผ่าน Nominatim..."
            style={{ width:'100%', padding:'8px 8px 8px 23px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:12, fontFamily:'Sarabun', outline:'none', color:'#0F172A' }}
          />
        </div>
      </div>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 3px)', left:0, right:0, background:'white', border:'1px solid #E2E8F0', borderRadius:8, boxShadow:'0 6px 20px rgba(0,0,0,0.1)', zIndex:1000, maxHeight:200, overflowY:'auto' }}>
          {results.map((r,i) => (
            <div key={i} onClick={() => onSelect(r)}
              style={{ padding:'8px 12px', cursor:'pointer', display:'flex', gap:8, alignItems:'center', fontSize:12 }}
              onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
              onMouseLeave={e=>e.currentTarget.style.background='white'}>
              <span>{typeIcon[r.type]||'📍'}</span>
              <div>
                <div style={{ fontWeight:600, color:'#0F172A' }}>{r.name}</div>
                <div style={{ fontSize:10, color:'#94A3B8' }}>{r.province}</div>
              </div>
              {r.source==='nominatim' && <span style={{ marginLeft:'auto', fontSize:9, background:'#F0F9FF', color:'#0284C7', padding:'1px 5px', borderRadius:100 }}>OSM</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Simplified inline search (avoid complex prop threading)
  const [oRes, setORes] = useState([]);
  const [dRes, setDRes] = useState([]);

  const handleOQuery = val => {
    setOriginQuery(val);
    clearTimeout(debO.current);
    debO.current = setTimeout(async () => {
      if (!val || val.length < 2) { setORes([]); setOriginOpen(false); return; }
      const r = window.Routing ? await window.Routing.searchWithFallback(val) : (window.AppData?.THAI_CITIES||[]).filter(c=>c.name.includes(val)).slice(0,6).map(c=>({...c,lat:c.coords[0],lng:c.coords[1]}));
      setORes(r); setOriginOpen(r.length > 0);
    }, 600);
  };
  const handleDQuery = val => {
    setDestQuery(val);
    clearTimeout(debD.current);
    debD.current = setTimeout(async () => {
      if (!val || val.length < 2) { setDRes([]); setDestOpen(false); return; }
      const r = window.Routing ? await window.Routing.searchWithFallback(val) : (window.AppData?.THAI_CITIES||[]).filter(c=>c.name.includes(val)).slice(0,6).map(c=>({...c,lat:c.coords[0],lng:c.coords[1]}));
      setDRes(r); setDestOpen(r.length > 0);
    }, 600);
  };

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* ── Sidebar ── */}
      <div style={{ width:290, background:'white', borderRight:'1px solid #E2E8F0', padding:14, display:'flex', flexDirection:'column', gap:10, overflowY:'auto', flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'#0F172A', textTransform:'uppercase', letterSpacing:0.5 }}>🗺 ค้นหาเส้นทาง</div>

        {/* Origin search */}
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>ต้นทาง / Origin</div>
          <div style={{ display:'flex', gap:5 }}>
            <div style={{ position:'relative', flex:1 }}>
              <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', width:9, height:9, borderRadius:'50%', background:'#059669' }}></span>
              <input value={originQuery} onChange={e=>handleOQuery(e.target.value)} onFocus={()=>oRes.length>0&&setOriginOpen(true)}
                placeholder="ค้นหาต้นทาง..."
                style={{ width:'100%', padding:'8px 8px 8px 22px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:12, fontFamily:'Sarabun', outline:'none', color:'#0F172A' }}
              />
            </div>
            <button onClick={handleGeo} title="ตำแหน่งปัจจุบัน"
              style={{ width:32, height:32, borderRadius:7, border:'1.5px solid #E2E8F0', background:'white', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {geoLoading ? <span style={{ animation:'spin 0.8s linear infinite', display:'inline-block' }}>⟳</span> : '📍'}
            </button>
          </div>
          {originOpen && oRes.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 3px)', left:0, right:0, background:'white', border:'1px solid #E2E8F0', borderRadius:8, boxShadow:'0 6px 20px rgba(0,0,0,0.1)', zIndex:1000, maxHeight:200, overflowY:'auto' }}>
              {oRes.map((r,i) => (
                <div key={i} onClick={()=>{ selectOrigin(r); setORes([]); setOriginOpen(false); }}
                  style={{ padding:'8px 12px', cursor:'pointer', display:'flex', gap:8, alignItems:'center', fontSize:12 }}
                  onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <span>{typeIcon[r.type]||'📍'}</span>
                  <div><div style={{ fontWeight:600 }}>{r.name}</div><div style={{ fontSize:10, color:'#94A3B8' }}>{r.province}</div></div>
                  {r.source==='nominatim' && <span style={{ marginLeft:'auto', fontSize:9, background:'#F0F9FF', color:'#0284C7', padding:'1px 5px', borderRadius:100 }}>OSM</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {geoError && <div style={{ fontSize:11, color:'#DC2626', background:'#FEF2F2', borderRadius:6, padding:'6px 10px' }}>⚠️ {geoError}</div>}

        {/* Dest search */}
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>ปลายทาง / Destination</div>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', width:9, height:9, borderRadius:'50%', background:'#DC2626' }}></span>
            <input value={destQuery} onChange={e=>handleDQuery(e.target.value)} onFocus={()=>dRes.length>0&&setDestOpen(true)}
              placeholder="ค้นหาปลายทาง..."
              style={{ width:'100%', padding:'8px 8px 8px 22px', border:'1.5px solid #E2E8F0', borderRadius:7, fontSize:12, fontFamily:'Sarabun', outline:'none', color:'#0F172A' }}
            />
          </div>
          {destOpen && dRes.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 3px)', left:0, right:0, background:'white', border:'1px solid #E2E8F0', borderRadius:8, boxShadow:'0 6px 20px rgba(0,0,0,0.1)', zIndex:1000, maxHeight:200, overflowY:'auto' }}>
              {dRes.map((r,i) => (
                <div key={i} onClick={()=>{ selectDest(r); setDRes([]); setDestOpen(false); }}
                  style={{ padding:'8px 12px', cursor:'pointer', display:'flex', gap:8, alignItems:'center', fontSize:12 }}
                  onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <span>{typeIcon[r.type]||'📍'}</span>
                  <div><div style={{ fontWeight:600 }}>{r.name}</div><div style={{ fontSize:10, color:'#94A3B8' }}>{r.province}</div></div>
                  {r.source==='nominatim' && <span style={{ marginLeft:'auto', fontSize:9, background:'#F0F9FF', color:'#0284C7', padding:'1px 5px', borderRadius:100 }}>OSM</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Route result card */}
        {routeLoading && (
          <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#0284C7', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ animation:'spin 0.8s linear infinite', display:'inline-block' }}>⟳</span> กำลังดึงข้อมูลเส้นทาง...
          </div>
        )}
        {routeInfo && !routeLoading && (
          <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:8, padding:'12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div><div style={{ fontSize:9.5, color:'#0284C7' }}>ระยะทาง</div><div style={{ fontFamily:'IBM Plex Mono', fontWeight:800, fontSize:18, color:'#0F172A' }}>{routeInfo.distance} <span style={{fontSize:10}}>กม.</span></div></div>
              <div style={{textAlign:'right'}}><div style={{ fontSize:9.5, color:'#0284C7' }}>เวลา</div><div style={{ fontWeight:700, fontSize:14 }}>{routeInfo.timeText}</div></div>
            </div>
            <div style={{ fontSize:9.5, color:'#94A3B8' }}>{srcLabel[routeInfo.source] || '📋 Local estimate'}</div>
          </div>
        )}

        <div style={{ fontSize:10.5, color:'#94A3B8', textAlign:'center', marginTop:4 }}>หรือคลิกบนแผนที่เพื่อตั้งจุด</div>

        {/* ── POI Layer Toggles ── */}
        <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:9, padding:'10px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontSize:10.5, fontWeight:800, color:'#0F172A', textTransform:'uppercase', letterSpacing:0.5 }}>
              📍 ชั้นข้อมูลแผนที่
            </div>
            {poiLoading && <span style={{ fontSize:10, color:'#0284C7', display:'flex', gap:4, alignItems:'center' }}><span style={{ animation:'spin 0.8s linear infinite', display:'inline-block' }}>⟳</span> โหลด...</span>}
          </div>
          {[
            { key:'fuel',       emoji:'⛽', label:'ปั๊มน้ำมัน',       color:'#F59E0B' },
            { key:'rest_area',  emoji:'🛑', label:'จุดพักรถ',          color:'#059669' },
            { key:'truck_stop', emoji:'🚛', label:'ที่จอดรถบรรทุก',    color:'#2563EB' },
          ].map(layer => (
            <div key={layer.key}
              onClick={() => setPoiLayers(p => ({ ...p, [layer.key]: !p[layer.key] }))}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:7, cursor:'pointer', marginBottom:3, background: poiLayers[layer.key] ? layer.color+'15' : 'transparent', border:`1px solid ${poiLayers[layer.key] ? layer.color+'50' : 'transparent'}`, transition:'all 0.15s' }}>
              <span style={{ fontSize:15 }}>{layer.emoji}</span>
              <span style={{ fontSize:12, fontWeight:600, color: poiLayers[layer.key] ? '#0F172A' : '#64748B', flex:1 }}>{layer.label}</span>
              {poiCounts[layer.key] != null && poiLayers[layer.key] && (
                <span style={{ background: layer.color, color:'white', fontSize:9.5, fontWeight:700, padding:'1px 7px', borderRadius:100 }}>{poiCounts[layer.key]}</span>
              )}
              <div style={{ width:32, height:18, borderRadius:9, background: poiLayers[layer.key] ? layer.color : '#E2E8F0', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:2, left: poiLayers[layer.key] ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}></div>
              </div>
            </div>
          ))}
          <div style={{ fontSize:9.5, color:'#CBD5E1', marginTop:6, textAlign:'center' }}>
            ข้อมูลจาก Overpass API (OpenStreetMap) · ฟรี
          </div>
          {!origin && !dest && (
            <div style={{ fontSize:10.5, color:'#94A3B8', marginTop:4, textAlign:'center' }}>เลือกเส้นทางก่อนเปิดชั้นข้อมูล</div>
          )}
        </div>

        {/* Weather widget */}
        {(origin || dest) && (
          <WeatherWidget
            originCoords={origin?.coords}
            destCoords={dest?.coords}
            originName={origin?.name}
            destName={dest?.name}
            show={true}
            compact={true}
          />
        )}

        {/* Free APIs badge */}
        <div style={{ marginTop:'auto', background:'#0D1B2A', borderRadius:8, padding:'10px 12px' }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:'#4E7090', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Free APIs ที่ใช้</div>
          {[
            { icon:'🌐', name:'Nominatim (OSM)', cost:'ฟรี' },
            { icon:'🛣', name:'OSRM Routing',    cost:'ฟรี' },
            { icon:'📍', name:'Geolocation API', cost:'ฟรี' },
            { icon:'🗺', name:'OSM Tiles',       cost:'ฟรี' },
            { icon:'🌦', name:'Open-Meteo',      cost:'ฟรี' },
            { icon:'🏪', name:'Overpass API',    cost:'ฟรี' },
          ].map(a => (
            <div key={a.name} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#5E7E9A', padding:'3px 0', borderBottom:'1px solid #1A2E45' }}>
              <span>{a.icon} {a.name}</span>
              <span style={{ color:'#059669', fontWeight:700 }}>{a.cost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex:1 }}>
        <TruckMap
          origin={origin ? { ...origin, routeInfo } : null}
          destination={dest}
          onOriginSelect={selectOrigin}
          onDestSelect={selectDest}
          osrmGeometry={routeInfo?.geometry}
          pois={pois}
        />
      </div>
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────────────────────────
const App = () => {
  const [activePage,    setActivePage]    = useState('calculator');
  const [selectedTruck, setSelectedTruck] = useState('truck10');
  const [calcResult,    setCalcResult]    = useState(null);
  const [calcTruckName, setCalcTruckName] = useState('');
  const [calcContext,   setCalcContext]   = useState(null);
  const [lastCalcDate,  setLastCalcDate]  = useState('');
  const [fuelPrices,    setFuelPrices]    = useState(window.AppData.FUEL_PRICES);

  const handleResult = useCallback((result, truckName, context) => {
    setCalcResult(result);
    setCalcTruckName(truckName);
    setCalcContext(context || {});
    const dateStr = new Date().toLocaleDateString('th-TH');
    setLastCalcDate(dateStr);

    // Save to ExportBridge for reports
    if (window.ExportBridge) {
      window.ExportBridge.save({
        ...result,
        truckType:   truckName,
        truckTypeEn: context?.truckTypeEn || '',
        originName:  context?.originName  || '',
        destName:    context?.destName    || '',
        tripType:    context?.tripType    || '',
        travelTime:  context?.travelTime  || '',
        fuelType:    context?.fuelType    || 'ดีเซล B7',
      });
    }

    // Scroll to results
    setTimeout(() => {
      const scroller = document.querySelector('[data-page-scroll="1"]');
      const el = document.getElementById('results-anchor');
      if (scroller && el) {
        const top = el.offsetTop;
        scroller.scrollTop = top;
      }
    }, 300);
  }, []);

  const handleLoadRoute = useCallback((route) => {
    setActivePage('calculator');
  }, []);

  const currentFuelB7 = fuelPrices['ดีเซล B7']?.price?.toFixed(2) || '33.64';

  const renderPage = () => {
    switch (activePage) {

      case 'calculator':
        return (
          <div data-page-scroll="1" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
            {/* ── Calculator + Map: full viewport height ── */}
            <div style={{ height: 'calc(100vh - 54px)', minHeight: 560, display: 'flex', overflow: 'hidden' }}>
              <CalculatorPage
                truckProfiles={window.AppData.TRUCK_PROFILES}
                onResult={handleResult}
                selectedTruckId={selectedTruck}
                onTruckChange={setSelectedTruck}
                fuelPrices={fuelPrices}
              />
            </div>
            {/* ── Results: scrolls into view below the map ── */}
            {calcResult ? (
              <div id="results-anchor" style={{ borderTop: '2px solid #2563EB', background: 'white' }}>
                <ResultsPanel result={calcResult} truckName={calcTruckName} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#94A3B8', gap: 12, background: 'white', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 40 }}>🧮</span>
                <div style={{ fontSize: 15, fontWeight: 600 }}>กดปุ่ม "คำนวณต้นทุน" เพื่อดูผลลัพธ์</div>
                <div style={{ fontSize: 13 }}>เลือกต้นทาง · ปลายทาง · ประเภทรถ แล้วคลิกคำนวณ</div>
              </div>
            )}
          </div>
        );

      case 'map':
        return <MapPage />;

      case 'trucks':
        return <div style={{ height: '100%', overflowY: 'auto' }}><TruckProfilePage /></div>;

      case 'fuel':
        return <div style={{ height: '100%', overflowY: 'auto' }}><FuelPricePage fuelPrices={fuelPrices} onPricesChange={setFuelPrices} /></div>;

      case 'scenarios':
        return <div style={{ height: '100%', overflowY: 'auto' }}><ScenariosPage /></div>;

      case 'saved':
        return <div style={{ height: '100%', overflowY: 'auto' }}><SavedRoutesPage onLoadRoute={handleLoadRoute} /></div>;

      case 'dashboard':
        return <div style={{ height:'100%', overflowY:'auto', background:'#F0F4F8' }}><DashboardPage /></div>;

      case 'export':
        return <div style={{ height: '100%', overflowY: 'auto' }}><ExportPage lastCalcDate={lastCalcDate} /></div>;

      case 'triplog':
        return <div style={{ height:'100%', overflowY:'auto', background:'#F0F4F8' }}><TripLogPage /></div>;

      case 'settings':
        return <div style={{ height: '100%', overflowY: 'auto' }}><ApiSettingsPage /></div>;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar active={activePage} setActive={setActivePage} fuelPrice={currentFuelB7} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <TopBar page={activePage} />
        <div style={{ flex: 1, overflow: activePage === 'calculator' ? 'hidden' : 'hidden', position: 'relative', background: activePage === 'calculator' || activePage === 'map' ? 'white' : '#F0F4F8' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
