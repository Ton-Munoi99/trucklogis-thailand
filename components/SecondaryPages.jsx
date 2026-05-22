// components/SecondaryPages.jsx
// FuelPricePage, ScenariosPage, SavedRoutesPage, ApiSettingsPage
const { useState, useEffect } = React;
const { calculateTripCost, fmtN, fmtTHB, fmtKm } = window.CalcEngine;

// ═══════════════════════════════════════════════════════════
// FUEL PRICE PAGE
// ═══════════════════════════════════════════════════════════
const FuelPricePage = ({ fuelPrices, onPricesChange }) => {
  const [prices, setPrices]     = useState({ ...fuelPrices });
  const [manualMode, setManual] = useState({ 'ดีเซล Premium': true, 'ไฟฟ้า (EV)': true });
  const [refreshing, setRefreshing] = useState(false);

  const statusBadge = (status) => {
    const sMap = {
      connected: { bg: '#ECFDF5', color: '#059669', dot: '#059669', label: 'Connected' },
      manual:    { bg: '#FFFBEB', color: '#D97706', dot: '#D97706', label: 'Manual Mode' },
      failed:    { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626', label: 'Failed' },
    };
    return sMap[status] || {};
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const updatePrice = (fuel, val) => {
    const updated = { ...prices, [fuel]: { ...prices[fuel], price: parseFloat(val) || 0 } };
    setPrices(updated);
    onPricesChange && onPricesChange(updated);
  };

  const fuelIcons = { 'ดีเซล B7': '🛢', 'ดีเซล B20': '🌿', 'ดีเซล Premium': '⭐', 'NGV': '💨', 'ไฟฟ้า (EV)': '⚡' };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>ราคาน้ำมันปัจจุบัน</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>ข้อมูลจาก PTT OilPrice & Bangchak Web Service · อัปเดตทุกวัน 06:00 น.</div>
        </div>
        <button onClick={handleRefresh}
          style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Sarabun', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>🔄</span>
          {refreshing ? 'กำลังอัปเดต...' : 'รีเฟรช'}
        </button>
      </div>

      {/* API Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { name: 'PTT OilPrice API', status: 'connected', last: '06:00 น.' },
          { name: 'Bangchak OilPrice API', status: 'manual', last: 'Manual Mode' },
          { name: 'Cache Duration', status: 'connected', last: '24 ชั่วโมง' },
        ].map(api => {
          const s = statusBadge(api.status);
          return (
            <div key={api.name} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }}></span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: s.color }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{api.name}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>อัปเดตล่าสุด: {api.last}</div>
            </div>
          );
        })}
      </div>

      {/* Price cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {Object.entries(prices).map(([fuel, data]) => {
          const s = statusBadge(manualMode[fuel] ? 'manual' : data.status);
          return (
            <div key={fuel} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', align: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 22 }}>{fuelIcons[fuel]}</div>
                <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{fuel}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>{data.source}</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>฿</span>
                <input type="number" value={data.price} step="0.01"
                  onChange={e => updatePrice(fuel, e.target.value)}
                  disabled={!manualMode[fuel] && data.status === 'connected'}
                  style={{ flex: 1, padding: '8px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 22, fontFamily: 'IBM Plex Mono', fontWeight: 800, color: '#2563EB', textAlign: 'center', background: 'white', outline: 'none', opacity: (!manualMode[fuel] && data.status === 'connected') ? 0.7 : 1 }} />
                <span style={{ fontSize: 13, color: '#64748B' }}>/ลิตร</span>
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Manual override</span>
                <div onClick={() => setManual(m => ({ ...m, [fuel]: !m[fuel] }))}
                  style={{ width: 36, height: 20, borderRadius: 10, background: manualMode[fuel] ? '#2563EB' : '#E2E8F0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 2, left: manualMode[fuel] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}></div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 8 }}>อัปเดต: {data.updated}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#0284C7' }}>
        <b>📡 Production API:</b> Backend เชื่อมต่อ PTT OR OilPrice Web Service (CurrentOilPrice / CurrentOilPriceProvincial) และ Bangchak OilPrice Web Service · Cache ราคา 24 ชั่วโมง · ไม่เปิดเผย API Key ฝั่ง Frontend
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENARIOS PAGE
// ═══════════════════════════════════════════════════════════
const ScenariosPage = () => {
  const scenarios = window.AppData.SCENARIOS;
  const results   = scenarios.map(s => calculateTripCost(s));

  const rows = [
    { label: 'เส้นทาง',             fn: (s) => s.route },
    { label: 'ประเภทรถ',            fn: (s) => s.truckType },
    { label: 'น้ำหนักสินค้า',       fn: (_, r) => fmtN(r.cargoWeight || 0, 1) + ' ตัน' },
    { label: 'ระยะทางรวม (กม.)',    fn: (_, r) => fmtN(r.totalDistance, 0) },
    { label: 'น้ำมันรวม (ลิตร)',    fn: (_, r) => fmtN(r.totalFuelUsed) },
    { label: 'ค่าน้ำมัน',           fn: (_, r) => fmtTHB(r.fuelCost) },
    { label: 'ค่าทางด่วน',          fn: (_, r) => fmtTHB(r.tollCost) },
    { label: 'ค่าแรงคนขับ+ผู้ช่วย', fn: (_, r) => fmtTHB(r.driverCost + r.helperCost) },
    { label: 'ซ่อมบำรุง + ยาง',    fn: (_, r) => fmtTHB(r.maintenanceCost + r.tireCost) },
    { label: 'โหลดสินค้า + อื่นๆ',  fn: (_, r) => fmtTHB(r.loadingCost + r.permitCost + r.otherCost) },
    { label: '▸ ต้นทุนรวม',         fn: (_, r) => fmtTHB(r.totalCost), bold: true, highlight: true },
    { label: '▸ ต้นทุน/กม.',        fn: (_, r) => fmtTHB(r.costPerKm), bold: true },
    { label: '▸ ต้นทุน/ตัน-กม.',    fn: (_, r) => fmtN(r.costPerTonKm) + ' ฿', bold: true },
    { label: 'ค่าขนส่ง (Freight)',   fn: (s, r) => s.freightRevenue ? fmtTHB(s.freightRevenue) : '—' },
    { label: '▸ กำไร/ขาดทุน',       fn: (_, r) => r.profit != null ? fmtTHB(r.profit) : '—', bold: true, profit: true },
  ];

  const bestCostIdx = results.indexOf(results.reduce((b, r) => r.totalCost < b.totalCost ? r : b, results[0]));
  const colors = ['#2563EB', '#059669', '#DC2626'];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>เปรียบเทียบ Scenario</div>
        <div style={{ fontSize: 13, color: '#64748B' }}>เส้นทาง: ขอนแก่น → กรุงเทพมหานคร | สินค้า: ปุ๋ย | ไปบรรทุก-กลับเปล่า (890 กม. รวม)</div>
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left', background: '#F8FAFC', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748B', borderBottom: '1px solid #E2E8F0', width: '28%' }}>รายการ</th>
              {scenarios.map((s, i) => (
                <th key={s.id} style={{ padding: '14px 16px', textAlign: 'center', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors[i] }}></span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{s.label}</span>
                    {i === bestCostIdx && (
                      <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100 }}>ต้นทุนต่ำสุด</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid #F8FAFC', background: row.highlight ? '#F0F9FF' : 'white' }}>
                <td style={{ padding: '10px 16px', fontSize: row.bold ? 13 : 12, fontWeight: row.bold ? 700 : 400, color: row.bold ? '#0F172A' : '#475569' }}>
                  {row.label}
                </td>
                {scenarios.map((s, i) => {
                  const val = row.fn(s, results[i]);
                  const isProfit = row.profit;
                  const profitNum = isProfit && results[i].profit;
                  const profitColor = isProfit ? (profitNum > 0 ? '#059669' : profitNum < 0 ? '#DC2626' : '#64748B') : (row.highlight ? colors[i] : '#0F172A');
                  return (
                    <td key={s.id} style={{ padding: '10px 16px', textAlign: 'center', borderLeft: '1px solid #F1F5F9', fontFamily: row.bold ? 'IBM Plex Mono' : 'Sarabun', fontWeight: row.bold ? 700 : 400, color: row.bold ? profitColor : '#475569', fontSize: row.bold ? 14 : 13 }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual cost bars */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>📊 เปรียบเทียบต้นทุนรวม (บาท/เที่ยว)</div>
        {results.map((r, i) => {
          const pct = (r.totalCost / Math.max(...results.map(x => x.totalCost)) * 100).toFixed(1);
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: colors[i] }}></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{scenarios[i].label}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{scenarios[i].cargoWeight} ตัน · {scenarios[i].loadedKmPerLiter} กม./ล.</span>
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 800, color: colors[i], fontSize: 15 }}>{fmtTHB(r.totalCost)}</span>
              </div>
              <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: colors[i], borderRadius: 5, transition: 'width 0.6s ease' }}></div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#1D4ED8' }}>
        <b>💡 วิเคราะห์:</b> รถเทรลเลอร์มีต้นทุน/เที่ยวสูงกว่า แต่ต้นทุน/ตัน-กม. ต่ำที่สุด เหมาะกับการขนส่งปริมาณมาก · รถ 10 ล้อสมดุลระหว่างต้นทุนและความยืดหยุ่น
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SAVED ROUTES PAGE
// ═══════════════════════════════════════════════════════════
const SavedRoutesPage = ({ onLoadRoute }) => {
  const [routes, setRoutes] = useState(window.AppData.SAVED_ROUTES);
  const [recalcing, setRecalcing] = useState(null);

  const recalc = (id) => {
    setRecalcing(id);
    setTimeout(() => {
      setRoutes(prev => prev.map(r => r.id === id
        ? { ...r, lastCalc: '13/05/2568', avgCost: Math.round(r.avgCost * (0.97 + Math.random() * 0.06)) }
        : r
      ));
      setRecalcing(null);
    }, 1200);
  };

  const cargoIcon = { 'ปุ๋ย': '🌱', 'ปุ๋ยเคมี': '🌱', 'สินค้าทั่วไป': '📦', 'วัตถุดิบอุตสาหกรรม': '🏭', 'สินค้าอุตสาหกรรม': '🏭', 'ปุ๋ย (เส้นทางตัวแทน)': '🌿' };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>เส้นทางที่บันทึกไว้</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>เส้นทางประจำของกองยาน สามารถคำนวณใหม่ด้วยราคาน้ำมันล่าสุดได้ทันที</div>
        </div>
        <button style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: '#2563EB', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Sarabun', color: 'white' }}>
          + เพิ่มเส้นทางใหม่
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {routes.map(r => (
          <div key={r.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18, transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{r.name}</div>
                <div style={{ display: 'flex', align: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{cargoIcon[r.cargo] || '📦'}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{r.cargo} · {r.cargoWeight} ตัน</span>
                </div>
              </div>
              <span style={{ background: '#F1F5F9', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#475569' }}>{r.truckType}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }}></span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{r.origin}</span>
                </div>
                <div style={{ marginLeft: 10, borderLeft: '1.5px dashed #CBD5E1', height: 8 }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626' }}></span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{r.destination}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>ระยะทาง</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 800, fontSize: 16, color: '#0F172A' }}>{r.distance} <span style={{ fontSize: 11 }}>กม.</span></div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.travelTime}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>ต้นทุนเฉลี่ย/เที่ยว</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 800, fontSize: 20, color: '#2563EB' }}>{fmtTHB(r.avgCost)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>คำนวณล่าสุด</div>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{r.lastCalc}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => recalc(r.id)} disabled={recalcing === r.id}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: recalcing === r.id ? '#93C5FD' : '#2563EB', color: 'white', cursor: recalcing === r.id ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Sarabun', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {recalcing === r.id ? '⏳ กำลังคำนวณ...' : '🔄 คำนวณราคาใหม่'}
              </button>
              <button onClick={() => onLoadRoute && onLoadRoute(r)}
                style={{ padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Sarabun', color: '#475569' }}>
                📊 ดูรายละเอียด
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// API SETTINGS PAGE
// ═══════════════════════════════════════════════════════════
const ApiSettingsPage = () => {
  const [saved, setSaved]   = useState(false);
  const [keys, setKeys]     = useState({
    googleMapsKey: '••••••••••••••••••••••••••••••••',
    hereApiKey:    '••••••••••••••••••••••••••••••••',
    geoapifyKey:   '••••••••••••••••••••••••••••••••',
    tollguruKey:   '••••••••••••••••••••••••••••••••',
  });
  const [settings, setSettings] = useState({
    cacheDuration: 24, distanceUnit: 'km', fuelUnit: 'liter', currency: 'THB',
    routeBuffer: 10, trafficDelay: 15, defaultMaintenance: 2.00,
    manualFuelFallback: 33.64,
  });

  const setKey = (k, v) => setKeys(p => ({ ...p, [k]: v }));
  const setSetting = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  const statuses = [
    { name: 'Google Maps JS API',  status: 'manual', detail: 'Prototype — จำลองด้วย OpenStreetMap' },
    { name: 'Google Places API',   status: 'manual', detail: 'Prototype — Autocomplete จำลอง' },
    { name: 'HERE Truck Routing',  status: 'manual', detail: 'Prototype — ต้องตั้งค่า API Key' },
    { name: 'TollGuru Toll API',   status: 'manual', detail: 'Prototype — ใช้ตาราง EXAT/Tollway' },
    { name: 'PTT OilPrice API',    status: 'connected', detail: 'Connected · Cache 24h' },
    { name: 'Bangchak OilPrice',   status: 'manual',    detail: 'Manual fallback' },
  ];

  const statusDot = { connected: '#059669', manual: '#D97706', failed: '#DC2626' };
  const statusLabel = { connected: 'Connected', manual: 'Manual Mode', failed: 'Failed' };

  const ApiKeyField = ({ label, keyName }) => {
    const [show, setShow] = useState(false);
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748B', marginBottom: 5 }}>{label}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type={show ? 'text' : 'password'} value={keys[keyName]} onChange={e => setKey(keyName, e.target.value)}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'IBM Plex Mono', color: '#0F172A', outline: 'none', background: 'white' }} />
          <button onClick={() => setShow(s => !s)}
            style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, color: '#64748B' }}>
            {show ? '🙈' : '👁'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>ตั้งค่า API / Data Source</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>สำหรับผู้ดูแลระบบเท่านั้น · API Keys เก็บใน Backend ไม่เปิดเผยฝั่ง Frontend</div>
        </div>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: saved ? '#059669' : '#2563EB', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Sarabun', transition: 'background 0.3s' }}>
          {saved ? '✓ บันทึกแล้ว' : '💾 บันทึกการตั้งค่า'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div>
          {/* API Status */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>สถานะ API</div>
            {statuses.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F8FAFC' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot[s.status], flexShrink: 0 }}></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.detail}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: statusDot[s.status], background: statusDot[s.status] + '15', padding: '2px 8px', borderRadius: 100 }}>
                  {statusLabel[s.status]}
                </span>
              </div>
            ))}
          </div>

          {/* API Endpoints */}
          <div style={{ background: '#0D1B2A', border: '1px solid #1E3A5F', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.4 }}>Backend API Endpoints</div>
            {[
              'POST /api/geocode', 'POST /api/place-autocomplete', 'POST /api/truck-route',
              'GET  /api/fuel-price/today', 'POST /api/toll-estimate',
              'POST /api/calculate-trip-cost', 'GET  /api/saved-routes', 'GET  /api/truck-profiles',
            ].map(ep => (
              <div key={ep} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#3B82F6', marginBottom: 5 }}>{ep}</div>
            ))}
          </div>
        </div>

        <div>
          {/* Map APIs */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>🗺 Map & Routing APIs</div>
            <ApiKeyField label="Google Maps API Key" keyName="googleMapsKey" />
            <ApiKeyField label="HERE Truck Routing API Key" keyName="hereApiKey" />
            <ApiKeyField label="Geoapify API Key" keyName="geoapifyKey" />
            <ApiKeyField label="TollGuru API Key" keyName="tollguruKey" />
          </div>

          {/* System settings */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>⚙️ System Settings</div>
            {[
              { label: 'Cache Duration (ชั่วโมง)', key: 'cacheDuration', unit: 'h' },
              { label: 'Route Buffer (%)', key: 'routeBuffer', unit: '%' },
              { label: 'Traffic Delay Default (%)', key: 'trafficDelay', unit: '%' },
              { label: 'Default Maintenance (บาท/กม.)', key: 'defaultMaintenance', unit: '฿/km', step: 0.1 },
              { label: 'Manual Fuel Fallback (บาท/ล.)', key: 'manualFuelFallback', unit: '฿/L', step: 0.01 },
            ].map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: '#64748B', flex: 1 }}>{s.label}</label>
                <input type="number" value={settings[s.key]} step={s.step || 1}
                  onChange={e => setSetting(s.key, parseFloat(e.target.value) || 0)}
                  style={{ width: 80, padding: '5px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: 'IBM Plex Mono', textAlign: 'right', fontWeight: 600, color: '#2563EB', outline: 'none' }} />
                <span style={{ fontSize: 11, color: '#94A3B8', minWidth: 30 }}>{s.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { FuelPricePage, ScenariosPage, SavedRoutesPage, ApiSettingsPage });
