// components/ExportPage.jsx — Export hub with all 5 report types
const { useState } = React;

const REPORT_CARDS = [
  {
    id:       'TripCostSummary',
    icon:     '📄',
    title:    'ใบสรุปต้นทุนเที่ยวรถ',
    titleEn:  'Trip Cost Summary',
    desc:     'รายละเอียดต้นทุนทุกรายการ · สัดส่วนค่าใช้จ่าย · KPI ต้นทุน/กม. และต้นทุน/ตัน-กม.',
    descEn:   '1 page A4 Portrait — all cost line items, pie/bar charts, KPIs, signature lines',
    color:    '#2563EB',
    bg:       '#EFF6FF',
    size:     'A4 Portrait',
    hasCSV:   true,
  },
  {
    id:       'DriverBriefing',
    icon:     '🚛',
    title:    'ใบสั่งงานคนขับรถ',
    titleEn:  'Driver Briefing Sheet',
    desc:     'เส้นทาง · งบน้ำมันที่อนุมัติ · ข้อมูลสินค้า · จุดแวะพัก · ลายเซ็นรับทราบ',
    descEn:   '1 page A4 Portrait — route banner, fuel auth, cargo, checkpoints',
    color:    '#059669',
    bg:       '#ECFDF5',
    size:     'A4 Portrait',
    hasCSV:   false,
  },
  {
    id:       'FreightQuote',
    icon:     '🧾',
    title:    'ใบเสนอราคาค่าขนส่ง',
    titleEn:  'Customer Freight Quote',
    desc:     'ราคาต้นทุน + Margin 20% = ราคาเสนอลูกค้า · เงื่อนไขการชำระเงิน · ตราประทับ',
    descEn:   '1 page A4 Portrait — letterhead, pricing breakdown, terms, stamp area',
    color:    '#D97706',
    bg:       '#FFFBEB',
    size:     'A4 Portrait',
    hasCSV:   false,
  },
  {
    id:       'MonthlyReport',
    icon:     '📊',
    title:    'รายงานต้นทุนกองยานรายเดือน',
    titleEn:  'Fleet Monthly Cost Report',
    desc:     'ภาพรวมกองยาน · ต้นทุนทุกเส้นทาง · แผนภูมิสัดส่วนต้นทุก · เปรียบเทียบรายเดือน',
    descEn:   '1 page A4 Portrait — KPIs, route table, category chart, truck breakdown',
    color:    '#7C3AED',
    bg:       '#F5F3FF',
    size:     'A4 Portrait',
    hasCSV:   false,
  },
  {
    id:       'ScenarioComparison',
    icon:     '🔄',
    title:    'รายงานเปรียบเทียบ Scenario',
    titleEn:  'Scenario Comparison Report',
    desc:     'เปรียบเทียบ 3 ประเภทรถ ต้นทุนรวม · ต้นทุน/กม. · กำไร · แผนภูมิและข้อเสนอแนะ',
    descEn:   '1 page A4 Landscape — 3-column comparison, chart, recommendation',
    color:    '#DC2626',
    bg:       '#FEF2F2',
    size:     'A4 Landscape',
    hasCSV:   false,
  },
];

const StatusDot = ({ ok }) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#059669' : '#F59E0B', display: 'inline-block', flexShrink: 0 }}></span>
);

