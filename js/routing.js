// js/routing.js
// Free-tier routing layer for TruckLogis Thailand
//
// Stack (100% free, no paid API keys required):
//   Geocoding   → Nominatim (OpenStreetMap) – https://nominatim.org
//   Routing     → OSRM Demo Server          – https://router.project-osrm.org
//   Truck Route → HERE Free Tier (250K/mo)  – key set in ApiSettings, falls back to OSRM
//   Geolocation → Browser Geolocation API   – built-in, free
//   Tiles       → OpenStreetMap             – free
//
// Nominatim rate-limit policy: max 1 request/second per IP.
// We debounce all calls to 600ms and cache results in memory.

window.Routing = (function () {

  // ── Nominatim cache ───────────────────────────────────────────────────────
  const _cache = {};
  let _lastNomReq = 0; // timestamp

  // Enforce 1 req/s gap
  async function _nomDelay() {
    const now = Date.now();
    const gap = now - _lastNomReq;
    if (gap < 1050) await _sleep(1050 - gap);
    _lastNomReq = Date.now();
  }

  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── Nominatim: text → places ───────────────────────────────────────────────
  // Returns array of { name, display_name, lat, lng, type, province }
  async function searchNominatim(query) {
    if (!query || query.length < 2) return [];
    const cacheKey = 'srch:' + query.toLowerCase().trim();
    if (_cache[cacheKey]) return _cache[cacheKey];

    await _nomDelay();

    const params = new URLSearchParams({
      q: query,
      countrycodes: 'th',
      format: 'json',
      limit: 10,
      addressdetails: 1,
      'accept-language': 'th,en',
    });

    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?' + params,
        { headers: { 'Accept-Language': 'th,en' } }
      );
      if (!res.ok) throw new Error('Nominatim HTTP ' + res.status);
      const data = await res.json();

      const results = data.map(item => ({
        name:         item.display_name.split(',')[0].trim(),
        display_name: item.display_name,
        lat:          parseFloat(item.lat),
        lng:          parseFloat(item.lon),
        province:     item.address?.state || item.address?.province || '',
        type:         _nomType(item),
        source:       'nominatim',
      }));

      _cache[cacheKey] = results;
      return results;
    } catch (err) {
      console.warn('[Routing] Nominatim search failed:', err.message);
      return [];
    }
  }

  function _nomType(item) {
    const c = item.class || '', t = item.type || '';
    if (c === 'amenity' && t === 'port') return 'port';
    if (c === 'landuse' && t === 'industrial') return 'industrial';
    if (c === 'place') return 'city';
    if (c === 'highway') return 'road';
    return 'place';
  }

  // Merge Nominatim results with local AppData list — local always first
  async function searchWithFallback(query) {
    const lower = query.toLowerCase();
    const local = (window.AppData?.THAI_CITIES || [])
      .filter(c => c.name.toLowerCase().includes(lower) || c.province.toLowerCase().includes(lower))
      .slice(0, 6)
      .map(c => ({ ...c, lng: c.coords[1], lat: c.coords[0], source: 'local' }));

    // If local has good results skip network
    if (local.length >= 4) return local;

    const remote = await searchNominatim(query);
    // Dedupe by proximity (>0.05° apart)
    const merged = [...local];
    remote.forEach(r => {
      const dup = merged.some(l => Math.abs(l.lat - r.lat) < 0.05 && Math.abs((l.lng||l.coords?.[1]||0) - r.lng) < 0.05);
      if (!dup) merged.push(r);
    });
    return merged.slice(0, 9);
  }

  // ── Nominatim: coords → place name ───────────────────────────────────────
  async function reverseGeocode(lat, lng) {
    const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (_cache[cacheKey]) return _cache[cacheKey];

    await _nomDelay();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th,en`
      );
      if (!res.ok) throw new Error('Nominatim reverse HTTP ' + res.status);
      const data = await res.json();

      const result = {
        name: (data.address?.village || data.address?.town || data.address?.city ||
               data.address?.county || data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`).trim(),
        display_name: data.display_name || '',
        lat, lng,
        province: data.address?.state || data.address?.province || '',
        type: 'place',
        source: 'nominatim',
      };

      _cache[cacheKey] = result;
      return result;
    } catch (err) {
      console.warn('[Routing] Reverse geocode failed:', err.message);
      return { name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng, source: 'fallback' };
    }
  }

  // ── Browser Geolocation API ───────────────────────────────────────────────
  // Returns Promise<{ lat, lng, accuracy }>
  function getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation ไม่รองรับในเบราว์เซอร์นี้'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        err => reject(new Error(_geoError(err.code))),
        { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true, ...options }
      );
    });
  }

  function _geoError(code) {
    return { 1: 'ผู้ใช้ปฏิเสธการเข้าถึงตำแหน่ง', 2: 'ไม่สามารถระบุตำแหน่งได้', 3: 'หมดเวลา (Timeout)' }[code] || 'เกิดข้อผิดพลาด';
  }

  // ── OSRM: free road routing (no API key needed) ───────────────────────────
  // Returns { distance_km, duration_min, geometry_geojson } | null
  // Note: OSRM public demo → for production use self-hosted or HERE free tier
  async function getRouteOSRM(originCoords, destCoords) {
    if (!originCoords || !destCoords) return null;
    const [oLat, oLng] = originCoords;
    const [dLat, dLng] = destCoords;
    // OSRM uses lng,lat order
    const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&annotations=false`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM HTTP ' + res.status);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM no route');

      const route = data.routes[0];
      const dist  = route.distance / 1000;          // metres → km
      const dur   = route.duration / 60;            // seconds → minutes
      const h     = Math.floor(dur / 60);
      const m     = Math.round(dur % 60);

      return {
        distance_km:    Math.round(dist),
        duration_min:   Math.round(dur),
        timeText:       `${h}h ${m}m`,
        geometry:       route.geometry,              // GeoJSON LineString
        source:         'osrm',
      };
    } catch (err) {
      console.warn('[Routing] OSRM failed:', err.message);
      return null;
    }
  }

  // ── HERE Truck Routing (free tier, 250K/month) ────────────────────────────
  // Requires API key from https://developer.here.com
  // Set key in ApiSettings → stored in localStorage key 'tl_here_key'
  async function getRouteTruckHERE(originCoords, destCoords, truckParams = {}) {
    const apiKey = localStorage.getItem('tl_here_key') || 'zvWjE4HMHV4HFpdRo5-5e-ITncL69N0bBR-f_EPkgZk';
    if (!apiKey) {
      console.info('[Routing] HERE API key not set — falling back to OSRM');
      return null;
    }

    const { grossWeight = 23000, height = 380, width = 240, length = 950, axleCount = 3 } = truckParams;
    const [oLat, oLng] = originCoords;
    const [dLat, dLng] = destCoords;

    const params = new URLSearchParams({
      apiKey,
      origin:      `${oLat},${oLng}`,
      destination: `${dLat},${dLng}`,
      transportMode: 'truck',
      'vehicle[grossWeight]':   grossWeight,
      'vehicle[height]':        height,
      'vehicle[width]':         width,
      'vehicle[length]':        length,
      'vehicle[axleCount]':     axleCount,
      return: 'summary,polyline',
    });

    try {
      const res = await fetch('https://router.hereapi.com/v8/routes?' + params);
      if (!res.ok) throw new Error('HERE HTTP ' + res.status);
      const data = await res.json();
      const route = data.routes?.[0]?.sections?.[0]?.summary;
      if (!route) throw new Error('HERE no route');

      const dist = route.length / 1000;
      const dur  = route.duration / 60;
      const h = Math.floor(dur / 60), m = Math.round(dur % 60);

      return {
        distance_km:  Math.round(dist),
        duration_min: Math.round(dur),
        timeText:     `${h}h ${m}m`,
        source:       'here_truck',
      };
    } catch (err) {
      console.warn('[Routing] HERE Truck Routing failed:', err.message, '— falling back to OSRM');
      return null;
    }
  }

  // ── Combined route info: HERE first, OSRM fallback, local matrix last ─────
  async function getRouteInfo(originName, destName, originCoords, destCoords, truckParams) {
    // 1. Try local pre-computed matrix (instant)
    const local = window.CalcEngine?.getRouteInfo(originName, destName, originCoords, destCoords);

    // 2. Try HERE Truck Routing (if key set)
    const here = await getRouteTruckHERE(originCoords, destCoords, truckParams);
    if (here) {
      return {
        distance:   here.distance_km,
        timeText:   here.timeText,
        tollBase:   local?.tollBase || Math.round(here.distance_km * 0.45),
        source:     'here_truck',
      };
    }

    // 3. Try OSRM free demo
    const osrm = await getRouteOSRM(originCoords, destCoords);
    if (osrm) {
      return {
        distance:   osrm.distance_km,
        timeText:   osrm.timeText,
        tollBase:   local?.tollBase || Math.round(osrm.distance_km * 0.45),
        geometry:   osrm.geometry,
        source:     'osrm',
      };
    }

    // 4. Fall back to local haversine estimate
    return local || null;
  }

  // ── OSRM geometry → Leaflet LatLng array ─────────────────────────────────
  function osrmGeometryToLatLngs(geojson) {
    if (!geojson || geojson.type !== 'LineString') return null;
    return geojson.coordinates.map(([lng, lat]) => [lat, lng]);
  }

  // ── Overpass API: fuel stations, rest stops, truck stops ────────────────
  // https://overpass-api.de — free, uses OSM data
  // Query POIs within a bounding box around the route
  const _overpassCache = {};

  async function queryOverpassInBbox(south, west, north, east, types = ['fuel','rest_area','truck_stop']) {
    const cacheKey = `ovp:${south.toFixed(2)},${west.toFixed(2)},${north.toFixed(2)},${east.toFixed(2)},${types.join(',')}`;
    if (_overpassCache[cacheKey] && (Date.now() - _overpassCache[cacheKey]._ts < 60 * 60 * 1000)) {
      return _overpassCache[cacheKey].data;
    }

    const bbox = `${south},${west},${north},${east}`;
    const filters = types.map(t => {
      if (t === 'fuel')       return `node["amenity"="fuel"](${bbox});way["amenity"="fuel"](${bbox});`;
      if (t === 'rest_area')  return `node["amenity"="rest_area"](${bbox});node["highway"="rest_area"](${bbox});`;
      if (t === 'truck_stop') return `node["amenity"="truck_stop"](${bbox});`;
      return '';
    }).join('\n');

    const query = `[out:json][timeout:20];(\n${filters}\n);out center;`;

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
      const data = await res.json();

      const pois = (data.elements || []).map(el => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (!lat || !lng) return null;
        const tags = el.tags || {};
        return {
          id:       el.id,
          lat, lng,
          name:     tags.name || tags['name:th'] || '',
          amenity:  tags.amenity || tags.highway || 'unknown',
          brand:    tags.brand   || tags.operator || '',
          fuel:     tags['fuel:diesel'] || tags['fuel:octane_95'] || '',
          opening:  tags.opening_hours  || '',
          phone:    tags.phone || tags['contact:phone'] || '',
          type:     tags.amenity === 'fuel' ? 'fuel' : tags.amenity === 'truck_stop' ? 'truck_stop' : 'rest_area',
        };
      }).filter(Boolean);

      _overpassCache[cacheKey] = { data: pois, _ts: Date.now() };
      return pois;
    } catch (err) {
      console.warn('[Routing] Overpass failed:', err.message);
      return [];
    }
  }

  // Query POIs along route using bounding box with 20km buffer
  async function getRoutePOIs(originCoords, destCoords, types) {
    if (!originCoords || !destCoords) return [];
    const lats  = [originCoords[0], destCoords[0]];
    const lngs  = [originCoords[1], destCoords[1]];
    const buf   = 0.18; // ~20km
    const south = Math.min(...lats) - buf;
    const north = Math.max(...lats) + buf;
    const west  = Math.min(...lngs) - buf;
    const east  = Math.max(...lngs) + buf;
    return queryOverpassInBbox(south, west, north, east, types);
  }

  // ── Open-Meteo: free weather (no API key needed) ─────────────────────────
  // https://open-meteo.com — free, unlimited, no registration
  // WMO weather code descriptions
  const WMO = {
    0:  { th: 'ท้องฟ้าแจ่มใส',     en: 'Clear sky',          icon: '☀️',  risk: 'none'   },
    1:  { th: 'มีเมฆบางส่วน',       en: 'Mainly clear',       icon: '🌤',  risk: 'none'   },
    2:  { th: 'มีเมฆปกคลุม',        en: 'Partly cloudy',      icon: '⛅',  risk: 'none'   },
    3:  { th: 'มีเมฆมาก',           en: 'Overcast',           icon: '☁️',  risk: 'none'   },
    45: { th: 'หมอก',               en: 'Fog',                icon: '🌫',  risk: 'medium' },
    48: { th: 'หมอกหนาค้างคืน',    en: 'Icy fog',            icon: '🌫',  risk: 'medium' },
    51: { th: 'ฝนละออง (เบา)',     en: 'Light drizzle',       icon: '🌦',  risk: 'low'    },
    53: { th: 'ฝนละออง (ปานกลาง)', en: 'Moderate drizzle',   icon: '🌦',  risk: 'low'    },
    55: { th: 'ฝนละออง (หนัก)',    en: 'Dense drizzle',      icon: '🌧',  risk: 'medium' },
    61: { th: 'ฝนเบา',             en: 'Slight rain',         icon: '🌧',  risk: 'low'    },
    63: { th: 'ฝนปานกลาง',         en: 'Moderate rain',      icon: '🌧',  risk: 'medium' },
    65: { th: 'ฝนหนัก',            en: 'Heavy rain',          icon: '🌧',  risk: 'high'   },
    80: { th: 'ฝนตกเป็นช่วงๆ (เบา)', en: 'Slight showers',  icon: '🌦',  risk: 'low'    },
    81: { th: 'ฝนตกเป็นช่วงๆ',    en: 'Moderate showers',   icon: '🌧',  risk: 'medium' },
    82: { th: 'ฝนตกหนักเป็นช่วงๆ', en: 'Violent showers',   icon: '⛈',  risk: 'high'   },
    95: { th: 'พายุฝนฟ้าคะนอง',   en: 'Thunderstorm',        icon: '⛈',  risk: 'high'   },
    96: { th: 'พายุฝนพร้อมลูกเห็บ', en: 'Thunderstorm+hail', icon: '⛈',  risk: 'high'   },
    99: { th: 'พายุรุนแรง+ลูกเห็บ', en: 'Severe storm',      icon: '🌪',  risk: 'high'   },
  };

  function _wmoInfo(code) {
    return WMO[code] || { th: 'ไม่ทราบสภาพ', en: 'Unknown', icon: '❓', risk: 'none' };
  }

  // Returns weather object for a single coordinate
  async function getWeatherAt(lat, lng) {
    const cacheKey = `wx:${lat.toFixed(2)},${lng.toFixed(2)}`;
    if (_cache[cacheKey] && (Date.now() - _cache[cacheKey]._ts < 30 * 60 * 1000)) {
      return _cache[cacheKey];
    }

    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lng,
      current:   'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,visibility',
      hourly:    'precipitation_probability',
      timezone:  'Asia/Bangkok',
      forecast_days: 1,
    });

    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?' + params);
      if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
      const data = await res.json();
      const c = data.current;
      const precipProb = data.hourly?.precipitation_probability?.slice(0, 6) || [];
      const maxPrecipProb = precipProb.length ? Math.max(...precipProb) : 0;

      const wmo  = _wmoInfo(c.weather_code);
      const wind = c.wind_speed_10m || 0;
      const gust = c.wind_gusts_10m || 0;
      const vis  = c.visibility     || 10000; // metres

      // Compute overall driving risk
      let risk = wmo.risk;
      if (wind > 50 || gust > 70)        risk = 'high';
      else if (wind > 30 && risk !== 'high') risk = 'medium';
      if (vis < 200)                      risk = 'high';
      else if (vis < 1000 && risk !== 'high') risk = 'medium';

      const result = {
        temp:       c.temperature_2m,
        humidity:   c.relative_humidity_2m,
        wind,
        gust,
        precipitation: c.precipitation || 0,
        precipProb: maxPrecipProb,
        visibility: vis,
        weatherCode: c.weather_code,
        wmo,
        risk,
        time: c.time,
        _ts: Date.now(),
        source: 'open-meteo',
      };

      _cache[cacheKey] = result;
      return result;
    } catch (err) {
      console.warn('[Routing] Open-Meteo failed:', err.message);
      return null;
    }
  }

  // Fetch weather for both origin and destination in parallel
  async function getRouteWeather(originCoords, destCoords) {
    const [origin, dest] = await Promise.all([
      originCoords ? getWeatherAt(originCoords[0], originCoords[1]) : null,
      destCoords   ? getWeatherAt(destCoords[0],   destCoords[1])   : null,
    ]);
    return { origin, dest };
  }

  return {
    searchNominatim,
    searchWithFallback,
    reverseGeocode,
    getCurrentPosition,
    getRouteOSRM,
    getRouteTruckHERE,
    getRouteInfo,
    osrmGeometryToLatLngs,
    getWeatherAt,
    getRouteWeather,
    getRoutePOIs,
    queryOverpassInBbox,
    WMO,
  };
})();
