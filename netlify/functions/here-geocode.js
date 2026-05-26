// netlify/functions/here-geocode.js
// Backend proxy: HERE Geocoding & Search API
// Environment variables:
//   HERE_API_KEY
//   ALLOWED_ORIGINS=https://example.com,https://example.netlify.app
//   HERE_RATE_LIMIT_PER_MINUTE=120

const buckets = globalThis.__tlHereGeocodeBuckets || new Map();
globalThis.__tlHereGeocodeBuckets = buckets;

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
    'Cache-Control': 'public, max-age=86400',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
  const origin = getOrigin(event);
  if (origin && isOriginAllowed(event)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function rateLimitOk(event) {
  const max = Number(process.env.HERE_RATE_LIMIT_PER_MINUTE || 120);
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

  if (event.httpMethod !== 'GET') {
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
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'HERE_API_KEY not set' }) };
  }

  try {
    const { q, lat, lng, mode = 'search' } = event.queryStringParameters || {};
    const safeMode = mode === 'reverse' ? 'reverse' : 'search';

    let url;
    if (safeMode === 'reverse') {
      const latNum = asNumber(lat);
      const lngNum = asNumber(lng);
      if (!validRange(latNum, -90, 90) || !validRange(lngNum, -180, 180)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid lat/lng' }) };
      }
      const params = new URLSearchParams({
        at: `${latNum},${lngNum}`,
        lang: 'th',
        apiKey: HERE_API_KEY,
      });
      url = `https://revgeocode.search.hereapi.com/v1/revgeocode?${params}`;
    } else if (q) {
      if (q.length > 120) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Query too long' }) };
      }
      const params = new URLSearchParams({
        q,
        in: 'countryCode:THA',
        lang: 'th',
        limit: '8',
        apiKey: HERE_API_KEY,
      });
      url = `https://autocomplete.search.hereapi.com/v1/autocomplete?${params}`;
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing q or lat/lng' }) };
    }

    const res = await fetch(url);
    const data = await res.json();

    return { statusCode: res.ok ? 200 : res.status, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
