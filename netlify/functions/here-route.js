// netlify/functions/here-route.js
// Backend proxy: HERE Truck Routing API
// Environment variables:
//   HERE_API_KEY
//   ALLOWED_ORIGINS=https://example.com,https://example.netlify.app
//   HERE_RATE_LIMIT_PER_MINUTE=60

const buckets = globalThis.__tlHereRouteBuckets || new Map();
globalThis.__tlHereRouteBuckets = buckets;

function getOrigin(event) {
  return event.headers.origin || event.headers.Origin || '';
}

function getHost(event) {
  return event.headers.host || event.headers.Host || '';
}

function normalizeOrigin(origin) {
  return origin.replace(/\/$/, '');
}

function isOriginAllowed(event) {
  const origin = getOrigin(event);
  if (!origin) return true;

  try {
    if (new URL(origin).host === getHost(event)) return true;
  } catch (_) {
    return false;
  }

  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => normalizeOrigin(s.trim()))
    .filter(Boolean);
  return allowed.includes(normalizeOrigin(origin));
}

function buildHeaders(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
  const origin = getOrigin(event);
  if (origin && isOriginAllowed(event)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function rateLimitOk(event) {
  const max = Number(process.env.HERE_RATE_LIMIT_PER_MINUTE || 60);
  const windowMs = 60 * 1000;
  const ip = (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['client-ip'] ||
    event.headers['x-forwarded-for'] ||
    'unknown'
  ).split(',')[0].trim();
  const now = Date.now();
  const hits = (buckets.get(ip) || []).filter(ts => now - ts < windowMs);
  if (hits.length >= max) {
    buckets.set(ip, hits);
    return false;
  }
  hits.push(now);
  buckets.set(ip, hits);
  return true;
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function validRange(n, min, max) {
  return n != null && n >= min && n <= max;
}

exports.handler = async (event) => {
  const headers = buildHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: isOriginAllowed(event) ? 200 : 403, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!isOriginAllowed(event)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Origin not allowed' }) };
  }

  if (!rateLimitOk(event)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Rate limit exceeded' }) };
  }

  const HERE_API_KEY = process.env.HERE_API_KEY;
  if (!HERE_API_KEY) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'HERE_API_KEY not configured in Netlify environment variables' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const originLat = asNumber(body.originLat);
    const originLng = asNumber(body.originLng);
    const destLat = asNumber(body.destLat);
    const destLng = asNumber(body.destLng);
    const grossWeight = asNumber(body.grossWeight ?? 23000);
    const height = asNumber(body.height ?? 380);
    const width = asNumber(body.width ?? 240);
    const length = asNumber(body.length ?? 950);
    const axleCount = asNumber(body.axleCount ?? 3);

    if (!validRange(originLat, -90, 90) || !validRange(destLat, -90, 90) ||
        !validRange(originLng, -180, 180) || !validRange(destLng, -180, 180)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid origin/dest coordinates' }) };
    }

    if (!validRange(grossWeight, 1, 200000) || !validRange(height, 1, 1000) ||
        !validRange(width, 1, 500) || !validRange(length, 1, 3000) ||
        !validRange(axleCount, 1, 12)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid truck parameters' }) };
    }

    const params = new URLSearchParams({
      apiKey: HERE_API_KEY,
      origin: `${originLat},${originLng}`,
      destination: `${destLat},${destLng}`,
      transportMode: 'truck',
      return: 'summary,polyline',
      'vehicle[grossWeight]': grossWeight,
      'vehicle[height]': height,
      'vehicle[width]': width,
      'vehicle[length]': length,
      'vehicle[axleCount]': axleCount,
    });

    const res = await fetch(`https://router.hereapi.com/v8/routes?${params}`);

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: `HERE API error: ${res.status}` }),
      };
    }

    const data = await res.json();
    const section = data.routes?.[0]?.sections?.[0];

    if (!section) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'No route found' }) };
    }

    const distKm = Math.round(section.summary.length / 1000);
    const durMin = Math.round(section.summary.duration / 60);
    const h = Math.floor(durMin / 60), m = durMin % 60;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        distance_km: distKm,
        duration_min: durMin,
        timeText: `${h}h ${m}m`,
        polyline: section.polyline || null,
        source: 'here_truck',
        truckParams: { grossWeight, height, width, length, axleCount },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
