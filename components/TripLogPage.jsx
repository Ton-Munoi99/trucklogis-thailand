// components/TripLogPage.jsx — Route History & Trip Log
const { useState, useEffect, useRef } = React;
const { fmtN, fmtTHB, calculateTripCost } = window.CalcEngine;

// ── localStorage helpers ──────────────────────────────────────────────────────
const LOG_KEY = 'tl_trip_log_v1';

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLog(log) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch {}
}

// ── Seed with demo data if empty ──────────────────────────────────────────────
function seedIfEmpty(log) {
  if (log.length > 0) return log;
  const base = [
    { origin:'ขอนแก่น', dest:'กรุงเทพมหานคร', truck:'รถ 10 ล้อ', cargo:'ปุ๋ยเคมี', cargoWeight:12, distance:445, fuelCost:4677, tollCost:560, laborCost:1200, maintenanceCost:1780, tireCost:623, loadingCost:1800, otherCost:300, totalCost:10940, costPerKm:12.30, costPerTonKm:2.05, profit:7060, freightRevenue:18000, status:'completed', plate:'กข-1234 ขก' },
    { origin:'นครหลวง', dest:'แหลมฉบัง', truck:'รถเทรลเลอร์', cargo:'สินค้าอุตสาหกรรม', cargoWeight:20, distance:165, fuelCost:2380, tollCost:680, laborCost:1650, maintenanceCost:1155, tireCost:495, loadingCost:3000, otherCost:600, totalCost:9960, costPerKm:60.36, costPerTonKm:3.02, profit:5040, freightRevenue:15000, status:'completed', plate:'บค-5678 อย' },
    { origin:'กรุงเทพมหานคร', dest:'เชียงใหม่', truck:'รถ 10 ล้อ', cargo:'สินค้าทั่วไป', cargoWeight:10, distance:687, fuelCost:7240, tollCost:420, laborCost:1200, maintenanceCost:2748, tireCost:963, loadingCost:1800, otherCost:300, totalCost:14671, costPerKm:10.74, costPerTonKm:2.14, profit:5329, freightRevenue:20000, status:'completed', plate:'กข-1234 ขก' },
    { origin:'โคราช', dest:'ระยอง', truck:'รถ 6 ล้อ', cargo:'วัตถุดิบอุตสาหกรรม', cargoWeight:5, distance:310, fuelCost:1898, tollCost:200, laborCost:1050, maintenanceCost:930, tireCost:248, loadingCost:1200, otherCost:200, totalCost:5726, costPerKm:9.27, costPerTonKm:3.70, profit:274, freightRevenue:6000, status:'completed', plate:'กค-9012 นม' },
    { origin:'ขอนแก่น', dest:'หนองคาย', truck:'รถ 6 ล้อ', cargo:'ปุ๋ย', cargoWeight:5, distance:290, fuelCost:1776, tollCost:0, laborCost:1050, maintenanceCost:870, tireCost:232, loadingCost:1200, otherCost:200, totalCost:5328, costPerKm:9.20, costPerTonKm:3.68, profit:672, freightRevenue:6000, status:'completed', plate:'กค-9012 นม' },
    { origin:'โรงงาน นครหลวง', dest:'ขอนแก่น', truck:'รถ 10 ล้อ', cargo:'ปุ๋ยเคมี', cargoWeight:12, distance:410, fuelCost:4308, tollCost:100, laborCost:1200, maintenanceCost:1640, tireCost:574, loadingCost:1800, otherCost:300, totalCost:9922, costPerKm:12.12, costPerTonKm:2.02, profit:8078, freightRevenue:18000, status:'completed', plate:'บค-5678 อย' },
    { origin:'กรุงเทพมหานคร', dest:'ระยอง', truck:'รถ 10 ล้อ', cargo:'สารเคมี', cargoWeight:10, distance:185, fuelCost:1945, tollCost:180, laborCost:700, maintenanceCost:740, tireCost:259, loadingCost:1800, otherCost:300, totalCost:5924, costPerKm:16.01, costPerTonKm:3.20, profit:null, freightRevenue:0, status:'in_progress', plate:'กข-1234 ขก' },
    { origin:'แหลมฉบัง', dest:'นิคมอุตสาหกรรมอมตะซิตี้', truck:'รถ 6 ล้อ', cargo:'ชิ้นส่วนรถยนต์', cargoWeight:4, distance:50, fuelCost:584, tollCost:90, laborCost:600, maintenanceCost:300, tireCost:80, loadingCost:1200, otherCost:200, totalCost:3054, costPerKm:30.54, costPerTonKm:15.27, profit:null, freightRevenue:0, status:'draft', plate:'กค-9012 นม' },
  ];
  const now = new Date();
  return base.map((t, i) => ({
    id:       `trip_${Date.now()}_${i}`,
    ...t,
    date:     new Date(now - (i * 2 + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH'),
    dateTs:   now - (i * 2 + 1) * 24 * 60 * 60 * 1000,
    createdAt: new Date(now - (i * 2 + 1) * 24 * 60 * 60 * 1000).toISOString(),
    note:     '',
  }));
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS = {
  completed:   { bg:'#ECFDF5', color:'#059669', label:'เสร็จสิ้น',  dot:'#059669' },
  in_progress: { bg:'#EFF6FF', color:'#2563EB', label:'กำลังดำเนินการ', dot:'#2563EB' },
  draft:       { bg:'#F8FAFC', color:'#64748B', label:'ร่าง',        dot:'#CBD5E1' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.draft;
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:100, display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }}></span>
      {s.label}
    </span>
  );
};

// ── Trip row ──────────────────────────────────────────────────────────────────
const TripRow = ({ trip, onEdit, onDelete, onDuplicate, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const profitColor = trip.profit > 0 ? '#059669' : trip.profit < 0 ? '#DC2626' : '#94A3B8';

  return (
    <>
      <tr style={{ borderBottom:'1px solid #F1F5F9', cursor:'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        <td style={{ padding:'10px 12px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#0F172A' }}>{trip.date}</div>
          <div style={{ fontSize:10, color:'#94A3B8', fontFamily:'IBM Plex Mono,monospace' }}>{trip.id.slice(-6)}</div>
        </td>
        <td style={{ padding:'10px 12px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#059669', flexShrink:0 }}></span>
              <span style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{trip.origin}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#DC2626', flexShrink:0 }}></span>
              <span style={{ fontSize:12, color:'#475569' }}>{trip.dest}</span>
            </div>
          </div>
        </td>
        <td style={{ padding:'10px 12px', fontSize:11, color:'#475569' }}>{trip.truck}</td>
        <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'IBM Plex Mono,monospace', fontWeight:600, fontSize:12 }}>{fmtN(trip.distance,0)} กม.</td>
        <td style={{ padding:'10px 12px', textAlign:'right' }}>
          <div style={{ fontSize:14, fontWeight:800, fontFamily:'IBM Plex Mono,monospace', color:'#DC2626' }}>฿{fmtN(trip.totalCost,0)}</div>
          <div style={{ fontSize:10, color:'#94A3B8' }}>฿{fmtN(trip.costPerKm,2)}/กม.</div>
        </td>
        <td style={{ padding:'10px 12px', textAlign:'right' }}>
          {trip.profit != null ? (
            <div style={{ fontSize:13, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:profitColor }}>
              {trip.profit >= 0 ? '+' : ''}฿{fmtN(trip.profit,0)}
            </div>
          ) : <span style={{ color:'#CBD5E1', fontSize:11 }}>—</span>}
        </td>
        <td style={{ padding:'10px 12px' }}><StatusBadge status={trip.status} /></td>
        <td style={{ padding:'10px 12px' }}>
          <div style={{ display:'flex', gap:5 }}>
            <button onClick={e=>{e.stopPropagation();onDuplicate(trip)}}
              title="ทำซ้ำทริปนี้"
              style={{ padding:'4px 8px', border:'1px solid #E2E8F0', borderRadius:5, background:'white', cursor:'pointer', fontSize:11, color:'#475569' }}>⎘</button>
            <button onClick={e=>{e.stopPropagation();onDelete(trip.id)}}
              title="ลบ"
              style={{ padding:'4px 8px', border:'1px solid #FECACA', borderRadius:5, background:'#FEF2F2', cursor:'pointer', fontSize:11, color:'#DC2626' }}>✕</button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background:'#F8FAFC' }}>
          <td colSpan={8} style={{ padding:'14px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:10 }}>
              {[
                { label:'ค่าน้ำมัน',    value: fmtTHB(trip.fuelCost) },
                { label:'ค่าทางด่วน',   value: fmtTHB(trip.tollCost) },
                { label:'ค่าแรงงาน',    value: fmtTHB(trip.laborCost) },
                { label:'ซ่อมบำรุง',    value: fmtTHB(trip.maintenanceCost) },
                { label:'ยาง',          value: fmtTHB(trip.tireCost) },
                { label:'โหลดสินค้า',   value: fmtTHB(trip.loadingCost) },
              ].map(cell => (
                <div key={cell.label} style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:7, padding:'8px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:9.5, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.4, marginBottom:3 }}>{cell.label}</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'#0F172A' }}>{cell.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ fontSize:11, color:'#475569' }}>🚛 {trip.plate} · 📦 {trip.cargo} {trip.cargoWeight}ต. · 📏 ฿{fmtN(trip.costPerTonKm,2)}/ตัน-กม.</div>
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                {['completed','in_progress','draft'].map(s => (
                  <button key={s} onClick={()=>onStatusChange(trip.id,s)}
                    style={{ padding:'4px 10px', border:`1px solid ${STATUS[s].color}40`, borderRadius:6, background: trip.status===s ? STATUS[s].bg : 'white', color: STATUS[s].color, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'Sarabun' }}>
                    {STATUS[s].label}
                  </button>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Add trip modal ────────────────────────────────────────────────────────────
const AddTripModal = ({ onClose, onAdd, prefill }) => {
  const blank = { origin:'', dest:'', truck:'รถ 10 ล้อ', cargo:'', cargoWeight:10, distance:0, fuelCost:0, tollCost:0, laborCost:0, maintenanceCost:0, tireCost:0, loadingCost:0, otherCost:0, freightRevenue:0, plate:'', status:'completed', note:'' };
  const [form, setForm] = useState(prefill ? { ...blank, ...prefill } : blank);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const totalCost = (form.fuelCost||0)+(form.tollCost||0)+(form.laborCost||0)+(form.maintenanceCost||0)+(form.tireCost||0)+(form.loadingCost||0)+(form.otherCost||0);
  const profit = form.freightRevenue > 0 ? form.freightRevenue - totalCost : null;
  const costPerKm = form.distance > 0 ? totalCost / form.distance : 0;
  const costPerTonKm = (form.cargoWeight > 0 && form.distance > 0) ? totalCost / (form.cargoWeight * form.distance) : 0;

  const handleSubmit = () => {
    if (!form.origin || !form.dest) return;
    onAdd({ ...form, totalCost, profit, costPerKm, costPerTonKm });
  };

  const Field = ({ label, fkey, type='text', width='100%' }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <label style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:.4 }}>{label}</label>
      <input type={type} value={form[fkey]} onChange={e=>set(fkey, type==='number'?parseFloat(e.target.value)||0:e.target.value)}
        style={{ width, padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:6, fontSize:12, fontFamily: type==='number'?'IBM Plex Mono':'Sarabun', outline:'none', color:'#0F172A' }} />
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:16, padding:24, width:560, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#0F172A' }}>➕ {prefill ? 'ทำซ้ำทริป' : 'บันทึกทริปใหม่'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#94A3B8', padding:4 }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <Field label="ต้นทาง" fkey="origin" />
          <Field label="ปลายทาง" fkey="dest" />
          <Field label="ประเภทรถ" fkey="truck" />
          <Field label="ทะเบียนรถ" fkey="plate" />
          <Field label="ประเภทสินค้า" fkey="cargo" />
          <Field label="น้ำหนักสินค้า (ตัน)" fkey="cargoWeight" type="number" />
          <Field label="ระยะทาง (กม.)" fkey="distance" type="number" />
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:.4 }}>สถานะ</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)}
              style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:6, fontSize:12, fontFamily:'Sarabun', outline:'none', color:'#0F172A' }}>
              {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>รายการต้นทุน</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
          <Field label="ค่าน้ำมัน" fkey="fuelCost" type="number" />
          <Field label="ค่าทางด่วน" fkey="tollCost" type="number" />
          <Field label="ค่าแรงงาน" fkey="laborCost" type="number" />
          <Field label="ซ่อมบำรุง" fkey="maintenanceCost" type="number" />
          <Field label="ค่ายาง" fkey="tireCost" type="number" />
          <Field label="โหลดสินค้า" fkey="loadingCost" type="number" />
          <Field label="อื่นๆ" fkey="otherCost" type="number" />
          <Field label="ค่าขนส่ง (Freight)" fkey="freightRevenue" type="number" />
        </div>

        {/* Live totals */}
        <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', gap:16 }}>
          <div><div style={{ fontSize:9.5, color:'#0284C7' }}>ต้นทุนรวม</div><div style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:800, fontSize:16, color:'#DC2626' }}>฿{fmtN(totalCost,0)}</div></div>
          <div><div style={{ fontSize:9.5, color:'#0284C7' }}>ต้นทุน/กม.</div><div style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:700, fontSize:13 }}>฿{fmtN(costPerKm,2)}</div></div>
          <div><div style={{ fontSize:9.5, color:'#0284C7' }}>ต้นทุน/ตัน-กม.</div><div style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:700, fontSize:13 }}>฿{fmtN(costPerTonKm,2)}</div></div>
          {profit != null && <div><div style={{ fontSize:9.5, color:'#0284C7' }}>กำไร/ขาดทุน</div><div style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:800, fontSize:14, color: profit>=0?'#059669':'#DC2626' }}>{profit>=0?'+':''}฿{fmtN(profit,0)}</div></div>}
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', border:'1px solid #E2E8F0', borderRadius:8, background:'white', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'Sarabun', color:'#475569' }}>ยกเลิก</button>
          <button onClick={handleSubmit} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'#2563EB', color:'white', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Sarabun' }}>💾 บันทึกทริป</button>
        </div>
      </div>
    </div>
  );
};

