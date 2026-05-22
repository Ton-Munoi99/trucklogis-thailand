// components/DashboardPage.jsx — Fleet Analytics Dashboard
const { useState, useEffect, useRef } = React;
const { fmtN, fmtTHB } = window.CalcEngine;

// ── Mock monthly analytics data ───────────────────────────────────────────────
const MONTHS = ['ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.'];
const MONTHLY_DATA = [
  { month:'ธ.ค.',  trips:112, km:48200,  cost:1640000, fuel:920000,  toll:130000, labor:198000, maint:220000 },
  { month:'ม.ค.',  trips:118, km:51500,  cost:1720000, fuel:970000,  toll:136000, labor:208000, maint:228000 },
  { month:'ก.พ.',  trips:105, km:44800,  cost:1540000, fuel:860000,  toll:120000, labor:188000, maint:210000 },
  { month:'มี.ค.', trips:124, km:53600,  cost:1810000, fuel:1010000, toll:144000, labor:218000, maint:242000 },
  { month:'เม.ย.', trips:119, km:52100,  cost:1770000, fuel:990000,  toll:140000, labor:214000, maint:236000 },
  { month:'พ.ค.',  trips:127, km:56230,  cost:1814920, fuel:1016000, toll:145000, labor:221000, maint:245000 },
];

const ROUTES_DATA = [
  { route:'ขอนแก่น → กรุงเทพฯ',    trips:22, avgCost:14265, km:445, truck:'รถ 10 ล้อ' },
  { route:'นครหลวง → แหลมฉบัง',    trips:18, avgCost:8420,  km:165, truck:'รถเทรลเลอร์' },
  { route:'กรุงเทพฯ → เชียงใหม่',   trips:15, avgCost:20840, km:687, truck:'รถ 10 ล้อ' },
  { route:'โคราช → ระยอง',          trips:12, avgCost:7890,  km:310, truck:'รถ 6 ล้อ' },
  { route:'ขอนแก่น → หนองคาย',      trips:10, avgCost:6540,  km:290, truck:'รถ 6 ล้อ' },
  { route:'โรงงาน → ขอนแก่น',       trips:8,  avgCost:12340, km:410, truck:'รถ 10 ล้อ' },
];

const TRUCK_PERF = [
  { type:'รถ 6 ล้อ',     trips:38, costPerKm:24.80, costPerTonKm:4.96, utilization:78 },
  { type:'รถ 10 ล้อ',    trips:52, costPerKm:32.15, costPerTonKm:2.68, utilization:84 },
  { type:'รถ 12 ล้อ',    trips:22, costPerKm:38.40, costPerTonKm:2.40, utilization:71 },
  { type:'รถเทรลเลอร์',  trips:15, costPerKm:44.70, costPerTonKm:2.04, utilization:66 },
];

const TRUCK_COLORS = ['#059669','#2563EB','#7C3AED','#DC2626'];
const CAT_COLORS   = ['#2563EB','#F59E0B','#059669','#8B5CF6','#94A3B8'];

// ── Chart hook ────────────────────────────────────────────────────────────────
function useChart(ref, config, deps) {
  const inst = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (inst.current) { inst.current.destroy(); inst.current = null; }
    inst.current = new Chart(ref.current, config());
    return () => { if (inst.current) { inst.current.destroy(); inst.current = null; } };
  }, deps);
}

// ── KPI card ──────────────────────────────────────────────────────────────────
const KPICard = ({ icon, label, value, sub, color, trend, trendUp }) => (
  <div style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:12, padding:'16px 18px' }}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
      <div style={{ width:36, height:36, borderRadius:9, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{icon}</div>
      {trend && (
        <span style={{ fontSize:11, fontWeight:700, color: trendUp ? '#059669' : '#DC2626', background: trendUp ? '#ECFDF5' : '#FEF2F2', padding:'2px 8px', borderRadius:100 }}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'#94A3B8', marginBottom:4 }}>{label}</div>
    <div style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:800, fontSize:22, color, lineHeight:1.1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:'#94A3B8', marginTop:3 }}>{sub}</div>}
  </div>
);

