// js/export-bridge.js
// Saves/loads calculation data for report pages via localStorage.
// Also provides CSV download helper and report opener.

window.ExportBridge = (function () {

  const KEY = 'tl_export_v1';

  const MOCK = {
    originName:       'ขอนแก่น',
    destName:         'กรุงเทพมหานคร',
    loadedDistance:   445,
    emptyDistance:    445,
    totalDistance:    890,
    tripType:         'loadedOutEmpty',
    travelTime:       '6 ชั่วโมง 30 นาที',
    truckType:        'รถ 10 ล้อ',
    truckTypeEn:      '10-Wheel Truck',
    truckPlate:       'กข-1234 ขอนแก่น',
    driverName:       'นายสมชาย ใจดี',
    cargoType:        'ปุ๋ยเคมี',
    cargoWeight:      12,
    fuelType:         'ดีเซล B7',
    fuelPrice:        33.64,
    loadedKmPerLiter: 3.2,
    emptyKmPerLiter:  4.5,
    loadedFuelUsed:   139.06,
    emptyFuelUsed:    98.89,
    totalFuelUsed:    237.95,
    fuelCostLoaded:   4676.78,
    fuelCostEmpty:    3325.14,
    fuelCost:         8001.92,
    tollCost:         560,
    driverCost:       700,
    helperCost:       500,
    maintenanceCost:  1780,
    tireCost:         623,
    loadingCost:      1800,
    permitCost:       0,
    otherCost:        300,
    totalCost:        14264.92,
    costPerKm:        16.03,
    costPerTonKm:     2.67,
    freightRevenue:   18000,
    profit:           3735.08,
    companyName:      '',
    companyAddress:   '',
    docNumber:        'TL-20260514-001',
    calcDate:         '14/05/2569',
    calcTime:         '09:45',
  };

  function pad(n) { return String(n).padStart(3, '0'); }

  function genDocNum() {
    const d = new Date();
    const ymd = d.getFullYear().toString() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
    return 'TL-' + ymd + '-' + pad(Math.floor(Math.random() * 900) + 100);
  }

  function thaiDate() {
    return new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function thaiTime() {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  return {

    save(data) {
      try {
        const merged = {
          ...MOCK,
          ...data,
          docNumber: genDocNum(),
          calcDate: thaiDate(),
          calcTime: thaiTime(),
        };
        localStorage.setItem(KEY, JSON.stringify(merged));
      } catch (e) { console.warn('ExportBridge.save failed', e); }
    },

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) return { ...MOCK, ...JSON.parse(raw) };
      } catch (e) {}
      return { ...MOCK };
    },

    getMock() { return { ...MOCK }; },

    openReport(filename, autoPrint = false) {
      const url = 'reports/' + filename + '.html' + (autoPrint ? '?print=1' : '');
      window.open(url, '_blank');
    },

    downloadCSV(d) {
      const pct = v => d.totalCost > 0 ? (v / d.totalCost * 100).toFixed(1) + '%' : '0%';
      const rows = [
        ['รายการ / Item',                    'จำนวน (บาท) / Amount (THB)', 'สัดส่วน / Pct'],
        ['ค่าน้ำมัน / Fuel Cost',            (d.fuelCost||0).toFixed(2),        pct(d.fuelCost||0)],
        ['ค่าทางด่วน / Toll',                (d.tollCost||0).toFixed(2),        pct(d.tollCost||0)],
        ['ค่าแรงคนขับ / Driver',             (d.driverCost||0).toFixed(2),      pct(d.driverCost||0)],
        ['ค่าแรงผู้ช่วย / Helper',           (d.helperCost||0).toFixed(2),      pct(d.helperCost||0)],
        ['ค่าซ่อมบำรุง / Maintenance',       (d.maintenanceCost||0).toFixed(2), pct(d.maintenanceCost||0)],
        ['ค่ายาง / Tires',                   (d.tireCost||0).toFixed(2),        pct(d.tireCost||0)],
        ['ค่าโหลดสินค้า / Loading',          (d.loadingCost||0).toFixed(2),     pct(d.loadingCost||0)],
        ['ค่าใบอนุญาต / Permit',             (d.permitCost||0).toFixed(2),      pct(d.permitCost||0)],
        ['อื่นๆ / Other',                    (d.otherCost||0).toFixed(2),       pct(d.otherCost||0)],
        ['', '', ''],
        ['ต้นทุนรวม / Total Cost',            (d.totalCost||0).toFixed(2),       '100%'],
        ['ต้นทุน/กม. / Cost per km',          (d.costPerKm||0).toFixed(2),       ''],
        ['ต้นทุน/ตัน-กม. / Cost per ton-km', (d.costPerTonKm||0).toFixed(4),    ''],
        ['ค่าขนส่ง / Freight Revenue',        (d.freightRevenue||0).toFixed(2),  ''],
        ['กำไร/ขาดทุน / Profit',              (d.profit||0).toFixed(2),          ''],
        ['', '', ''],
        ['เส้นทาง / Route',   (d.originName || '') + ' → ' + (d.destName || ''), ''],
        ['ประเภทรถ / Truck',  d.truckType || '',  ''],
        ['สินค้า / Cargo',    d.cargoType  || '',  ''],
        ['วันที่ / Date',     d.calcDate   || '',  ''],
      ];
      const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'TruckLogis_' + (d.originName||'trip') + '_' + (d.destName||'') + '_' + new Date().toISOString().slice(0,10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
})();
