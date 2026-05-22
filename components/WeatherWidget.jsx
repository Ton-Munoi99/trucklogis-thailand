// components/WeatherWidget.jsx
// Open-Meteo weather alerts for truck route — free, no API key
const { useState, useEffect } = React;

const RISK_STYLE = {
  none:   { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#059669', label: 'เส้นทางปลอดภัย',     labelEn: 'Route Clear'      },
  low:    { bg: '#FFF7ED', border: '#FED7AA', text: '#7C2D12', dot: '#F97316', label: 'ระวัง: ฝนเล็กน้อย', labelEn: 'Minor Risk'       },
  medium: { bg: '#FFFBEB', border: '#FDE68A', text: '#78350F', dot: '#F59E0B', label: 'ระวัง: สภาพอากาศ',   labelEn: 'Caution'          },
  high:   { bg: '#FEF2F2', border: '#FECACA', text: '#7F1D1D', dot: '#DC2626', label: '⚠️ อันตราย: พายุ',   labelEn: 'High Risk'        },
};

const WeatherCard = ({ label, point, weather, loading }) => {
  if (loading) return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block', fontSize: 16 }}>⟳</span>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>กำลังโหลดสภาพอากาศ...</span>
    </div>
  );

  if (!weather) return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#94A3B8', display: 'flex', gap: 6, alignItems: 'center' }}>
      <span>☁️</span> ไม่พบข้อมูลสภาพอากาศสำหรับ {label}
    </div>
  );

  const rs = RISK_STYLE[weather.risk] || RISK_STYLE.none;
  const visKm = (weather.visibility / 1000).toFixed(1);

  return (
    <div style={{ background: rs.bg, border: `1px solid ${rs.border}`, borderRadius: 10, padding: '12px 14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: rs.dot, flexShrink: 0 }}></span>
          <span style={{ fontSize: 11, fontWeight: 700, color: rs.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
          <span style={{ fontSize: 11, color: rs.text, opacity: 0.7 }}>{point}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 20 }}>{weather.wmo.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: rs.text }}>{rs.label}</span>
        </div>
      </div>

      {/* Condition */}
      <div style={{ fontSize: 13, fontWeight: 700, color: rs.text, marginBottom: 8 }}>
        {weather.wmo.th}
        <span style={{ fontSize: 10, fontWeight: 400, color: rs.text, opacity: 0.7, marginLeft: 6 }}>({weather.wmo.en})</span>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {[
          { icon: '🌡', label: 'อุณหภูมิ', value: `${weather.temp}°C` },
          { icon: '💨', label: 'ลม',       value: `${weather.wind} km/h` },
          { icon: '💧', label: 'ฝน',       value: `${weather.precipitation} mm` },
          { icon: '👁', label: 'ทัศนวิสัย', value: `${visKm} กม.` },
        ].map(m => (
          <div key={m.label} style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 7, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, marginBottom: 2 }}>{m.icon}</div>
            <div style={{ fontSize: 9, color: rs.text, opacity: 0.7, marginBottom: 1 }}>{m.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: rs.text, fontFamily: 'IBM Plex Mono, monospace' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Wind gust + precip probability bar */}
      {(weather.gust > 30 || weather.precipProb > 20) && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {weather.gust > 30 && (
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '4px 10px', fontSize: 10.5, color: rs.text, fontWeight: 600 }}>
              💨 กระโชกแรงสูงสุด {weather.gust} km/h
            </div>
          )}
          {weather.precipProb > 20 && (
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '4px 10px', fontSize: 10.5, color: rs.text, fontWeight: 600 }}>
              🌂 โอกาสฝน {weather.precipProb}%
            </div>
          )}
        </div>
      )}

      {/* Driving alerts */}
      {weather.risk === 'high' && (
        <div style={{ marginTop: 8, background: 'rgba(220,38,38,0.1)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#7F1D1D', fontWeight: 600 }}>
          🚛 แนะนำ: ชะลอการเดินทาง หรือขับรถช้าลง — สภาพอากาศอันตราย
        </div>
      )}
      {weather.risk === 'medium' && (
        <div style={{ marginTop: 8, background: 'rgba(245,158,11,0.12)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#78350F', fontWeight: 600 }}>
          🚛 แนะนำ: ระวังพื้นถนนลื่น — ลดความเร็วในช่วงฝน
        </div>
      )}
    </div>
  );
};

// ── Overall route weather summary ─────────────────────────────────────────────
const RouteWeatherSummary = ({ originWeather, destWeather }) => {
  if (!originWeather && !destWeather) return null;

  const risks = [originWeather?.risk, destWeather?.risk].filter(Boolean);
  const worstRisk = risks.includes('high') ? 'high' : risks.includes('medium') ? 'medium' : risks.includes('low') ? 'low' : 'none';
  const rs = RISK_STYLE[worstRisk];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: rs.bg, border: `1px solid ${rs.border}`, borderRadius: 8, marginBottom: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: rs.dot, flexShrink: 0 }}></span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: rs.text }}>{rs.label}</span>
        <span style={{ fontSize: 10, color: rs.text, opacity: 0.7, marginLeft: 6 }}>{rs.labelEn}</span>
      </div>
      <span style={{ fontSize: 9.5, color: rs.text, opacity: 0.7 }}>Open-Meteo · ฟรี</span>
    </div>
  );
};

// ── Main WeatherWidget ────────────────────────────────────────────────────────
const WeatherWidget = ({ originCoords, destCoords, originName, destName, show }) => {
  const [weather,  setWeather]  = useState({ origin: null, dest: null });
  const [loading,  setLoading]  = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchWeather = async () => {
    if (!originCoords && !destCoords) return;
    if (!window.Routing) return;
    setLoading(true);
    try {
      const data = await window.Routing.getRouteWeather(originCoords, destCoords);
      setWeather(data);
      setLastFetch(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    if (show && (originCoords || destCoords)) fetchWeather();
  }, [show, originCoords?.[0], originCoords?.[1], destCoords?.[0], destCoords?.[1]]);

  if (!show) return null;

  return (
    <div style={{ padding: '14px 20px 0', animation: 'fadeIn 0.3s ease' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 20, background: '#0284C7', borderRadius: 2 }}></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>สภาพอากาศตามเส้นทาง</div>
            <div style={{ fontSize: 10, color: '#94A3B8' }}>
              Open-Meteo · ฟรี · ไม่ต้อง API Key
              {lastFetch && ` · อัปเดต ${lastFetch} น.`}
            </div>
          </div>
        </div>
        <button onClick={fetchWeather}
          style={{ padding: '5px 10px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 11, color: '#475569', fontFamily: 'Sarabun', display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>🔄</span>
          รีเฟรช
        </button>
      </div>

      {/* Summary bar */}
      <RouteWeatherSummary originWeather={weather.origin} destWeather={weather.dest} />

      {/* Origin card */}
      {originCoords && (
        <div style={{ marginBottom: 8 }}>
          <WeatherCard label="ต้นทาง" point={originName || ''} weather={weather.origin} loading={loading && !weather.origin} />
        </div>
      )}

      {/* Destination card */}
      {destCoords && (
        <WeatherCard label="ปลายทาง" point={destName || ''} weather={weather.dest} loading={loading && !weather.dest} />
      )}

      {!originCoords && !destCoords && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
          เลือกต้นทางหรือปลายทางก่อนเพื่อดูสภาพอากาศ
        </div>
      )}
    </div>
  );
};

Object.assign(window, { WeatherWidget });
