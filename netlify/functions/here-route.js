// netlify/functions/here-route.js
// Backend proxy: HERE Truck Routing API
// Environment variable ที่ต้องตั้งใน Netlify:
//   HERE_API_KEY  ← ใส่ key ที่ได้จาก developer.here.com

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
    const {
      originLat, originLng, destLat, destLng,
      grossWeight = 23000,  // kg
      height      = 380,    // cm
      width       = 240,    // cm
      length      = 950,    // cm
      axleCount   = 3,
    } = body;

    if (!originLat || !destLat) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing origin/dest coordinates' }) };
    }

    const params = new URLSearchParams({
      apiKey:      HERE_API_KEY,
      origin:      `${originLat},${originLng}`,
      destination: `${destLat},${destLng}`,
      transportMode: 'truck',
      return:      'summary,polyline',
      'vehicle[grossWeight]':   grossWeight,
      'vehicle[height]':        height,
      'vehicle[width]':         width,
      'vehicle[length]':        length,
      'vehicle[axleCount]':     axleCount,
    });

    const res = await fetch(`https://router.hereapi.com/v8/routes?${params}`);

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: `HERE API error: ${res.status}`, detail: errText }),
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
        distance_km:  distKm,
        duration_min: durMin,
        timeText:     `${h}h ${m}m`,
        polyline:     section.polyline || null,
        source:       'here_truck',
        truckParams:  { grossWeight, height, width, length, axleCount },
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
