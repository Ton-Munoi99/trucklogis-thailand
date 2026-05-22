// components/CalculatorPage.jsx — Route input panel + truck mini-cards
const { useState, useRef, useEffect, useCallback } = React;
const { scaledToll, estimateTravelDays, calculateTripCost } = window.CalcEngine;

// ── Autocomplete city search (Nominatim + local fallback) ─────────────────────
const CitySearch = ({ label, value, onSelect, placeholder, accent, showGeoBtn, onGeoClick, geoLoading }) => {
  const [query,   setQuery]   = useState(value?.name || '');
  const [open,    setOpen]    = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef  = useRef(null);
  const debTimer = useRef(null);

  useEffect(() => { setQuery(value?.name || ''); }, [value]);

  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = val => {
    setQuery(val);
    if (val.length < 1) { setResults([]); setOpen(false); return; }

    // Instant local results
    const lower = val.toLowerCase();
    const local = (window.AppData?.THAI_CITIES || []).filter(c =>
      c.name.toLowerCase().includes(lower) || c.province.toLowerCase().includes(lower)
    ).slice(0, 5).map(c => ({ ...c, lat: c.coords[0], lng: c.coords[1], source: 'local' }));

    setResults(local);
    setOpen(local.length > 0);

    // Debounced Nominatim (600ms)
    clearTimeout(debTimer.current);
    debTimer.current = setTimeout(async () => {
      if (!window.Routing) return;
      setLoading(true);
      try {
        const remote = await window.Routing.searchWithFallback(val);
        setResults(remote);
        setOpen(remote.length > 0);
      } catch (_) {}
      setLoading(false);
    }, 650);
  };

  const select = item => {
    const city = {
      name:   item.name,
      coords: [item.lat ?? item.coords?.[0], item.lng ?? item.coords?.[1]],
      province: item.province || '',
      type:   item.type || 'place',
    };
    setQuery(city.name);
    setOpen(false);
    onSelect(city);
  };

  const typeIcon = { city:'🏙', port:'⚓', warehouse:'🏭', industrial:'🏗', factory:'🏭', place:'📍', road:'🛣️' };
  const sourceBadge = s => s === 'nominatim' ? { bg:'#F0F9FF', color:'#0284C7', label:'OSM' } : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <span style={{
          position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
          width: 12, height: 12, borderRadius: '50%',
          background: accent || '#059669', flexShrink: 0,
        }}></span>
        {loading && (
          <span style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#94A3B8', animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
        )}
        <input
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => query.length > 0 && results.length > 0 && setOpen(true)}
          placeholder={placeholder || 'พิมพ์ชื่อจังหวัด เมือง โรงงาน ท่าเรือ... (Nominatim)'}
          style={{
            width: '100%', padding: '9px 32px 9px 28px',
            border: `1.5px solid ${open ? '#2563EB' : '#E2E8F0'}`,
            borderRadius: 8, fontSize: 13, fontFamily: 'Sarabun',
            color: '#0F172A', background: 'white', outline: 'none',
            transition: 'border-color 0.15s',
            boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); onSelect(null); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 14, padding: 2 }}>✕</button>
        )}
      </div>
      {/* Geolocation button */}
      {showGeoBtn && (
        <button onClick={onGeoClick} title="ใช้ตำแหน่งปัจจุบัน (GPS)"
          style={{
            width: 34, height: 34, borderRadius: 8, border: '1.5px solid #E2E8F0',
            background: geoLoading ? '#EFF6FF' : 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, flexShrink: 0, transition: 'all 0.15s',
          }}>
          {geoLoading ? <span style={{ animation: 'spin 0.8s linear infinite', display:'inline-block' }}>⟳</span> : '📍'}
        </button>
      )}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000,
          overflow: 'hidden', maxHeight: 280, overflowY: 'auto',
        }}>
          {results.map((c, i) => {
            const badge = sourceBadge(c.source);
            return (
              <div key={i} onClick={() => select(c)}
                style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <span style={{ fontSize: 15 }}>{typeIcon[c.type] || '📍'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{c.province}</div>
                </div>
                {badge && (
                  <span style={{ background: badge.bg, color: badge.color, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, flexShrink: 0 }}>{badge.label}</span>
                )}
              </div>
            );
          })}
          <div style={{ padding: '6px 14px', borderTop: '1px solid #F1F5F9', fontSize: 9.5, color: '#CBD5E1', display:'flex', alignItems:'center', gap:4 }}>
            <span>🌐</span> ค้นหาผ่าน OpenStreetMap Nominatim
          </div>
        </div>
      )}
    </div>
  );
};