// ── Section title ─────────────────────────────────────────────────────────────
const Sec = ({ title, sub, children, action }) => (
  <div style={{ background:'white', border:'1px solid #E2E8F0', borderRadius:12, padding:20 }}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{title}</div>
        {sub && <div style={{ fontSize:10.5, color:'#94A3B8', marginTop:2 }}>{sub}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ── Period selector ───────────────────────────────────────────────────────────
const PeriodBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'4px 12px', border:'none', borderRadius:6, cursor:'pointer', fontFamily:'Sarabun', fontSize:11, fontWeight:700, background: active ? '#2563EB' : '#F1F5F9', color: active ? 'white' : '#475569', transition:'all .15s' }}>{label}</button>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const [period, setPeriod] = useState('6m');

  const current = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const prev    = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const costDiff = ((current.cost - prev.cost) / prev.cost * 100).toFixed(1);
  const tripDiff = ((current.trips - prev.trips) / prev.trips * 100).toFixed(1);

  // Chart refs
  const trendRef   = useRef(null);
  const catRef     = useRef(null);
  const routeRef   = useRef(null);
  const truckRef   = useRef(null);

  // Trend line chart
  useChart(trendRef, () => ({
    type: 'line',
    data: {
      labels: MONTHLY_DATA.map(d => d.month),
      datasets: [
        {
          label: 'ต้นทุนรวม (บาท)',
          data: MONTHLY_DATA.map(d => d.cost),
          borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.08)',
          tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: '#2563EB',
        },
        {
          label: 'ค่าน้ำมัน (บาท)',
          data: MONTHLY_DATA.map(d => d.fuel),
          borderColor: '#F59E0B', backgroundColor: 'transparent',
          tension: 0.4, borderDash: [5,3], pointRadius: 4, pointBackgroundColor: '#F59E0B',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family:'Sarabun', size:12 }, usePointStyle: true, color:'#475569' } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ฿${fmtN(ctx.raw,0)}` }, bodyFont: { family:'Sarabun' } },
      },
      scales: {
        x: { grid: { display:false }, ticks: { font:{ family:'Sarabun', size:11 }, color:'#94A3B8' } },
        y: { grid: { color:'#F1F5F9' }, ticks: { font:{ family:'Sarabun', size:10 }, color:'#94A3B8', callback: v => '฿'+fmtN(v/1000000,1)+'M' } },
      },
    },
  }), [period]);

  // Cost category donut
  useChart(catRef, () => ({
    type: 'doughnut',
    data: {
      labels: ['น้ำมัน','ทางด่วน','แรงงาน','ซ่อมบำรุง','อื่นๆ'],
      datasets: [{
        data: [current.fuel, current.toll, current.labor, current.maint,
               current.cost - current.fuel - current.toll - current.labor - current.maint],
        backgroundColor: CAT_COLORS, borderWidth: 2, borderColor: '#fff',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { position:'right', labels: { font:{ family:'Sarabun', size:11 }, usePointStyle:true, padding:8, color:'#475569',
          generateLabels(chart) {
            return chart.data.labels.map((l,i) => ({
              text: `${l}  ${((chart.data.datasets[0].data[i]/current.cost)*100).toFixed(0)}%`,
              fillStyle: CAT_COLORS[i], strokeStyle:'#fff', pointStyle:'circle', index:i,
            }));
          },
        }},
        tooltip: { callbacks: { label: ctx => ` ฿${fmtN(ctx.raw,0)} (${(ctx.raw/current.cost*100).toFixed(1)}%)` }, bodyFont:{ family:'Sarabun' } },
      },
    },
  }), []);

  // Route cost bar
  useChart(routeRef, () => ({
    type: 'bar',
    data: {
      labels: ROUTES_DATA.map(r => r.route.length > 20 ? r.route.slice(0,18)+'…' : r.route),
      datasets: [{
        label: 'ต้นทุนรวมต่อเดือน (บาท)',
        data: ROUTES_DATA.map(r => r.avgCost * r.trips),
        backgroundColor: '#2563EB', borderRadius: 5,
        hoverBackgroundColor: '#1D4ED8',
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: { callbacks: { label: ctx => ` ฿${fmtN(ctx.raw,0)}` }, bodyFont:{ family:'Sarabun' } },
      },
      scales: {
        x: { grid:{ color:'#F1F5F9' }, ticks:{ font:{ family:'Sarabun', size:10 }, color:'#94A3B8', callback: v=>'฿'+fmtN(v/1000,0)+'K' } },
        y: { grid:{ display:false }, ticks:{ font:{ family:'Sarabun', size:11 }, color:'#475569' } },
      },
    },
  }), []);

  // Truck efficiency bar
  useChart(truckRef, () => ({
    type: 'bar',
    data: {
      labels: TRUCK_PERF.map(t => t.type),
      datasets: [
        { label:'ต้นทุน/กม. (฿)', data: TRUCK_PERF.map(t=>t.costPerKm), backgroundColor: TRUCK_COLORS, borderRadius:5 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: { callbacks: { label: ctx => ` ฿${ctx.raw}/กม.` }, bodyFont:{ family:'Sarabun' } },
      },
      scales: {
        x: { grid:{ display:false }, ticks:{ font:{ family:'Sarabun', size:11 }, color:'#475569' } },
        y: { grid:{ color:'#F1F5F9' }, ticks:{ font:{ family:'Sarabun', size:10 }, color:'#94A3B8', callback: v=>v+' ฿' } },
      },
    },
  }), []);

  return (
    <div style={{ padding:20, overflowY:'auto' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:3 }}>Fleet Analytics Dashboard</div>
          <div style={{ fontSize:12, color:'#64748B' }}>ข้อมูล Demo · พ.ค. 2569 · กองยานขนส่ง 4 ประเภทรถ</div>
        </div>
        <div style={{ display:'flex', gap:4, background:'#F1F5F9', padding:4, borderRadius:8 }}>
          {['1m','3m','6m','1y'].map(p => (
            <PeriodBtn key={p} label={p} active={period===p} onClick={() => setPeriod(p)} />
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        <KPICard icon="🚛" label="เที่ยวรถ / เดือน"   value={current.trips}            color="#0F172A"  trend={`${tripDiff}%`} trendUp={parseFloat(tripDiff)>0} />
        <KPICard icon="📍" label="กม. รวม / เดือน"    value={fmtN(current.km,0)}       color="#2563EB"  sub="กิโลเมตร" />
        <KPICard icon="💰" label="ต้นทุนรวม / เดือน"  value={'฿'+fmtN(current.cost/1e6,2)+'M'} color="#DC2626" trend={`${costDiff}%`} trendUp={parseFloat(costDiff)<0} />
        <KPICard icon="📏" label="ต้นทุน / กม."        value={'฿'+fmtN(current.cost/current.km,2)} color="#7C3AED" sub="บาท/กม. เฉลี่ยกองยาน" />
        <KPICard icon="⛽" label="สัดส่วนค่าน้ำมัน"   value={fmtN(current.fuel/current.cost*100,1)+'%'} color="#F59E0B" sub="ของต้นทุนรวม" />
      </div>

      {/* ── Row 2: Trend + Category ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr', gap:14, marginBottom:14 }}>
        <Sec title="📈 แนวโน้มต้นทุนรายเดือน" sub="6 เดือนล่าสุด · บาท">
          <div style={{ height:220 }}><canvas ref={trendRef}></canvas></div>
        </Sec>
        <Sec title="🥧 สัดส่วนต้นทุน" sub={`พ.ค. 2569 · รวม ฿${fmtN(current.cost,0)}`}>
          <div style={{ height:220 }}><canvas ref={catRef}></canvas></div>
        </Sec>
      </div>

      {/* ── Row 3: Route Cost + Truck Efficiency ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14, marginBottom:14 }}>
        <Sec title="🗺 ต้นทุนรายเส้นทาง / เดือน" sub="ต้นทุนรวม = ต้นทุน/เที่ยว × จำนวนเที่ยว">
          <div style={{ height:200 }}><canvas ref={routeRef}></canvas></div>
        </Sec>
        <Sec title="🚛 ประสิทธิภาพตามประเภทรถ" sub="ต้นทุน/กม. เฉลี่ย">
          <div style={{ height:200 }}><canvas ref={truckRef}></canvas></div>
        </Sec>
      </div>

      {/* ── Row 4: Truck table + Monthly summary ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

        {/* Truck performance table */}
        <Sec title="🏆 ประสิทธิภาพกองยาน" sub="ต้นทุน/ตัน-กม. · Utilization rate">
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['ประเภทรถ','เที่ยว','฿/กม.','฿/ตัน-กม.','Util. %'].map(h=>(
                  <th key={h} style={{ padding:'6px 10px', textAlign: h==='ประเภทรถ'?'left':'right', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:.4, color:'#64748B', borderBottom:'1px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRUCK_PERF.map((t,i) => (
                <tr key={t.type} style={{ borderBottom:'1px solid #F8FAFC' }}>
                  <td style={{ padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:10, height:10, borderRadius:2, background:TRUCK_COLORS[i] }}></span>
                    <span style={{ fontWeight:600 }}>{t.type}</span>
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'IBM Plex Mono,monospace', fontWeight:600 }}>{t.trips}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'IBM Plex Mono,monospace', fontWeight:600, color:TRUCK_COLORS[i] }}>฿{t.costPerKm}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'IBM Plex Mono,monospace', fontWeight:600 }}>฿{t.costPerTonKm}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                      <div style={{ width:50, height:5, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${t.utilization}%`, height:'100%', background:TRUCK_COLORS[i], borderRadius:3 }}></div>
                      </div>
                      <span style={{ fontSize:11, color:'#475569' }}>{t.utilization}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sec>

        {/* MoM summary */}
        <Sec title="📊 เปรียบเทียบ เม.ย. vs พ.ค." sub="Month-over-Month">
          {[
            { label:'จำนวนเที่ยว',   apr:prev.trips,          may:current.trips,          fmt:v=>v+' เที่ยว',                      up:current.trips>prev.trips },
            { label:'ระยะทางรวม',    apr:prev.km,             may:current.km,             fmt:v=>fmtN(v,0)+' กม.',                  up:current.km>prev.km },
            { label:'ต้นทุนรวม',     apr:prev.cost,           may:current.cost,           fmt:v=>'฿'+fmtN(v,0),                    up:current.cost<prev.cost },
            { label:'ค่าน้ำมัน',     apr:prev.fuel,           may:current.fuel,           fmt:v=>'฿'+fmtN(v,0),                    up:current.fuel<prev.fuel },
            { label:'ค่าทางด่วน',    apr:prev.toll,           may:current.toll,           fmt:v=>'฿'+fmtN(v,0),                    up:current.toll<prev.toll },
            { label:'ต้นทุน/กม.',    apr:prev.cost/prev.km,   may:current.cost/current.km, fmt:v=>'฿'+fmtN(v,2),                   up:current.cost/current.km<prev.cost/prev.km },
          ].map(row => {
            const chg = ((row.may - row.apr) / row.apr * 100).toFixed(1);
            const isGood = row.up;
            return (
              <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #F8FAFC' }}>
                <span style={{ fontSize:12, color:'#475569', flex:'0 0 100px' }}>{row.label}</span>
                <span style={{ fontSize:11, color:'#94A3B8', flex:'0 0 90px', fontFamily:'IBM Plex Mono,monospace' }}>{row.fmt(row.apr)}</span>
                <span style={{ fontSize:11, fontFamily:'IBM Plex Mono,monospace', fontWeight:700, flex:'0 0 90px', color:'#0F172A' }}>{row.fmt(row.may)}</span>
                <span style={{ fontSize:11, fontWeight:700, color: isGood ? '#059669' : '#DC2626', background: isGood ? '#ECFDF5' : '#FEF2F2', padding:'2px 7px', borderRadius:100 }}>
                  {parseFloat(chg)>0?'↑':'↓'} {Math.abs(parseFloat(chg))}%
                </span>
              </div>
            );
          })}
        </Sec>
      </div>

      {/* ── Insight bar ── */}
      <div style={{ background:'#0D1B2A', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontSize:24 }}>💡</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:3 }}>Key Insights — พ.ค. 2569</div>
          <div style={{ fontSize:12, color:'#5E7E9A', lineHeight:1.6 }}>
            ค่าน้ำมันคิดเป็น <b style={{color:'#F59E0B'}}>{fmtN(current.fuel/current.cost*100,1)}%</b> ของต้นทุนรวม · 
            รถ 10 ล้อ มี Utilization สูงสุด <b style={{color:'#3B82F6'}}>84%</b> · 
            รถเทรลเลอร์มีต้นทุน/ตัน-กม. ต่ำสุด <b style={{color:'#34D399'}}>฿2.04</b> เหมาะกับสินค้าปริมาณมาก · 
            เส้นทาง กรุงเทพฯ→เชียงใหม่ มีต้นทุนต่อเที่ยวสูงสุด
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DashboardPage });
