// netlify/functions/fuel-price.js
// Backend proxy: ดึงราคาน้ำมันจาก PTT OilPrice API
// Environment variable ที่ต้องตั้งใน Netlify:
//   PTT_API_KEY (ถ้า PTT กำหนด) — ปัจจุบัน PTT เป็น public endpoint ไม่ต้อง key

const FUEL_FALLBACK = {
  'ดีเซล B7':      33.64,
  'ดีเซล B20':     34.34,
  'ดีเซล Premium': 39.56,
  'NGV':           15.59,
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600', // cache 1 hour
  };

  try {
    // TODO: Replace with actual PTT OilPrice endpoint when available
    // PTT Web Service: https://www.pttor.com/th (check developer portal)
    // Example endpoint: https://www.pttplc.com/api/oilprice/current
    //
    // const res = await fetch('https://www.pttplc.com/api/oilprice/current', {
    //   headers: { 'Authorization': `Bearer ${process.env.PTT_API_KEY}` }
    // });
    // const data = await res.json();
    // const prices = parsePTTResponse(data);

    // For now: return hardcoded + timestamp (replace with real API call)
    const prices = {
      'ดีเซล B7':      { price: FUEL_FALLBACK['ดีเซล B7'],      source: 'PTT (Manual)', updated: new Date().toISOString() },
      'ดีเซล B20':     { price: FUEL_FALLBACK['ดีเซล B20'],     source: 'PTT (Manual)', updated: new Date().toISOString() },
      'ดีเซล Premium': { price: FUEL_FALLBACK['ดีเซล Premium'], source: 'Bangchak (Manual)', updated: new Date().toISOString() },
      'NGV':           { price: FUEL_FALLBACK['NGV'],           source: 'PTT (Manual)', updated: new Date().toISOString() },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, prices, fetchedAt: new Date().toISOString() }),
    };
  } catch (err) {
    return {
      statusCode: 200, // return 200 with fallback so frontend still works
      headers,
      body: JSON.stringify({ success: false, prices: Object.fromEntries(
        Object.entries(FUEL_FALLBACK).map(([k,v]) => [k, { price: v, source: 'Fallback', updated: new Date().toISOString() }])
      ), error: err.message }),
    };
  }
};