// ── Trip type selector ────────────────────────────────────────────────────────
const TRIP_TYPES = [
  { id: 'oneWay',       label: 'เที่ยวเดียว',                    sub: 'ขาบรรทุกอย่างเดียว',          icon: '➡️' },
  { id: 'roundBoth',    label: 'ไป-กลับ (มีสินค้าทั้งสองทาง)', sub: 'บรรทุกทั้งขาไปและขากลับ',     icon: '↔️' },
  { id: 'loadedOutEmpty', label: 'ไปบรรทุก / กลับรถเปล่า',    sub: 'บรรทุกขาไป รถเปล่าขากลับ',    icon: '📦↩️' },
  { id: 'roundEmpty',   label: 'ไป-กลับพร้อม Backhaul',         sub: 'คำนวณ Backhaul Revenue',       icon: '🔄' },
];

// ── Truck mini card ───────────────────────────────────────────────────────────
const TruckMini = ({ t, selected, onClick }) => (
  <div onClick={onClick} style={{
    padding: '8px 10px', border: `2px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
    background: selected ? '#EFF6FF' : 'white',
    display: 'flex', alignItems: 'center', gap: 8,
  }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#BFDBFE'; }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#E2E8F0'; }}>
    <span style={{ fontSize: 18 }}>{t.icon}</span>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: selected ? '#2563EB' : '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.type}</div>
      <div style={{ fontSize: 10, color: '#94A3B8' }}>{t.wheels} ล้อ · {t.maxPayload} ต.</div>
    </div>
  </div>
);

// ── Editable param row ────────────────────────────────────────────────────────
const PRow = ({ label, value, onChange, unit, min, step, hint }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
    <label style={{ fontSize: 12, color: '#64748B', flex: '0 0 148px', lineHeight: 1.3 }}>{label}</label>
    <input type="number" value={value} min={min ?? 0} step={step ?? 'any'}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{ width: 80, padding: '5px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: 'IBM Plex Mono', textAlign: 'right', fontWeight: 600, color: '#2563EB', outline: 'none' }} />
    <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>{unit}</span>
    {hint && <span style={{ fontSize: 10, color: '#CBD5E1' }}>({hint})</span>}
  </div>
);

// ── Main calculator page ──────────────────────────────────────────────────────
const CalculatorPage = ({ truckProfiles, onResult, selectedTruckId, onTruckChange, fuelPrices, onMapPoints }) => {
  const trucks = truckProfiles || window.AppData.TRUCK_PROFILES;

  const [origin,      setOrigin]      = useState(null);
  const [dest,        setDest]        = useState(null);
  const [tripType,    setTripType]    = useState('loadedOutEmpty');
  const [routeInfo,   setRouteInfo]   = useState(null);
  const [routeSrc,    setRouteSrc]    = useState('');
  const [showParams,  setShowParams]  = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [error,       setError]       = useState('');
  const [showWeather, setShowWeather] = useState(false);
  const [freightRev,  setFreightRev]  = useState(0);
  const [backhaulRev, setBackhaulRev] = useState(0);

  const truck = trucks.find(t => t.id === selectedTruckId) || trucks[3];

  // Editable overrides (start from truck profile)
  const [params, setParams] = useState({
    loadedKmPerLiter: truck.loadedKmPerLiter,
    emptyKmPerLiter:  truck.emptyKmPerLiter,
    fuelPrice:        fuelPrices?.['ดีเซล B7']?.price || 33.64,
    cargoWeight:      truck.actualCargo,
    driverCostPerDay: truck.driverCostPerDay,
    helperCostPerDay: truck.helperCostPerDay,
    helperDays:       1,
    maintenanceCostPerKm: truck.maintenanceCostPerKm,
    tireCostPerKm:    truck.tireCostPerKm,
    loadingCost:      truck.loadingCost,
    permitCost:       truck.permitCost,
    otherCost:        truck.otherCost,
    tollOverride:     null,
  });

  // Sync params when truck changes
  useEffect(() => {
    setParams(p => ({
      ...p,
      loadedKmPerLiter: truck.loadedKmPerLiter,
      emptyKmPerLiter:  truck.emptyKmPerLiter,
      cargoWeight:      truck.actualCargo,
      driverCostPerDay: truck.driverCostPerDay,
      helperCostPerDay: truck.helperCostPerDay,
      maintenanceCostPerKm: truck.maintenanceCostPerKm,
      tireCostPerKm:    truck.tireCostPerKm,
      loadingCost:      truck.loadingCost,
      permitCost:       truck.permitCost,
      otherCost:        truck.otherCost,
    }));
  }, [selectedTruckId]);

  // Push map points up
  useEffect(() => {
    if (onMapPoints) onMapPoints(
      origin ? { ...origin, routeInfo: routeInfo } : null,
      dest    ? { ...dest } : null,
    );
  }, [origin, dest, routeInfo]);

  // Geolocation handler
  const handleGeoClick = async () => {
    if (!window.Routing) return;
    setGeoLoading(true);
    setError('');
    try {
      const pos  = await window.Routing.getCurrentPosition();
      const place = await window.Routing.reverseGeocode(pos.lat, pos.lng);
      setOrigin({ name: place.name, coords: [pos.lat, pos.lng], province: place.province, type: 'place' });
    } catch (e) {
      setError('📍 ' + (e.message || 'ไม่สามารถระบุตำแหน่งได้'));
    }
    setGeoLoading(false);
  };

  // Route info: async — tries HERE → OSRM → local matrix
  useEffect(() => {
    if (!origin || !dest) { setRouteInfo(null); setRouteSrc(''); return; }
    setRouteLoading(true);
    const truckParams = { grossWeight: truck.gvw * 1000, height: truck.height * 100, width: truck.width * 100, length: truck.length * 100, axleCount: truck.axles };
    (window.Routing ? window.Routing.getRouteInfo(origin.name, dest.name, origin.coords, dest.coords, truckParams)
                    : Promise.resolve(window.CalcEngine.getRouteInfo(origin.name, dest.name, origin.coords, dest.coords)))
      .then(info => {
        setRouteInfo(info);
        setRouteSrc(info?.source || 'local');
      })
      .catch(() => {
        const fallback = window.CalcEngine.getRouteInfo(origin.name, dest.name, origin.coords, dest.coords);
        setRouteInfo(fallback);
        setRouteSrc('local');
      })
      .finally(() => setRouteLoading(false));
  }, [origin?.name, dest?.name, selectedTruckId]);

  const setParam = (key, val) => setParams(p => ({ ...p, [key]: val }));

  // ── Calculate ──────────────────────────────────────────────────────────────
  const calculate = () => {
    if (!origin || !dest) { setError('กรุณาเลือกต้นทาง และปลายทาง'); return; }
    if (!routeInfo)       { setError('ไม่พบข้อมูลระยะทางสำหรับเส้นทางนี้'); return; }
    setError('');
    setCalculating(true);

    setTimeout(() => {
      const d = routeInfo.distance;
      const loaded  = tripType === 'roundBoth'   ? d * 2 : d;
      const empty   = tripType === 'loadedOutEmpty' || tripType === 'roundEmpty' ? d : 0;
      const toll    = params.tollOverride != null ? params.tollOverride : scaledToll(routeInfo.tollBase, truck.id);
      const days    = estimateTravelDays(loaded + empty, truck.avgSpeedKmh);
      const revenue = tripType === 'roundEmpty' ? (freightRev + backhaulRev) : freightRev;

      const r = calculateTripCost({
        loadedDistance: loaded, emptyDistance: empty,
        loadedKmPerLiter: params.loadedKmPerLiter,
        emptyKmPerLiter:  params.emptyKmPerLiter,
        fuelPrice: params.fuelPrice, tollCost: toll,
        driverDays: days, driverCostPerDay: params.driverCostPerDay,
        helperDays: params.helperDays, helperCostPerDay: params.helperCostPerDay,
        maintenanceCostPerKm: params.maintenanceCostPerKm,
        tireCostPerKm:        params.tireCostPerKm,
        loadingCost:  params.loadingCost,
        permitCost:   params.permitCost,
        otherCost:    params.otherCost,
        cargoWeight:  params.cargoWeight,
        freightRevenue: revenue,
      });

      onResult && onResult(r, truck.type, {
        originName:  origin?.name  || '',
        destName:    dest?.name    || '',
        tripType,
        travelTime:  routeInfo?.timeText || '',
        truckType:   truck.type,
        truckTypeEn: truck.typeEn || '',
        fuelType:    truck.fuelType || 'ดีเซล B7',
      });
      setCalculating(false);
    }, 600);
  };

  const swap = () => {
    setOrigin(dest);
    setDest(origin);
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>

      {/* ══ LEFT INPUT PANEL ══════════════════════════════════════════════════ */}
      <div style={{
        width: 340, flexShrink: 0,
        overflowY: 'auto', overflowX: 'hidden',
        minHeight: 0,                              /* ← fix flex scroll */
        borderRight: '1px solid #E2E8F0', background: 'white',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 16px 0' }}>

          {/* Route search */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🗺️</span> เลือกเส้นทาง
          </div>

          <CitySearch label="จุดเริ่มต้น (Origin)" value={origin} onSelect={setOrigin} accent="#059669"
            showGeoBtn onGeoClick={handleGeoClick} geoLoading={geoLoading} />

          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <button onClick={swap} title="สลับต้นทาง/ปลายทาง"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 20, width: 30, height: 30, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⇅
            </button>
          </div>

          <CitySearch label="จุดหมายปลายทาง (Destination)" value={dest} onSelect={setDest} accent="#DC2626" />

          {routeLoading && (
            <div style={{ marginTop: 8, background: '#F0F9FF', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#0284C7', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
              กำลังดึงข้อมูลเส้นทาง...
            </div>
          )}
          {routeInfo && !routeLoading && (
            <div style={{ marginTop: 8, background: '#F0F9FF', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 14, alignItems: 'center', border: '1px solid #BAE6FD' }}>
              <div><div style={{ fontSize: 10, color: '#0284C7' }}>ระยะทาง</div><div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{routeInfo.distance} กม.</div></div>
              <div><div style={{ fontSize: 10, color: '#0284C7' }}>เวลา</div><div style={{ fontWeight: 700, fontSize: 13 }}>{routeInfo.timeText}</div></div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>ค่าทางด่วน (ประมาณ)</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 11, color: '#0F172A' }}>฿{scaledToll(routeInfo.tollBase, truck.id).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: '#BAE6FD', marginTop: 1 }}>
                  {{osrm:'🛣 OSRM', here_truck:'🚛 HERE', local:'📋 Local'}[routeSrc] || '📋'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Weather widget (collapsible) ── */}
        {(origin || dest) && (
          <div style={{ padding: '0 16px' }}>
            <button
              onClick={() => setShowWeather(w => !w)}
              style={{ width:'100%', background:'none', border:'none', cursor:'pointer', padding:'8px 0', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13 }}>🌦</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:.4 }}>สภาพอากาศตามเส้นทาง</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:'#94A3B8', transform: showWeather ? 'rotate(180deg)' : 'none', display:'inline-block', transition:'transform 0.2s' }}>▼</span>
            </button>
            {showWeather && (
              <WeatherWidget
                originCoords={origin?.coords}
                destCoords={dest?.coords}
                originName={origin?.name}
                destName={dest?.name}
                show={true}
              />
            )}
          </div>
        )}

        <div style={{ margin: '14px 16px 0', height: 1, background: '#F1F5F9' }}></div>

        {/* Trip type */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>ประเภทเที่ยวรถ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {TRIP_TYPES.map(tt => (
              <div key={tt.id} onClick={() => setTripType(tt.id)}
                style={{ padding: '8px 12px', border: `1.5px solid ${tripType === tt.id ? '#2563EB' : '#E2E8F0'}`, borderRadius: 8, cursor: 'pointer', background: tripType === tt.id ? '#EFF6FF' : 'white', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{tt.icon}</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: tripType === tt.id ? '#2563EB' : '#0F172A' }}>{tt.label}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{tt.sub}</div>
                </div>
                {tripType === tt.id && <span style={{ marginLeft: 'auto', color: '#2563EB', fontSize: 14 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ margin: '14px 16px 0', height: 1, background: '#F1F5F9' }}></div>

        {/* Truck selection */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>ประเภทรถบรรทุก</div>
          {/* Scrollable truck grid — max 3 rows visible */}
          <div style={{ maxHeight: 168, overflowY: 'auto', overflowX: 'hidden', paddingRight: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {trucks.map(t => (
                <TruckMini key={t.id} t={t} selected={selectedTruckId === t.id} onClick={() => onTruckChange(t.id)} />
              ))}
            </div>
          </div>
          {/* Selected truck spec */}
          <div style={{ marginTop: 8, background: '#F8FAFC', borderRadius: 8, padding: '8px 12px', border: '1px solid #E2E8F0', fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{truck.icon} {truck.type}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', color: '#64748B' }}>
              {[
                ['บรรทุกสูงสุด', `${truck.maxPayload} ตัน`],
                ['GVW', `${truck.gvw} ตัน`],
                ['น้ำมันขาบรรทุก', `${truck.loadedKmPerLiter} กม./ล.`],
                ['น้ำมันขากลับ', `${truck.emptyKmPerLiter} กม./ล.`],
              ].map(([k,v]) => (
                <div key={k}><span style={{ color: '#94A3B8', fontSize: 11 }}>{k}: </span><b style={{ color: '#0F172A' }}>{v}</b></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ margin: '14px 16px 0', height: 1, background: '#F1F5F9' }}></div>

        {/* Cost parameters (collapsible) */}
        <div style={{ padding: '10px 16px 0' }}>
          <button onClick={() => setShowParams(p => !p)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: showParams ? 10 : 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 }}>⚙️ ปรับค่าพารามิเตอร์</span>
            <span style={{ fontSize: 12, color: '#94A3B8', transform: showParams ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
          </button>
          {showParams && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <PRow label="น้ำมันขาบรรทุก"        value={params.loadedKmPerLiter}     onChange={v=>setParam('loadedKmPerLiter',v)}     unit="กม./ลิตร" step="0.1" />
              <PRow label="น้ำมันขากลับ (เปล่า)"  value={params.emptyKmPerLiter}      onChange={v=>setParam('emptyKmPerLiter',v)}      unit="กม./ลิตร" step="0.1" />
              <PRow label="ราคาน้ำมัน"            value={params.fuelPrice}            onChange={v=>setParam('fuelPrice',v)}            unit="บาท/ลิตร" step="0.01" />
              <PRow label="น้ำหนักสินค้า"         value={params.cargoWeight}          onChange={v=>setParam('cargoWeight',v)}          unit="ตัน" step="0.5" />
              <PRow label="ค่าแรงคนขับ/วัน"       value={params.driverCostPerDay}     onChange={v=>setParam('driverCostPerDay',v)}     unit="บาท" />
              <PRow label="ค่าแรงผู้ช่วย/วัน"     value={params.helperCostPerDay}     onChange={v=>setParam('helperCostPerDay',v)}     unit="บาท" />
              <PRow label="จำนวนผู้ช่วย"          value={params.helperDays}           onChange={v=>setParam('helperDays',v)}           unit="คน" min={0} />
              <PRow label="ซ่อมบำรุง"             value={params.maintenanceCostPerKm} onChange={v=>setParam('maintenanceCostPerKm',v)} unit="บาท/กม." step="0.1" />
              <PRow label="ยาง"                   value={params.tireCostPerKm}        onChange={v=>setParam('tireCostPerKm',v)}        unit="บาท/กม." step="0.1" />
              <PRow label="โหลด/ขนถ่าย"          value={params.loadingCost}          onChange={v=>setParam('loadingCost',v)}          unit="บาท/เที่ยว" />
              <PRow label="ใบอนุญาต/เอกสาร"      value={params.permitCost}           onChange={v=>setParam('permitCost',v)}           unit="บาท" />
              <PRow label="อื่นๆ"                 value={params.otherCost}            onChange={v=>setParam('otherCost',v)}            unit="บาท" />
              <PRow label="ค่าทางด่วน (override)" value={params.tollOverride ?? (routeInfo ? scaledToll(routeInfo.tollBase, truck.id) : 0)} onChange={v=>setParam('tollOverride',v)} unit="บาท" />
              <PRow label="ค่าขนส่ง (Freight)"   value={freightRev} onChange={setFreightRev} unit="บาท" hint="เพื่อคำนวณกำไร" />
              {tripType === 'roundEmpty' && (
                <PRow label="Backhaul Revenue" value={backhaulRev} onChange={setBackhaulRev} unit="บาท" />
              )}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }}></div>

        {/* Error */}
        {error && (
          <div style={{ margin: '8px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Calculate button */}
        <div style={{ padding: '14px 16px' }}>
          <button onClick={calculate} disabled={calculating}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: calculating ? 'wait' : 'pointer',
              background: calculating ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Sarabun',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {calculating ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> กำลังคำนวณ...</>
            ) : (
              <><span>🧮</span> คำนวณต้นทุน</>
            )}
          </button>
        </div>
      </div>

      {/* ══ MAP fills remaining space ═══════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <TruckMap
          origin={origin ? { ...origin, routeInfo } : null}
          destination={dest}
          onOriginSelect={setOrigin}
          onDestSelect={setDest}
        />
      </div>
    </div>
  );
};

Object.assign(window, { CalculatorPage });
