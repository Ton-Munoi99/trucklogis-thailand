# 🚀 DEPLOY.md — คู่มือ Deploy TruckLogis Thailand
# GitHub + Netlify + Claude Code Desktop

---

## ขั้นตอนทั้งหมด (ใช้เวลารวมประมาณ 30 นาที)

```
[1] GitHub   → สร้าง repo + push code
[2] Netlify  → เชื่อม GitHub + deploy อัตโนมัติ
[3] HERE API → สมัคร + ตั้งค่า environment variable
[4] Claude Code Desktop → clone + พัฒนาต่อ
```

---

## STEP 1 — สร้าง GitHub Repository

### 1.1 สร้าง repo ใหม่บน GitHub
1. ไปที่ https://github.com/new
2. ตั้งชื่อ: `trucklogis-thailand`
3. เลือก **Private** (ใช้ในองค์กร)
4. ❌ อย่าติ๊ก "Add README" (เพราะ code เรามีอยู่แล้ว)
5. กด **Create repository**
6. คัดลอก URL เช่น `https://github.com/yourname/trucklogis-thailand.git`

### 1.2 Download โปรเจกต์จาก Anthropic
1. กดปุ่ม **Download** ที่ด้านบนของ project นี้
2. แตก zip ได้โฟลเดอร์ `trucklogis-thailand/`

### 1.3 Push ขึ้น GitHub (ทำใน Terminal / Git Bash)
```bash
cd trucklogis-thailand         # เข้าโฟลเดอร์

git init                       # เริ่ม git
git add .                      # เพิ่มทุกไฟล์
git commit -m "Initial commit — TruckLogis Thailand v1"

git remote add origin https://github.com/YOUR_USERNAME/trucklogis-thailand.git
git branch -M main
git push -u origin main        # push ขึ้น GitHub
```

✅ ตอนนี้ code อยู่บน GitHub แล้ว

---

## STEP 2 — Deploy บน Netlify (ฟรี)

### 2.1 สมัคร Netlify
1. ไปที่ https://netlify.com
2. กด **Sign up** → เลือก **Sign up with GitHub** (สะดวกที่สุด)
3. อนุญาต Netlify เข้าถึง GitHub

### 2.2 สร้าง Site ใหม่
1. กด **Add new site** → **Import an existing project**
2. เลือก **Deploy with GitHub**
3. เลือก repo `trucklogis-thailand`
4. ตั้งค่า Build settings:
   - **Branch to deploy**: `main`
   - **Build command**: *(เว้นว่าง)*
   - **Publish directory**: `.`  ← สำคัญมาก ใส่จุดเดียว
5. กด **Deploy site**

### 2.3 รอ Deploy เสร็จ
- Netlify จะให้ URL ชั่วคราว เช่น `https://amazing-truck-abc123.netlify.app`
- ลองเปิด URL → แอปทำงานได้ทันที ✅

### 2.4 เปลี่ยนชื่อ Site (Optional)
1. **Site settings** → **General** → **Site details** → **Change site name**
2. ตั้งชื่อ เช่น `trucklogis` → URL จะเป็น `https://trucklogis.netlify.app`

---

## STEP 3 — ตั้งค่า HERE API Key

### 3.1 สมัคร HERE Developer Account (ฟรี)
1. ไปที่ https://developer.here.com
2. กด **Get started for free**
3. สร้าง account (ใช้ email องค์กร)
4. ยืนยัน email

### 3.2 สร้าง API Key
1. Login → ไปที่ https://platform.here.com
2. กด **Create project** → ตั้งชื่อ "TruckLogis"
3. ไปที่ **Access Manager** → **OAuth 2.0 Client**
4. กด **Create credentials** → เลือก **API Key**
5. คัดลอก API Key (เก็บไว้ปลอดภัย)

### 3.3 ใส่ HERE API Key ใน Netlify
1. Netlify Dashboard → เลือก site ของคุณ
2. **Site settings** → **Environment variables**
3. กด **Add a variable**:
   - Key: `HERE_API_KEY`
   - Value: `[วาง API key ที่ได้]`
4. กด **Save**
5. **Trigger deploy** อีกครั้ง:
   Deploys → **Trigger deploy** → **Deploy site**

✅ ตอนนี้ HERE Truck Routing ทำงานได้จริงแล้ว

---

## STEP 4 — ตั้งค่า Claude Code Desktop

### 4.1 ติดตั้ง Claude Code
```bash
# macOS / Linux
brew install claude-code
# หรือ
npm install -g @anthropic-ai/claude-code

# Windows
npm install -g @anthropic-ai/claude-code
```
หรือดาวน์โหลดจาก https://claude.ai/code

