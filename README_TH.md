# Telegram Automation Studio

เว็บแดชบอร์ดบน Cloudflare Workers สำหรับให้บัญชีผู้ใช้ Telegram ทำคอมเมนต์ในโพสต์ของ Channel ที่เลือก โดยใช้ MTProto ไม่ใช่ Bot API

## ความสามารถ

- เพิ่มบัญชี Telegram ได้หลายบัญชี
- ล็อกอินด้วย OTP และรองรับ 2FA
- ดึงรายการ Channel ที่บัญชีเข้าถึงได้
- เปิดใช้กฎแยกตาม Channel และเลือกภาษาได้ 5 ภาษา: ไทย, English, 简体中文, 繁體中文, Tiếng Việt
- โหมด AI Comment ผ่าน Gemini หรือ Template Comment แบบหมุนเวียน
- ตรวจโพสต์ใหม่ทุก 45 นาที
- ถ้ามีหลายโพสต์ ระบบจัดคิวห่างกัน 5 นาทีต่อบัญชี
- ใช้ Durable Object Alarm และเก็บสถานะถาวร ไม่พึ่ง Cron Trigger
- มี Dashboard password, Queue, Logs, Manual Scan และสถานะบัญชี
- ถ้า Telegram ตอบ `FLOOD_WAIT` ระบบจะเลื่อนคิวอัตโนมัติ และถ้า session ถูกยกเลิกจะ pause บัญชีเพื่อความปลอดภัย

## การตรวจสอบบนเครื่อง

```bash
npm install
npm test
npx wrangler deploy --dry-run
```

## การ Deploy ถาวร

Workflow ที่ `.github/workflows/automation-studio-ci.yml` จะติดตั้ง dependency, รันทดสอบ, ตรวจ bundle, Deploy และตรวจ `/health`

ให้เพิ่ม GitHub Actions Secrets ใน repository:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

API Token ควรจำกัดเฉพาะ Cloudflare account เป้าหมายและมีสิทธิ์แก้ไข Workers เท่านั้น หากไม่มีค่าใดค่าหนึ่ง workflow จะใช้ temporary deployment เพื่อทดสอบ ซึ่งไม่ใช่ production ถาวร

## ตั้งค่าครั้งแรก

1. เปิด URL ของ Worker แล้วสร้างรหัสผ่าน Dashboard
2. ไปที่ Settings ใส่ Telegram API ID และ API Hash จาก `my.telegram.org`
3. ใส่ Gemini API key ใน Settings หรือเก็บเป็น Cloudflare secret ชื่อ `GEMINI_API_KEY`
4. เพิ่มหมายเลขโทรศัพท์ Telegram และกรอก OTP/2FA ในหน้าเว็บ
5. โหลด Channels เลือก Channel, ภาษา และโหมด AI/Template แล้วกด Save automations
6. ตรวจ `/health` และแท็บ Queue & Logs ก่อนเปิดใช้งานต่อเนื่อง

ห้ามใส่ Telegram session, API credential, Gemini key, OTP หรือรหัสผ่านลง Git/GitHub โค้ด ระบบจะเก็บ session และการตั้งค่าไว้ใน Durable Object ของ Worker
