// components/TruckProfilePage.jsx — Truck management screen
const { useState } = React;
const { fmtN } = window.CalcEngine;

const Field = ({ label, value, onChange, unit, type = 'number', readOnly }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748B' }}>{label}</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type={readOnly ? 'text' : type} value={value} readOnly={readOnly}
        onChange={e => onChange && onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        style={{
          flex: 1, padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 6,
          fontSize: 13, fontFamily: type === 'number' ? 'IBM Plex Mono' : 'Sarabun',
          color: readOnly ? '#94A3B8' : '#0F172A', background: readOnly ? '#F8FAFC' : 'white',
          outline: 'none', fontWeight: type === 'number' ? 600 : 400,
        }}
      />
      {unit && <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>{unit}</span>}
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#94A3B8', marginBottom: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
      {title}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {children}
    </div>
  </div>
);

// ── Truck profile card ────────────────────────────────────────────────────────
const TruckCard = ({ t, selected, onClick }) => (
  <div onClick={onClick} style={{
    background: selected ? '#EFF6FF' : 'white',
    border: `2px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 12, padding: '14px', cursor: 'pointer',
    transition: 'all 0.15s', position: 'relative',
  }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}>
    {selected && (
      <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>
      </div>
    )}
    <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: selected ? '#2563EB' : '#0F172A', marginBottom: 4, lineHeight: 1.3 }}>{t.type}</div>
    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>{t.typeEn}</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ background: '#F1F5F9', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: '#475569' }}>{t.wheels} ล้อ</span>
      <span style={{ background: '#F1F5F9', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: '#475569' }}>{t.maxPayload} ต.</span>
    </div>
    <div style={{ marginTop: 10, borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>ต้นทุน/กม. (ประมาณ)</div>
      <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'IBM Plex Mono', color: t.color || '#0F172A' }}>
        ฿{fmtN(t.maintenanceCostPerKm + t.tireCostPerKm, 2)}
      </div>
    </div>
  </div>
);

// ── Main truck profile page ───────────────────────────────────────────────────
const TruckProfilePage = () => {
  const [profiles, setProfiles] = useState(window.AppData.TRUCK_PROFILES);
  const [selectedId, setSelectedId] = useState('truck10');
  const [saved, setSaved] = useState(false);

  const profile = profiles.find(p => p.id === selectedId) || profiles[0];

  const update = (field, value) => {
    setProfiles(prev => prev.map(p => p.id === selectedId ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    const orig = window.AppData.TRUCK_PROFILES.find(p => p.id === selectedId);
    if (orig) setProfiles(prev => prev.map(p => p.id === selectedId ? { ...orig } : p));
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>โปรไฟล์รถบรรทุก</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>จัดการข้อมูลสเปครถบรรทุกทุกประเภทที่ใช้ในกองยาน</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleReset}
            style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Sarabun', color: '#475569' }}>
            ↺ รีเซ็ต
          </button>
          <button onClick={handleSave}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: saved ? '#059669' : '#2563EB', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Sarabun', color: 'white', transition: 'background 0.3s' }}>
            {saved ? '✓ บันทึกแล้ว' : '💾 บันทึก'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>

        {/* ── Truck card grid ── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            เลือกประเภทรถ ({profiles.length} ประเภท)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {profiles.map(t => (
              <TruckCard key={t.id} t={t} selected={selectedId === t.id} onClick={() => setSelectedId(t.id)} />
            ))}
          </div>
        </div>

        {/* ── Editor panel ── */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 32 }}>{profile.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{profile.type}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{profile.typeEn} · {profile.wheels} ล้อ · {profile.axles} เพลา</div>
            </div>
            {selectedId === 'custom' && (
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, border: '1px solid #FCD34D' }}>CUSTOM</span>
              </div>
            )}
          </div>

          <Section title="ข้อมูลพื้นฐาน">
            <Field label="ชื่อรถ"              value={profile.type}            onChange={v => update('type', v)}      type="text" />
            <Field label="จำนวนล้อ"            value={profile.wheels}          onChange={v => update('wheels', v)}    unit="ล้อ" />
            <Field label="จำนวนเพลา"           value={profile.axles}           onChange={v => update('axles', v)}     unit="เพลา" />
            <Field label="น้ำหนักรถเปล่า"      value={profile.emptyWeight}     onChange={v => update('emptyWeight', v)} unit="ตัน" step="0.1" />
            <Field label="น้ำหนักบรรทุกสูงสุด" value={profile.maxPayload}      onChange={v => update('maxPayload', v)} unit="ตัน" step="0.5" />
            <Field label="น้ำหนักสินค้าจริง"   value={profile.actualCargo}     onChange={v => update('actualCargo', v)} unit="ตัน" step="0.5" />
            <Field label="น้ำหนักรวม (GVW)"    value={profile.gvw}             onChange={v => update('gvw', v)}       unit="ตัน" step="0.5" />
          </Section>

          <Section title="ขนาดรถ">
            <Field label="ความสูง"   value={profile.height} onChange={v => update('height', v)} unit="เมตร" step="0.1" />
            <Field label="ความกว้าง" value={profile.width}  onChange={v => update('width', v)}  unit="เมตร" step="0.1" />
            <Field label="ความยาว"   value={profile.length} onChange={v => update('length', v)} unit="เมตร" step="0.1" />
            <Field label="ถังน้ำมัน" value={profile.tankCapacity} onChange={v => update('tankCapacity', v)} unit="ลิตร" />
          </Section>

          <Section title="ประสิทธิภาพเชื้อเพลิง">
            <Field label="อัตราสิ้นเปลือง ขาบรรทุก" value={profile.loadedKmPerLiter} onChange={v => update('loadedKmPerLiter', v)} unit="กม./ลิตร" step="0.1" />
            <Field label="อัตราสิ้นเปลือง รถเปล่า"  value={profile.emptyKmPerLiter}  onChange={v => update('emptyKmPerLiter', v)}  unit="กม./ลิตร" step="0.1" />
            <Field label="ความเร็วเฉลี่ย"           value={profile.avgSpeedKmh}      onChange={v => update('avgSpeedKmh', v)}     unit="กม./ชม." />
            <Field label="น้ำมันขณะจอดติดเครื่อง"  value={profile.idleFuelLph}      onChange={v => update('idleFuelLph', v)}     unit="ลิตร/ชม." step="0.1" />
          </Section>

          <Section title="ต้นทุนต่อหน่วย">
            <Field label="ซ่อมบำรุง"          value={profile.maintenanceCostPerKm} onChange={v => update('maintenanceCostPerKm', v)} unit="บาท/กม." step="0.1" />
            <Field label="ยาง"                 value={profile.tireCostPerKm}        onChange={v => update('tireCostPerKm', v)}        unit="บาท/กม." step="0.05" />
            <Field label="ค่าแรงคนขับ"         value={profile.driverCostPerDay}     onChange={v => update('driverCostPerDay', v)}     unit="บาท/วัน" />
            <Field label="ค่าแรงผู้ช่วย"       value={profile.helperCostPerDay}     onChange={v => update('helperCostPerDay', v)}     unit="บาท/วัน" />
            <Field label="โหลด/ขนถ่ายสินค้า"  value={profile.loadingCost}          onChange={v => update('loadingCost', v)}          unit="บาท/เที่ยว" />
            <Field label="ใบอนุญาต/เอกสาร"    value={profile.permitCost}           onChange={v => update('permitCost', v)}           unit="บาท" />
            <Field label="ค่าใช้จ่ายอื่นๆ"    value={profile.otherCost}            onChange={v => update('otherCost', v)}            unit="บาท" />
          </Section>

          {/* Restriction info */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>⚠️ ข้อจำกัดรถบรรทุก</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12, color: '#78350F' }}>
              <div>ความสูง: <b>{profile.height} ม.</b></div>
              <div>ความกว้าง: <b>{profile.width} ม.</b></div>
              <div>ความยาว: <b>{profile.length} ม.</b></div>
              <div>GVW: <b>{profile.gvw} ตัน</b></div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#B45309' }}>
              ข้อมูลข้อจำกัดเส้นทางจริงต้องเชื่อมต่อ HERE Truck Routing API หรือฐานข้อมูลกรมทางหลวง
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { TruckProfilePage });