### 4.2 Clone โปรเจกต์จาก GitHub
```bash
git clone https://github.com/YOUR_USERNAME/trucklogis-thailand.git
cd trucklogis-thailand
npm install          # ติดตั้ง netlify-cli
```

### 4.3 ตั้งค่า Environment Variables (Local)
```bash
cp .env.example .env
# แก้ไขไฟล์ .env ใส่ HERE_API_KEY จริง
```

### 4.4 Run Local Dev Server
```bash
netlify dev
# เปิด browser ไปที่ http://localhost:8888
# Netlify Functions ทำงานได้เลย ไม่ต้องแยก server
```

### 4.5 เปิด Claude Code Desktop
```bash
claude .            # เปิด Claude Code ใน folder นี้
```

Claude Code จะอ่าน `CLAUDE.md` อัตโนมัติ → รู้ว่า project นี้คืออะไร ทำอะไรได้บ้าง

---

## STEP 5 — Workflow พัฒนาต่อ

### วิธี Deploy ทุกครั้งที่แก้ไข code
```bash
git add .
git commit -m "แก้ไข: [ระบุสิ่งที่เปลี่ยน]"
git push origin main
# Netlify auto-deploy ภายใน 30 วินาที ✅
```

### Branch workflow (แนะนำ)
```bash
git checkout -b feature/add-new-route   # สร้าง branch ใหม่
# แก้ไข code...
git add . && git commit -m "เพิ่มเส้นทางใหม่"
git push origin feature/add-new-route
# สร้าง Pull Request บน GitHub → merge → auto-deploy
```

---

## สิ่งที่ต้องทำต่อใน Claude Code

### Priority 1 — Connect Real APIs
แก้ไขใน `js/routing.js`:
```javascript
// เปลี่ยนจาก direct HERE call:
const res = await fetch('https://router.hereapi.com/v8/routes?' + params);

// เป็น Netlify Function proxy:
const res = await fetch('/api/here-route', {
  method: 'POST',
  body: JSON.stringify({ originLat, originLng, destLat, destLng, ...truckParams })
});
```

### Priority 2 — Real Fuel Price
แก้ไขใน `netlify/functions/fuel-price.js`:
- ใส่ PTT OilPrice endpoint จริง
- หรือ scrape จาก https://www.pttor.com/th/product/price (ขอ permission ก่อน)

### Priority 3 — Truck Profile จากข้อมูลจริง
แก้ไขใน `js/data.js`:
- อัปเดต `TRUCK_PROFILES` ให้ตรงกับรถจริงในองค์กร
- ใส่ค่า maintenance cost, tire cost จากข้อมูลจริง

### Priority 4 — Authentication (ถ้าต้องการ)
เพิ่ม basic auth ใน `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    # Netlify Password Protection: Site settings → Access control → Password protection
```

---

## โครงสร้างค่าใช้จ่าย (ฟรีทั้งหมดสำหรับทีม 3 คน)

| Service | Plan | ค่าใช้จ่าย | Limit |
|---------|------|-----------|-------|
| Netlify | Free | ฿0 | 100GB bandwidth/เดือน |
| GitHub | Free (Private) | ฿0 | ไม่จำกัด |
| HERE Maps | Free | ฿0 | 250,000 calls/เดือน |
| Nominatim | Free | ฿0 | 1 req/วินาที |
| OSRM Demo | Free | ฿0 | ไม่จำกัด (ไม่ควรใช้ production) |
| Open-Meteo | Free | ฿0 | ไม่จำกัด |
| Overpass API | Free | ฿0 | ไม่จำกัด |

**รวม: ฿0/เดือน** (จนกว่าจะเกิน HERE 250K calls → ≈ 83 calls/วัน ทีม 3 คนใช้ไม่ถึง)

---

## ถ้าติดปัญหา

| ปัญหา | วิธีแก้ |
|-------|---------|
| `netlify dev` ไม่ได้ | รัน `npm install` ก่อน |
| HERE key ไม่ทำงาน | ตรวจสอบว่าตั้งใน Netlify Environment Variables แล้ว Trigger redeploy |
| แผนที่ไม่ขึ้น | เช็ค Leaflet CSS โหลดครบไหม ดู Browser Console |
| CORS error | ตรวจสอบ `netlify.toml` redirect rules |
| Functions ไม่ทำงาน | ดู Netlify Dashboard → Functions → Logs |