// ── Main TripLogPage ──────────────────────────────────────────────────────────
const TripLogPage = () => {
  const [log,        setLog]        = useState(() => { const l = loadLog(); return seedIfEmpty(l); });
  const [showModal,  setShowModal]  = useState(false);
  const [prefill,    setPrefill]    = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTruck,  setFilterTruck]  = useState('all');
  const [sortBy,       setSortBy]       = useState('date');
  const [search,       setSearch]       = useState('');
  const [saved,        setSaved]        = useState(false);

  // Persist to localStorage whenever log changes
  useEffect(() => { saveLog(log); }, [log]);

  // If calculator ran a trip, auto-add it
  useEffect(() => {
    if (!window.ExportBridge) return;
    const data = window.ExportBridge.load();
    if (!data?.originName || !data?.totalCost) return;
    // Check not already in log (by origin+dest+date)
    const alreadyAdded = log.some(t => t.origin === data.originName && t.dest === data.destName && t.date === data.calcDate);
    if (!alreadyAdded && data.originName !== 'ขอนแก่น') return; // Only auto-add fresh calcs
  }, []);

  const addTrip = (form) => {
    const newTrip = {
      ...form,
      id: `trip_${Date.now()}`,
      date: new Date().toLocaleDateString('th-TH'),
      dateTs: Date.now(),
      createdAt: new Date().toISOString(),
      note: form.note || '',
    };
    setLog(l => [newTrip, ...l]);
    setShowModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteTrip = (id) => setLog(l => l.filter(t => t.id !== id));
  const duplicateTrip = (trip) => { setPrefill(trip); setShowModal(true); };
  const changeStatus = (id, status) => setLog(l => l.map(t => t.id===id ? {...t,status} : t));

  // Filter + sort
  const filtered = log
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterTruck  === 'all' || t.truck  === filterTruck)
    .filter(t => !search || t.origin.includes(search) || t.dest.includes(search) || t.cargo?.includes(search))
    .sort((a,b) => sortBy==='cost' ? b.totalCost - a.totalCost : b.dateTs - a.dateTs);

  // Summary stats
  const completed = log.filter(t => t.status === 'completed');
  const totalCostSum  = completed.reduce((s,t) => s + t.totalCost, 0);
  const totalDistSum  = completed.reduce((s,t) => s + (t.distance||0), 0);
  const totalProfitSum = completed.filter(t=>t.profit!=null).reduce((s,t) => s + t.profit, 0);

  const trucks = [...new Set(log.map(t=>t.truck))];

  const importFromCalc = () => {
    if (!window.ExportBridge) return;
    const d = window.ExportBridge.load();
    if (!d?.totalCost) { alert('ยังไม่มีข้อมูลจากการคำนวณ — ไปคำนวณที่หน้า Calculator ก่อน'); return; }
    setPrefill({
      origin: d.originName, dest: d.destName, truck: d.truckType,
      cargo: d.cargoType, cargoWeight: d.cargoWeight, distance: d.loadedDistance,
      fuelCost: d.fuelCost, tollCost: d.tollCost, laborCost: (d.driverCost||0)+(d.helperCost||0),
      maintenanceCost: d.maintenanceCost, tireCost: d.tireCost,
      loadingCost: d.loadingCost, otherCost: (d.permitCost||0)+(d.otherCost||0),
      freightRevenue: d.freightRevenue||0, plate: d.truckPlate||'', status:'completed',
    });
    setShowModal(true);
  };

  return (
    <div style={{ padding:20 }}>
      {showModal && <AddTripModal onClose={()=>{setShowModal(false);setPrefill(null);}} onAdd={addTrip} prefill={prefill} />}

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:3 }}>ประวัติเที่ยวรถ &amp; Trip Log</div>
          <div style={{ fontSize:12, color:'#64748B' }}>บันทึกทุกเที่ยวรถ · คลิก row เพื่อดูรายละเอียด · เก็บใน localStorage</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={importFromCalc}
            style={{ padding:'8px 16px', border:'1px solid #2563EB', borderRadius:8, background:'#EFF6FF', color:'#2563EB', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Sarabun', display:'flex', gap:5, alignItems:'center' }}>
            📥 นำเข้าจาก Calculator
          </button>
          <button onClick={()=>{setPrefill(null);setShowModal(true);}}
            style={{ padding:'8px 16px', border:'none', borderRadius:8, background:'#2563EB', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Sarabun' }}>
            ➕ บันทึกทริปใหม่
          </button>
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { icon:'🚛', label:'ทริปทั้งหมด',      value: log.length + ' ทริป',               color:'#0F172A' },
          { icon:'📍', label:'ระยะทางรวม',        value: fmtN(totalDistSum,0)+' กม.',          color:'#2563EB' },
          { icon:'💰', label:'ต้นทุนรวม (Completed)', value:'฿'+fmtN(totalCostSum,0),        color:'#DC2626' },
          { icon:'📈', label:'กำไรรวม (มีข้อมูล)', value:(totalProfitSum>=0?'+':'')+'฿'+fmtN(totalProfitSum,0), color: totalProfitSum>=0?'#059669':'#DC2626' },
        ].map(k=>(
          <div key={k.label} style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:10, padding:'12px 16px' }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{k.icon}</div>
            <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:.4, color:'#94A3B8', marginBottom:3 }}>{k.label}</div>
            <div style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:800, fontSize:18, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 ค้นหา ต้นทาง / ปลายทาง / สินค้า..."
          style={{ padding:'7px 12px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'Sarabun', outline:'none', width:240 }} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'Sarabun', outline:'none', color:'#0F172A', background:'white' }}>
          <option value="all">ทุกสถานะ</option>
          {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterTruck} onChange={e=>setFilterTruck(e.target.value)}
          style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'Sarabun', outline:'none', color:'#0F172A', background:'white' }}>
          <option value="all">ทุกประเภทรถ</option>
          {trucks.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ display:'flex', gap:4, marginLeft:'auto', background:'#F1F5F9', padding:3, borderRadius:7 }}>
          {[{v:'date',l:'ล่าสุด'},{v:'cost',l:'ต้นทุนสูง'}].map(s=>(
            <button key={s.v} onClick={()=>setSortBy(s.v)}
              style={{ padding:'4px 12px', border:'none', borderRadius:5, cursor:'pointer', fontFamily:'Sarabun', fontSize:11, fontWeight:700, background: sortBy===s.v?'white':'transparent', color: sortBy===s.v?'#0F172A':'#94A3B8', boxShadow: sortBy===s.v?'0 1px 3px rgba(0,0,0,0.08)':'none' }}>
              {s.l}
            </button>
          ))}
        </div>
        <span style={{ fontSize:11, color:'#94A3B8' }}>{filtered.length} / {log.length} รายการ</span>
      </div>

      {/* ── Table ── */}
      <div style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
              {['วันที่','เส้นทาง','ประเภทรถ','ระยะทาง','ต้นทุน','กำไร','สถานะ',''].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign: ['ระยะทาง','ต้นทุน','กำไร'].includes(h)?'right':'left', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:.4, color:'#64748B', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#94A3B8', fontSize:13 }}>ไม่พบข้อมูลตามเงื่อนไขที่กรอง</td></tr>
            ) : filtered.map(trip => (
              <TripRow key={trip.id} trip={trip} onEdit={()=>{}} onDelete={deleteTrip} onDuplicate={duplicateTrip} onStatusChange={changeStatus} />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Export CSV ── */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
        <button onClick={() => {
          const rows = [
            ['วันที่','ต้นทาง','ปลายทาง','ประเภทรถ','ทะเบียน','สินค้า','น้ำหนัก(ต.)','ระยะทาง(กม.)','ต้นทุนรวม','ต้นทุน/กม.','กำไร','สถานะ'],
            ...log.map(t => [t.date,t.origin,t.dest,t.truck,t.plate||'',t.cargo||'',t.cargoWeight||0,t.distance||0,(t.totalCost||0).toFixed(2),(t.costPerKm||0).toFixed(2),(t.profit||0).toFixed(2),STATUS[t.status]?.label||t.status]),
          ];
          const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
          const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href=url; a.download='TruckLogis_TripLog_'+new Date().toISOString().slice(0,10)+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }}
          style={{ padding:'8px 16px', border:'1px solid #E2E8F0', borderRadius:8, background:'white', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Sarabun', color:'#475569', display:'flex', gap:5, alignItems:'center' }}>
          ↓ Export CSV ({log.length} รายการ)
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { TripLogPage });
