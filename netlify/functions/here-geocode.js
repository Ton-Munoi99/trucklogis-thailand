// netlify/functions/here-geocode.js
// Backend proxy: HERE Geocoding & Search API
// Environment variable: HERE_API_KEY

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=86400',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const HERE_API_KEY = process.env.HERE_API_KEY;
  if (!HERE_API_KEY) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'HERE_API_KEY not set' }) };
  }

  try {
    const { q, lat, lng, mode = 'search' } = event.queryStringParameters || {};

    let url;
    if (mode === 'reverse' && lat && lng) {
      // Reverse geocode
      url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=th&apiKey=${HERE_API_KEY}`;
    } else if (q) {
      // Forward geocode / autocomplete — restricted to Thailand
      url = `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(q)}&in=countryCode:THA&lang=th&limit=8&apiKey=${HERE_API_KEY}`;
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing q or lat/lng' }) };
    }

    const res  = await fetch(url);
    const data = await res.json();

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
