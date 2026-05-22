// TruckLogis Thailand — Calculation Engine
// All cost formulas per spec. No API calls here.

window.CalcEngine = (function () {

  // ── Haversine straight-line distance ──────────────────────────────────────
  function haversineKm(c1, c2) {
    const R = 6371, toR = d => d * Math.PI / 180;
    const dLat = toR(c2[0] - c1[0]), dLon = toR(c2[1] - c1[1]);
    const a = Math.sin(dLat/2)**2 + Math.cos(toR(c1[0])) * Math.cos(toR(c2[0])) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Route lookup (pre-computed matrix → fallback haversine × 1.28) ────────
  function getRouteInfo(originName, destName, originCoords, destCoords) {
    const matrix = window.AppData.ROUTE_MATRIX;

    // Helper: strip common suffixes for matching
    const strip = s => (s || '').replace(/\s*(ท่าเรือ|นิคมฯ|นิคม\S+|คลัง\S+|โรงงาน\S+|\(.*?\))/g, '').trim();
    const oKey = strip(originName);
    const dKey = strip(destName);

    const candidates = [
      `${originName}|${destName}`, `${destName}|${originName}`,
      `${oKey}|${dKey}`,          `${dKey}|${oKey}`,
    ];
    for (const k of candidates) {
      if (matrix[k]) {
        const [dist, time, toll] = matrix[k];
        return { distance: dist, timeText: time, tollBase: toll };
      }
    }

    // Fallback: haversine × 1.28 road-factor
    if (originCoords && destCoords) {
      const straight = haversineKm(originCoords, destCoords);
      const dist = Math.round(straight * 1.28);
      const hrs  = dist / 70;
      const h    = Math.floor(hrs), m = Math.round((hrs - h) * 60);
      return { distance: dist, timeText: `${h}h ${m}m`, tollBase: Math.round(dist * 0.45) };
    }
    return null;
  }

  // ── Toll scale by truck type ───────────────────────────────────────────────
  const TOLL_SCALE = {
    pickup: 0.6, truck4: 0.7, truck6: 0.8, truck10: 1.0,
    truck12: 1.2, trailer18: 1.6, semitrailer: 1.8,
    headtrailer: 1.8, dump: 1.0, heavy: 2.2, custom: 1.0,
  };

  function scaledToll(base, truckId) {
    return Math.round(base * (TOLL_SCALE[truckId] || 1.0));
  }

  // ── Travel days ───────────────────────────────────────────────────────────
  function estimateTravelDays(distanceKm, avgSpeedKmh = 70) {
    return Math.max(1, Math.ceil(distanceKm / (avgSpeedKmh * 8)));
  }

  // ── Core trip cost calculation ────────────────────────────────────────────
  // All parameter names match the spec exactly.
  function calculateTripCost(p) {
    const {
      loadedDistance    = 0,
      emptyDistance     = 0,
      loadedKmPerLiter  = 1,
      emptyKmPerLiter   = 1,
      fuelPrice         = 33.64,
      tollCost          = 0,
      driverDays        = 1,
      driverCostPerDay  = 0,
      helperDays        = 0,
      helperCostPerDay  = 0,
      maintenanceCostPerKm = 0,
      tireCostPerKm     = 0,
      loadingCost       = 0,
      permitCost        = 0,
      otherCost         = 0,
      cargoWeight       = 0,
      freightRevenue    = 0,
    } = p;

    // ─ Fuel
    const loadedFuelUsed = loadedKmPerLiter > 0 ? loadedDistance / loadedKmPerLiter : 0;
    const emptyFuelUsed  = emptyKmPerLiter  > 0 ? emptyDistance  / emptyKmPerLiter  : 0;
    const totalFuelUsed  = loadedFuelUsed + emptyFuelUsed;
    const fuelCostLoaded = loadedFuelUsed * fuelPrice;
    const fuelCostEmpty  = emptyFuelUsed  * fuelPrice;
    const fuelCost       = totalFuelUsed  * fuelPrice;

    // ─ Distance
    const totalDistance = loadedDistance + emptyDistance;

    // ─ Labor
    const driverCost = driverDays * driverCostPerDay;
    const helperCost = helperDays * helperCostPerDay;

    // ─ Variable
    const maintenanceCost = totalDistance * maintenanceCostPerKm;
    const tireCost        = totalDistance * tireCostPerKm;

    // ─ Total
    const totalCost = fuelCost + tollCost + driverCost + helperCost
                    + maintenanceCost + tireCost + loadingCost
                    + permitCost + otherCost;

    // ─ Per-unit KPIs
    const costPerKm    = totalDistance > 0 ? totalCost / totalDistance : 0;
    const costPerTonKm = (cargoWeight > 0 && loadedDistance > 0)
                         ? totalCost / (cargoWeight * loadedDistance) : 0;

    const profit = freightRevenue > 0 ? freightRevenue - totalCost : null;

    return {
      // Inputs echo
      loadedDistance, emptyDistance, totalDistance, fuelPrice,
      cargoWeight, freightRevenue,
      // Fuel breakdown
      loadedFuelUsed, emptyFuelUsed, totalFuelUsed,
      fuelCostLoaded, fuelCostEmpty, fuelCost,
      // Cost items
      tollCost, driverCost, helperCost,
      maintenanceCost, tireCost, loadingCost, permitCost, otherCost,
      // Totals
      totalCost, costPerKm, costPerTonKm, profit,
    };
  }

  // ── Formatters ────────────────────────────────────────────────────────────
  function fmtN(n, dec = 2) {
    if (n == null || isNaN(n)) return '—';
    return n.toLocaleString('th-TH', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtTHB(n) {
    if (n == null || isNaN(n)) return '—';
    return '฿' + fmtN(n, 2);
  }
  function fmtKm(n)  { return n == null ? '—' : fmtN(n, 1) + ' กม.'; }
  function fmtL(n)   { return n == null ? '—' : fmtN(n, 2) + ' ลิตร'; }
  function fmtTon(n) { return n == null ? '—' : fmtN(n, 2) + ' ตัน'; }

  return {
    haversineKm, getRouteInfo, scaledToll,
    estimateTravelDays, calculateTripCost,
    fmtN, fmtTHB, fmtKm, fmtL, fmtTon,
  };
})();
