// components/ResultsPanel.jsx — KPI cards + Chart.js charts + breakdown table
const { useEffect, useRef, useState } = React;
const { fmtN, fmtTHB, fmtKm, fmtL } = window.CalcEngine;

// ── Colour palette for charts & labels ───────────────────────────────────────
const CAT_COLORS = ['#2563EB','#F59E0B','#10B981','#8B5CF6','#EC4899','#06B6D4','#94A3B8'];
const CAT_LABELS = ['น้ำมัน','ทางด่วน','คนขับ+ผู้ช่วย','ซ่อมบำรุง','ยาง','โหลดสินค้า','อื่นๆ'];

// ── Small KPI card ────────────────────────────────────────────────────────────
const KPI = ({ icon, label, value, unit, color = '#2563EB', bg, big }) => (
  <div style={{
    background: bg || 'white', border: '1px solid #E2E8F0', borderRadius: 12,
    padding: big ? '20px' : '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8, background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, marginBottom: 4,
    }}>{icon}</div>
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94A3B8' }}>
      {label}
    </div>
    <div style={{
      fontSize: big ? 26 : 20, fontWeight: 800,
      fontFamily: 'IBM Plex Mono, monospace', color: color, lineHeight: 1.1,
    }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{unit}</div>}
  </div>
);