const ExportCard = ({ card, hasData, lastCalc }) => {
  const [hovering, setHovering] = useState(false);

  const openReport = (autoPrint = false) => {
    window.ExportBridge.openReport(card.id, autoPrint);
  };

  const downloadCSV = () => {
    window.ExportBridge.downloadCSV(window.ExportBridge.load());
  };

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: 'white', border: `1px solid ${hovering ? card.color + '55' : '#E2E8F0'}`,
        borderRadius: 14, padding: 20, transition: 'all 0.15s',
        boxShadow: hovering ? `0 4px 20px ${card.color}18` : '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: card.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0, border: `1px solid ${card.color}22`,
        }}>{card.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 2, lineHeight: 1.3 }}>{card.title}</div>
          <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 500 }}>{card.titleEn}</div>
        </div>
        <span style={{ background: card.bg, color: card.color, fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 100, border: `1px solid ${card.color}30`, flexShrink: 0 }}>
          {card.size}
        </span>
      </div>

      {/* Description */}
      <div>
        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 4 }}>{card.desc}</div>
        <div style={{ fontSize: 10.5, color: '#94A3B8', fontStyle: 'italic' }}>{card.descEn}</div>
      </div>

      {/* Data status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F8FAFC', borderRadius: 7, border: '1px solid #F1F5F9' }}>
        <StatusDot ok={hasData} />
        <span style={{ fontSize: 11, color: '#64748B' }}>
          {hasData ? `ข้อมูลล่าสุด: ${lastCalc}` : 'ใช้ข้อมูล Demo (Mock Data)'}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 7 }}>
        <button
          onClick={() => openReport(false)}
          style={{
            flex: 1, padding: '8px 10px', border: 'none', borderRadius: 8,
            background: card.color, color: 'white', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, fontFamily: 'Sarabun',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          👁 ดูตัวอย่าง / Preview
        </button>
        <button
          onClick={() => openReport(true)}
          title="เปิดและพิมพ์อัตโนมัติ"
          style={{
            padding: '8px 11px', border: `1px solid ${card.color}40`, borderRadius: 8,
            background: card.bg, color: card.color, cursor: 'pointer',
            fontSize: 12, fontWeight: 700, fontFamily: 'Sarabun',
          }}>
          🖨
        </button>
        {card.hasCSV && (
          <button
            onClick={downloadCSV}
            title="ดาวน์โหลด CSV"
            style={{
              padding: '8px 11px', border: '1px solid #E2E8F0', borderRadius: 8,
              background: 'white', color: '#475569', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'Sarabun',
            }}>
            ↓CSV
          </button>
        )}
      </div>
    </div>
  );
};

const ExportPage = ({ lastCalcDate }) => {
  const [hasData] = useState(() => !!localStorage.getItem('tl_export_v1'));

  return (
    <div style={{ padding: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Export &amp; Reporting</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>เลือกรายงานที่ต้องการ · แสดงตัวอย่างหรือพิมพ์เป็น PDF · ดาวน์โหลด CSV</div>
        </div>
        <div style={{ background: hasData ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${hasData ? '#A7F3D0' : '#FCD34D'}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: hasData ? '#065F46' : '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot ok={hasData} />
          {hasData ? `ข้อมูลจากการคำนวณ${lastCalcDate ? ` · ${lastCalcDate}` : ''}` : 'ยังไม่มีข้อมูลการคำนวณ — คำนวณก่อนที่หน้า Calculator'}
        </div>
      </div>

      {/* Instruction banner */}
      {!hasData && (
        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#0284C7', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <b>วิธีใช้:</b> ไปที่หน้า "คำนวณต้นทุนเที่ยวรถ" → เลือกเส้นทาง + รถ → กด <b>"คำนวณต้นทุน"</b> → กลับมาที่หน้านี้ แล้วรายงานทุกฉบับจะใช้ข้อมูลนั้นโดยอัตโนมัติ
          </div>
        </div>
      )}

      {/* Report cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {REPORT_CARDS.map(card => (
          <ExportCard key={card.id} card={card} hasData={hasData} lastCalc={lastCalcDate || '—'} />
        ))}
      </div>

      {/* Bulk actions */}
      <div style={{ background: '#0D1B2A', border: '1px solid #1A2E45', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 22 }}>📦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>Export ทั้งชุด</div>
          <div style={{ fontSize: 11.5, color: '#4E7090' }}>เปิดรายงานทุกฉบับพร้อมกันในแท็บใหม่ · แต่ละแท็บพร้อมพิมพ์ทันที</div>
        </div>
        <button
          onClick={() => { REPORT_CARDS.forEach((c, i) => setTimeout(() => window.ExportBridge.openReport(c.id), i * 400)); }}
          style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Sarabun', whiteSpace: 'nowrap' }}>
          🚀 เปิดทุกรายงาน
        </button>
        <button
          onClick={() => window.ExportBridge.downloadCSV(window.ExportBridge.load())}
          style={{ padding: '9px 18px', border: '1px solid #1A2E45', borderRadius: 8, background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Sarabun', whiteSpace: 'nowrap' }}>
          ↓ Download CSV
        </button>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 11.5, color: '#64748B' }}>
          <b style={{ color: '#0F172A' }}>📄 วิธีบันทึก PDF:</b> เปิดรายงาน → Ctrl+P (Windows) หรือ ⌘+P (Mac) → เลือก "Save as PDF" → Print
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 11.5, color: '#64748B' }}>
          <b style={{ color: '#0F172A' }}>🖨 แนะนำ Browser:</b> ใช้ Google Chrome เพื่อผลลัพธ์ที่ดีที่สุด · ตั้ง Margins = None ใน Print Settings
        </div>
      </div>

    </div>
  );
};

Object.assign(window, { ExportPage });
