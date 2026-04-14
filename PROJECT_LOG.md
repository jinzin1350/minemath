# MineMath Project Log
> مستندات کامل تمام تغییرات انجام شده

---

## ۱. Deploy روی AWS Lambda

### هدف
انتقال کامل پروژه از Replit به AWS (بدون نیاز به Replit)

### معماری نهایی
```
User → CloudFront → S3 (React frontend)
                 → API Gateway → Lambda (Express backend)
                                      → Neon PostgreSQL (database)
```

### فایل‌های ایجاد شده

#### `server/lambda.ts`
Entry point برای Lambda - Express app رو با `serverless-http` wrap می‌کنه:
```typescript
import serverless from "serverless-http";
export const handler = async (event, context) => {
  if (!routesRegistered) { await registerRoutes(app); routesRegistered = true; }
  return serverless(app)(event, context);
};
```

#### `serverless.yml`
Serverless Framework config:
- Runtime: `nodejs20.x`
- Region: `us-east-1`
- Handler: `dist/lambda.handler`
- Routes: `/api/*` و `/api`

### تغییرات `package.json`
```json
"build:lambda": "esbuild server/lambda.ts --platform=node --bundle --format=cjs --outfile=dist/lambda.cjs --alias:@shared=./shared --minify"
```
> **نکته مهم:** فرمت `cjs` (نه `esm`) چون dependencies مثل `pg` با ESM سازگار نیستند.

### دستورات Deploy
```bash
npm run build:lambda
npx serverless deploy
```

---

## ۲. S3 + CloudFront برای Frontend

### منابع AWS ساخته شده
| منبع | نام/ID |
|------|--------|
| S3 Bucket | `minemath-frontend-022187637285` |
| CloudFront Distribution | `E2DIDW4SMDZT2T` |
| CloudFront Domain | `d2t1k8gq76349c.cloudfront.net` |
| API Gateway | `tb9eptn4d4.execute-api.us-east-1.amazonaws.com` |

### CloudFront Config (`cf-config.json`)
- دو origin: S3 (static) و API Gateway (برای `/api/*`)
- HTTPS redirect
- SPA routing: خطای 403 و 404 → `index.html`

### دستورات Deploy Frontend
```bash
npm run build
aws s3 sync dist/public s3://minemath-frontend-022187637285 --delete
aws cloudfront create-invalidation --distribution-id E2DIDW4SMDZT2T --paths "/*"
```

---

## ۳. تغییرات Database

### مشکل
Neon database اصلی (روی Replit) auto-suspend داشت و connection های WebSocket قطع می‌شد.

### راه‌حل
**`server/db.ts`** - تغییر از WebSocket Pool به HTTP driver:
```typescript
// قبل (WebSocket - مشکل‌دار روی Lambda)
import { Pool } from "@neondatabase/serverless";

// بعد (HTTP - مناسب Lambda)
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

### Database جدید
یک Neon database جدید ایجاد شد و `DATABASE_URL` در `.env` آپدیت شد.

### Seed کردن داده‌ها
فایل `run-seed.ts` ساخته شد برای seed کردن ۶۸۷ کلمه انگلیسی:
```bash
npx tsx run-seed.ts
```

---

## ۴. Fix مشکل Session و Logout

### مشکل اول: Logout با GET
کلاینت از `GET /api/logout` استفاده می‌کرد ولی سرور فقط `POST` داشت.

**Fix در `server/simpleAuth.ts`:**
```typescript
app.post("/api/logout", logoutHandler);
app.get("/api/logout", logoutHandler);  // اضافه شد
```

### مشکل دوم: Logout بعد از Lambda Restart
Session در memory ذخیره می‌شد → با هر cold start پاک می‌شد.

**Fix:** تغییر از `MemoryStore` به `connect-pg-simple` (ذخیره در Neon database):
```typescript
// قبل
import MemoryStore from "memorystore";
store: new MemoryStoreSession({ checkPeriod: sessionTtl })

