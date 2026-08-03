# SHANG SHUI Telegram First Comment Bot

บอทแบบเรียบง่ายสำหรับ Channel `@vieclamsrilankashangshui`

เมื่อโพสต์ใหม่ถูกส่งอัตโนมัติไปยัง Discussion Group บอทจะตอบเป็นคอมเมนต์แรก พร้อมข้อความแบรนด์และปุ่ม:

- 💼 Vị trí đang tuyển → https://t.me/vieclamsrilankashangshui/356
- 📩 Liên hệ ứng tuyển → https://t.me/shangshuiDD

## จุดเด่น

- ทำงานบน Cloudflare Workers ไม่ต้องเปิดคอม
- Deep Freeze ไม่มีผล
- รับเฉพาะ automatic forward จาก Channel ที่กำหนด
- รองรับข้อความ รูป วิดีโอ ไฟล์ และอัลบั้ม
- อัลบั้มหลายภาพคอมเมนต์ครั้งเดียว
- ป้องกัน Telegram webhook update ซ้ำด้วย Durable Object
- ใช้ปุ่ม `primary` และ `success`
- หาก Telegram ปฏิเสธ style จะลองส่งปุ่มรูปแบบปกติให้อัตโนมัติ
- Webhook secret สร้างจาก Token อัตโนมัติ ไม่ต้องกรอกเพิ่ม

## การตั้งค่าที่ผู้ใช้ต้องทำเพียงครั้งเดียว

### 1. เปลี่ยน Bot Token

Token ที่เคยส่งในแชตต้องยกเลิก:

1. เปิด `@BotFather`
2. ส่ง `/revoke`
3. เลือก `@SHANGSHUIDD_BOT`
4. รับ Token ใหม่
5. ห้ามใส่ Token ลง GitHub

### 2. Deploy Repository เข้า Cloudflare Workers

ใน Cloudflare Dashboard:

1. ไปที่ Workers & Pages
2. เลือก Create / Import a repository
3. เลือก Repository นี้
4. Deploy

Cloudflare จะอ่าน `wrangler.jsonc` และสร้าง Durable Object binding ให้

### 3. ใส่ Secret เพียงค่าเดียว

เปิด Worker → Settings → Variables and Secrets

เพิ่ม Secret:

```text
BOT_TOKEN=Token ใหม่จาก BotFather
```

จากนั้น Redeploy

### 4. เปิด URL ของ Worker หนึ่งครั้ง

เปิด URL หลัก เช่น:

```text
https://shangshui-telegram-first-comment.<account>.workers.dev/
```

หน้าเว็บจะ:

- ตรวจ Token ด้วย `getMe`
- สร้าง Webhook secret อัตโนมัติ
- เรียก `setWebhook`
- แสดงสถานะว่าพร้อมทำงาน

### 5. ตั้ง Telegram

1. เชื่อม Channel กับ Discussion Group
2. เพิ่ม `@SHANGSHUIDD_BOT` เข้า Discussion Group
3. ตั้ง Bot เป็น Admin และอนุญาตให้ส่งข้อความ
4. โพสต์ใหม่ใน Channel เพื่อทดสอบ

## Health Check

```text
https://YOUR-WORKER.workers.dev/health
```

## ความปลอดภัย

- GitHub ไม่มี Bot Token
- Token อยู่ใน Cloudflare Secret เท่านั้น
- Webhook path และ header secret สร้างจาก Token แบบ SHA-256
- Logs ไม่แสดง Token

## แก้ข้อความหรือปุ่ม

แก้ค่าด้านบนของ `src/index.js`:

- `SOURCE_CHANNEL_USERNAME`
- `JOB_URL`
- `APPLY_URL`
- `COMMENT_TEXT`

Commit แล้ว Cloudflare จะ Deploy เวอร์ชันใหม่