// ── Pie chart wrapper ─────────────────────────────────────────────────────────
const PieChart = ({ r }) => {
  const ref = useRef(null);
  const inst = useRef(null);

  const cats = [
    r.fuelCost, r.tollCost, r.driverCost + r.helperCost,
    r.maintenanceCost, r.tireCost, r.loadingCost,
    r.permitCost + r.otherCost,
  ];

  useEffect(() => {
    if (!ref.current) return;
    if (inst.current) { inst.current.destroy(); inst.current = null; }

    inst.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: CAT_LABELS,
        datasets: [{
          data: cats,
          backgroundColor: CAT_COLORS,
          borderWidth: 2, borderColor: '#fff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { family: 'Sarabun', size: 12 },
              usePointStyle: true, pointStyleWidth: 10,
              color: '#475569', padding: 10,
              generateLabels(chart) {
                const ds = chart.data.datasets[0];
                return chart.data.labels.map((l, i) => ({
                  text: `${l}  ฿${fmtN(ds.data[i])}`,
                  fillStyle: CAT_COLORS[i],
                  strokeStyle: '#fff',
                  pointStyle: 'circle',
                  index: i,
                }));
              },
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ฿${fmtN(ctx.raw)} (${fmtN(ctx.raw / r.totalCost * 100, 1)}%)`,
            },
            bodyFont: { family: 'Sarabun' },
          },
        },
      },
    });
    return () => { if (inst.current) { inst.current.destroy(); inst.current = null; } };
  }, [r.totalCost]);

  return <canvas ref={ref} style={{ width: '100%', height: '100%' }}></canvas>;
};

// ── Bar chart: loaded vs empty fuel ──────────────────────────────────────────
const BarChart = ({ r }) => {
  const ref = useRef(null);
  const inst = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (inst.current) { inst.current.destroy(); inst.current = null; }

    inst.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: ['น้ำมัน (ลิตร)', 'ค่าน้ำมัน (÷100 บาท)'],
        datasets: [
          {
            label: 'ขาบรรทุก',
            data: [r.loadedFuelUsed, r.fuelCostLoaded / 100],
            backgroundColor: '#2563EB', borderRadius: 6,
          },
          {
            label: 'ขากลับ / รถเปล่า',
            data: [r.emptyFuelUsed, r.fuelCostEmpty / 100],
            backgroundColor: '#94A3B8', borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { font: { family: 'Sarabun', size: 12 }, color: '#475569', usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: ctx => ctx.datasetIndex === 0
                ? (ctx.dataIndex === 0
                    ? ` ขาบรรทุก: ${fmtN(r.loadedFuelUsed)} ลิตร`
                    : ` ขาบรรทุก: ฿${fmtN(r.fuelCostLoaded)}`)
                : (ctx.dataIndex === 0
                    ? ` ขากลับ: ${fmtN(r.emptyFuelUsed)} ลิตร`
                    : ` ขากลับ: ฿${fmtN(r.fuelCostEmpty)}`),
            },
            bodyFont: { family: 'Sarabun' },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748B' } },
          y: { grid: { color: '#F1F5F9' }, ticks: { font: { family: 'Sarabun', size: 11 }, color: '#94A3B8' } },
        },
      },
    });
    return () => { if (inst.current) { inst.current.destroy(); inst.current = null; } };
  }, [r.totalCost]);

  return <canvas ref={ref} style={{ width: '100%', height: '100%' }}></canvas>;
};

// ── Monthly simulation row ────────────────────────────────────────────────────
const MonthlySim = ({ r }) => {
  const [trips, setTrips] = useState(20);
  const monthly = r.totalCost * trips;
  const monthlyFuel = r.fuelCost * trips;
  const monthlyKm   = r.totalDistance * trips;

  return (
    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>📅 จำลองต้นทุนรายเดือน</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>ปรับจำนวนเที่ยวต่อเดือน</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>เที่ยวต่อเดือน</span>
          <input type="number" min="1" max="200" value={trips}
            onChange={e => setTrips(Math.max(1, +e.target.value))}
            style={{
              width: 64, padding: '5px 8px', border: '1px solid #E2E8F0',
              borderRadius: 6, fontSize: 14, fontWeight: 700, textAlign: 'center',
              fontFamily: 'IBM Plex Mono', color: '#2563EB',
            }} />
          <span style={{ fontSize: 12, color: '#64748B' }}>เที่ยว</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { l: 'ต้นทุนรวมต่อเดือน', v: fmtTHB(monthly), c: '#DC2626' },
          { l: 'ค่าน้ำมันต่อเดือน', v: fmtTHB(monthlyFuel), c: '#2563EB' },
          { l: 'กม. รวมต่อเดือน', v: fmtN(monthlyKm, 0) + ' กม.', c: '#059669' },
        ].map(x => (
          <div key={x.l} style={{ background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#94A3B8', marginBottom: 4 }}>{x.l}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'IBM Plex Mono', color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main results panel ────────────────────────────────────────────────────────
const ResultsPanel = ({ result: r, truckName }) => {
  if (!r) return null;

  const costRows = [
    { label: 'ค่าน้ำมันรวม',     value: r.fuelCost,        color: CAT_COLORS[0] },
    { label: 'ค่าทางด่วน',       value: r.tollCost,        color: CAT_COLORS[1] },
    { label: 'ค่าแรงคนขับ',      value: r.driverCost,      color: CAT_COLORS[2] },
    { label: 'ค่าแรงผู้ช่วย',    value: r.helperCost,      color: CAT_COLORS[2] },
    { label: 'ค่าซ่อมบำรุง',     value: r.maintenanceCost, color: CAT_COLORS[3] },
    { label: 'ค่ายาง',           value: r.tireCost,        color: CAT_COLORS[4] },
    { label: 'ค่าโหลด/ขนถ่าย',  value: r.loadingCost,     color: CAT_COLORS[5] },
    { label: 'ค่าใบอนุญาต/เอกสาร', value: r.permitCost,  color: CAT_COLORS[6] },
    { label: 'ค่าใช้จ่ายอื่นๆ', value: r.otherCost,       color: CAT_COLORS[6] },
  ];

  const profitColor = r.profit > 0 ? '#059669' : r.profit < 0 ? '#DC2626' : '#64748B';

  return (
    <div style={{ padding: '0 20px 28px', animation: 'slideUp 0.4s ease' }}>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 4, height: 24, background: '#2563EB', borderRadius: 2 }}></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>ผลการคำนวณต้นทุน</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>{truckName} · น้ำมัน ฿{fmtN(r.fuelPrice)} / ลิตร</div>
        </div>
        <div style={{ marginLeft: 'auto', background: '#EFF6FF', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#2563EB' }}>
          ต้นทุนต่อเที่ยว: {fmtTHB(r.totalCost)}
        </div>
      </div>

      {/* ── Distance + fuel row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
        <KPI icon="📍" label="ระยะทางรวม"         value={fmtN(r.totalDistance,0)} unit="กิโลเมตร"    color="#0F172A" />
        <KPI icon="📦" label="ขาบรรทุก"           value={fmtN(r.loadedDistance,0)} unit="กิโลเมตร"   color="#059669" />
        <KPI icon="↩️" label="ขากลับ/รถเปล่า"    value={fmtN(r.emptyDistance,0)}  unit="กิโลเมตร"   color="#94A3B8" />
        <KPI icon="⛽" label="น้ำมันรวม"          value={fmtN(r.totalFuelUsed)}   unit="ลิตร"        color="#F59E0B" />
        <KPI icon="💧" label="น้ำมันขาบรรทุก"    value={fmtN(r.loadedFuelUsed)}  unit="ลิตร"        color="#2563EB" />
      </div>

      {/* ── Cost KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        <KPI icon="💰" label="ต้นทุนรวมต่อเที่ยว"  value={fmtTHB(r.totalCost)}    color="#DC2626" big />
        <KPI icon="📏" label="ต้นทุนต่อกิโลเมตร"  value={fmtTHB(r.costPerKm)}    color="#7C3AED" big />
        <KPI icon="⚖️" label="ต้นทุนต่อตัน-กม."   value={fmtN(r.costPerTonKm)}   unit="บาท/ตัน-กม." color="#0284C7" big />
        <KPI icon={r.profit >= 0 ? '📈' : '📉'}
             label="กำไร/ขาดทุนต่อเที่ยว"
             value={r.profit != null ? fmtTHB(r.profit) : '—'}
             unit={r.freightRevenue > 0 ? `ค่าขนส่ง: ฿${fmtN(r.freightRevenue)}` : 'ไม่ได้ระบุค่าขนส่ง'}
             color={r.profit != null ? profitColor : '#94A3B8'} big />
      </div>

      {/* ── Charts + breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Pie chart */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
            📊 สัดส่วนต้นทุน
          </div>
          <div style={{ height: 220 }}>
            <PieChart r={r} />
          </div>
        </div>

        {/* Fuel bar chart */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
            ⛽ เปรียบน้ำมัน ขาไป vs ขากลับ
          </div>
          <div style={{ height: 220 }}>
            <BarChart r={r} />
          </div>
        </div>
      </div>

      {/* ── Cost breakdown table ── */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>
          📋 รายละเอียดต้นทุนทั้งหมด
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['รายการ','จำนวน','สัดส่วน (%)'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: h === 'จำนวน' ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {costRows.map((row, i) => (
              row.value > 0 && (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: row.color, flexShrink: 0 }}></span>
                    {row.label}
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 600, color: '#0F172A' }}>
                    {fmtTHB(row.value)}
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(row.value / r.totalCost * 100).toFixed(1)}%`, height: '100%', background: row.color, borderRadius: 2 }}></div>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748B', minWidth: 36, textAlign: 'right' }}>
                        {fmtN(row.value / r.totalCost * 100, 1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            ))}
            <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
              <td style={{ padding: '10px 12px', color: '#0F172A' }}>ต้นทุนรวม</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', color: '#DC2626', fontSize: 15 }}>{fmtTHB(r.totalCost)}</td>
              <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B' }}>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Monthly sim ── */}
      <MonthlySim r={r} />

      {/* ── Export bar ── */}
      <div style={{
        background: '#0D1B2A', borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ marginRight: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'white', marginBottom: 1 }}>📤 Export รายงาน</div>
          <div style={{ fontSize: 10.5, color: '#4E7090' }}>ใช้ข้อมูลการคำนวณนี้สร้างเอกสาร PDF / CSV</div>
        </div>
        {[
          { label: '📄 Trip Summary',   id: 'TripCostSummary', color: '#2563EB' },
          { label: '🚛 Driver Briefing', id: 'DriverBriefing',  color: '#059669' },
          { label: '🧾 Freight Quote',  id: 'FreightQuote',    color: '#D97706' },
          { label: '📊 Scenario',       id: 'ScenarioComparison', color: '#DC2626' },
        ].map(btn => (
          <button key={btn.id}
            onClick={() => {
              if (window.ExportBridge) window.ExportBridge.openReport(btn.id);
            }}
            style={{
              padding: '7px 13px', border: 'none', borderRadius: 7,
              background: btn.color, color: 'white', cursor: 'pointer',
              fontSize: 11.5, fontWeight: 700, fontFamily: 'Sarabun',
              opacity: 0.92, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.92'}>
            {btn.label}
          </button>
        ))}
        <button
          onClick={() => { if (window.ExportBridge) window.ExportBridge.downloadCSV(window.ExportBridge.load()); }}
          style={{
            padding: '7px 13px', border: '1px solid #1A2E45', borderRadius: 7,
            background: 'transparent', color: '#94A3B8', cursor: 'pointer',
            fontSize: 11.5, fontWeight: 700, fontFamily: 'Sarabun',
          }}>
          ↓ CSV
        </button>
        <button
          onClick={() => {
            const nav = document.querySelector('[data-nav-export]');
            if (nav) nav.click();
          }}
          style={{
            marginLeft: 'auto', padding: '7px 13px', border: '1px solid #2563EB', borderRadius: 7,
            background: 'transparent', color: '#3B82F6', cursor: 'pointer',
            fontSize: 11.5, fontWeight: 700, fontFamily: 'Sarabun',
          }}>
          ดูทุกรายงาน →
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { ResultsPanel });
