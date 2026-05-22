# TruckLogis Thailand — CLAUDE.md
# คำแนะนำสำหรับ Claude Code เมื่อเปิด Project นี้

## Project Overview
Internal truck logistics cost calculator for a logistics team (3 users).
Built as static HTML/JSX with Netlify Functions as backend proxy.

## Tech Stack
- **Frontend**: Vanilla HTML + React 18 (via CDN, Babel standalone) + JSX components
- **Backend**: Netlify Functions (Node.js 18) — proxy layer for API keys
- **Maps**: Leaflet.js + OpenStreetMap tiles
- **Charts**: Chart.js 4.x
- **Routing**: OSRM (free demo) → HERE Truck Routing (paid, via backend proxy)
- **Geocoding**: Nominatim (OSM) → HERE Geocoding (via backend proxy)
- **Weather**: Open-Meteo (free, no key)
- **POIs**: Overpass API (free, OSM data)

## File Structure
```
index.html                  ← Main entry point
app.jsx                     ← Root React app, nav routing
js/
  data.js                   ← Mock data (truck profiles, Thai cities, routes)
  calc.js                   ← Calculation engine (all cost formulas)
  routing.js                ← Free API layer (Nominatim, OSRM, Geolocation, Overpass, Open-Meteo)
  export-bridge.js          ← localStorage save/load for report generation
components/
  CalculatorPage.jsx        ← Main calculator UI (route input + truck selection)
  ResultsPanel.jsx          ← Cost breakdown + charts after calculation
  TruckMap.jsx              ← Leaflet map with POI markers
  WeatherWidget.jsx         ← Open-Meteo weather cards
  TruckProfilePage.jsx      ← Truck fleet management
  DashboardPage.jsx         ← Analytics dashboard (Chart.js)
  TripLogPage.jsx           ← Trip history + CRUD + CSV export
  ExportPage.jsx            ← Report hub
  SecondaryPages.jsx        ← Fuel prices, Scenarios, Saved Routes, API Settings
reports/
  TripCostSummary.html      ← A4 PDF report
  DriverBriefing.html       ← Driver briefing sheet
  FreightQuote.html         ← Customer freight quote
  MonthlyReport.html        ← Fleet monthly report
  ScenarioComparison.html   ← Scenario comparison (A4 Landscape)
netlify/
  functions/
    fuel-price.js           ← Proxy: PTT/Bangchak fuel price API
    here-route.js           ← Proxy: HERE Truck Routing API
    here-geocode.js         ← Proxy: HERE Geocoding API
```

## Calculation Logic (calc.js)
All formulas are in `window.CalcEngine.calculateTripCost(params)`:
- **Loaded fuel cost** = (loadedDistance / loadedKmPerLiter) × fuelPrice
- **Empty return fuel cost** = (emptyDistance / emptyKmPerLiter) × fuelPrice
- **Toll cost** = scaled by truck type (EXAT/Tollway hardcoded table)
- **Driver cost** = driverDays × driverCostPerDay
- **Helper cost** = helperDays × helperCostPerDay
- **Maintenance cost** = totalDistance × maintenanceCostPerKm
- **Tire cost** = totalDistance × tireCostPerKm
- **Loading/unloading cost** = per trip
- **Total cost** = sum of all above
- **Cost per km** = totalCost / totalDistance
- **Cost per ton-km** = totalCost / (cargoWeight × loadedDistance)

## Environment Variables (Netlify)
Set in Netlify Dashboard → Site Settings → Environment Variables:
- `HERE_API_KEY` — HERE Maps API key (free 250K calls/month)
- `PTT_API_KEY` — PTT OilPrice API key (optional)

## Key Conventions
- Thai language UI (Sarabun font), bilingual labels in reports
- All costs in Thai Baht (฿)
- IBM Plex Mono for numbers
- Color system: #2563EB (blue), #059669 (green), #DC2626 (red), #0D1B2A (navy)
- Components export to `window` via `Object.assign(window, { ComponentName })`
- Data persisted in localStorage: `tl_export_v1` (trip data), `tl_trip_log_v1` (log)

## What Needs Production Work
1. **Replace mock data** in `js/data.js` with real API calls
2. **Wire Netlify functions** in `js/routing.js` — change fetch URLs from direct API calls to `/api/here-route`, `/api/here-geocode`
3. **PTT OilPrice API** — update `netlify/functions/fuel-price.js` with real endpoint
4. **Authentication** — add simple password or IP restriction if needed
5. **Truck profiles** — update default values to match actual fleet specs

## Development Commands
```bash
npm install          # install netlify-cli
netlify dev          # local dev server with functions at localhost:8888
netlify deploy       # deploy preview
netlify deploy --prod  # deploy to production
```