// بعد
import connectPgSimple from "connect-pg-simple";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ... });
store: new PgSession({ pool, tableName: "sessions" })
```
> Session‌ها حالا در جدول `sessions` در Neon ذخیره می‌شن و Lambda restart تأثیری ندارد.

---

## ۵. Fix مشکل 404 هنگام Refresh

### مشکل
SPA (React) - وقتی user مستقیماً روی `/english-dictation` یا هر route دیگه‌ای refresh می‌کرد، CloudFront فایلی در S3 پیدا نمی‌کرد و 404 برمی‌گشت.

### Fix
اضافه کردن custom error response برای 404 در CloudFront (قبلاً فقط 403 تنظیم بود):
```json
"CustomErrorResponses": {
  "Quantity": 2,
  "Items": [
    { "ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200" },
    { "ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200" }
  ]
}
```
```bash
aws cloudfront update-distribution --id E2DIDW4SMDZT2T --distribution-config file://cf-update.json --if-match <ETAG>
```

---

## ۶. Mobile Navigation (Bottom Nav)

### مشکل
ناوبری موبایل cramped بود و فقط icon داشت، mobile-friendly نبود.

### راه‌حل
ساخت کامپوننت مشترک **`client/src/components/BottomNav.tsx`**:
- Fixed bottom navigation برای موبایل (`md:hidden`)
- ۵ آیتم: HOME / PLAY / ENGLISH / RANK / REPORT
- Icon + Label برای هر آیتم
- Active state detection

### فایل‌های تغییر یافته
| فایل | تغییر |
|------|-------|
| `client/src/pages/Home.tsx` | حذف nav buttons قدیمی، اضافه `<BottomNav />` |
| `client/src/pages/EnglishDictation.tsx` | حذف nav buttons قدیمی، اضافه `<BottomNav />` |
| `client/src/components/RankTab.tsx` | حذف ۳ بلوک nav تکراری، اضافه `<BottomNav />` |

---

## ۷. Minecraft Theme برای English Dictation

### مشکل
صفحه‌های DictationGame و DictationResults از theme آبی روشن (`from-sky-400 to-sky-600`) استفاده می‌کردند که با بقیه app که Minecraft theme داشت هماهنگ نبود.

### تغییرات `client/src/components/DictationGame.tsx`

| بخش | قبل | بعد |
|-----|-----|-----|
| Background | `bg-gradient-to-b from-sky-400 to-sky-600` | `bg-gradient-to-b from-blue-900 to-emerald-900` |
| Card | `bg-white/95` | `border-4 border-amber-600 bg-gradient-to-b from-slate-900/95` |
| Font | معمولی | `font-pixel` |
| HUD | ساده | Lives (hearts) + Score (⭐) + Progress bar |
| Buttons | shadcn Button | Native buttons با Minecraft block style |
| Feedback | متن ساده | Banner سبز/قرمز با pixel font |

### تغییرات `client/src/components/DictationResults.tsx`
- Background، card، fonts، stats grid همه به Minecraft theme تغییر یافت
- Stars، score، accuracy، correct words با dark cards نمایش داده می‌شود

### اضافه شدن Nav Bar به DictationGame و DictationResults
Nav bar در `EnglishDictation.tsx` به یک متغیر `const nav` تبدیل شد و در هر سه حالت (menu / playing / results) نمایش داده می‌شود.

---

## ۸. Fix مشکل Unstable بودن بارگذاری کلمات

### مشکل
گاهی با کلیک روی Typing Mode / Multiple Choice / Fill the Blank پیام "NO WORDS FOR LEVEL 1" می‌آمد چون Neon database cold start داشت و اولین request fail می‌شد.

### Fix در `client/src/components/DictationGame.tsx`
اضافه کردن retry logic با ۴ تلاش و فاصله ۱.۵ ثانیه:
```typescript
const maxRetries = 4;
const retryDelay = 1500;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const fetchedWords = await fetchWords(level, 10);
    if (fetchedWords?.length > 0) { /* success */ return; }
  } catch (error) {
    console.warn(`Attempt ${attempt}/${maxRetries} failed`);
  }
  if (attempt < maxRetries) await new Promise(res => setTimeout(res, retryDelay));
}
```
Loading screen نیز آپدیت شد تا شماره تلاش نمایش داده شود.

---

## ۹. حذف Word Wizard

### فایل‌های حذف شده
- `client/src/games/word-wizard/` (کل پوشه)
- `client/src/pages/WordWizard.tsx`

### فایل‌های آپدیت شده
| فایل | تغییر |
|------|-------|
| `client/src/App.tsx` | حذف import و Route برای WordWizard |
| `client/src/lib/gameRegistry.ts` | حذف entry مربوط به word-wizard |
| `client/src/pages/Home.tsx` | حذف دکمه WORD WIZARD از nav و حذف `Wand2` از imports |

---

## ۱۰. Reset Password

فایل `reset-password.mjs` ساخته شد برای reset کردن password کاربر از طریق command line:
```bash
node reset-password.mjs
```

---

## فایل‌های مهم Config

| فایل | کاربرد |
|------|--------|
| `.env` | Environment variables (DATABASE_URL, SESSION_SECRET, ...) |
| `serverless.yml` | Serverless Framework config برای Lambda |
| `cf-config.json` | CloudFront distribution config اولیه |
| `cf-update.json` | CloudFront distribution config آپدیت شده (با 404 fix) |
| `run-seed.ts` | Seed کردن کلمات dictation در database |

---

## خلاصه Stack

| لایه | تکنولوژی |
|------|----------|
| Frontend | React + Vite + TailwindCSS + Wouter |
| Backend | Express.js + TypeScript |
| Database | Neon PostgreSQL (serverless HTTP driver) |
| ORM | Drizzle ORM |
| Auth | express-session + bcryptjs |
| Session Store | connect-pg-simple (Neon) |
| Deploy Backend | AWS Lambda + Serverless Framework |
| Deploy Frontend | AWS S3 + CloudFront |
| Font | Press Start 2P (pixel font) |
