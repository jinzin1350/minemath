# Multiplayer Feature — Session Log (2026-04-17)

## خلاصه کلی
اضافه کردن Real-time Multiplayer به بازی MineMath روی AWS Lambda + Pusher

---

## مشکل اصلی معماری

بازی روی **AWS Lambda + S3/CloudFront** هست:
- Frontend → S3 bucket (static)
- API → API Gateway → Lambda
- Lambda **stateless** هست — هر request یه instance جداست

WebSocket با Lambda کار نمی‌کنه چون Lambda بعد از هر response کشته میشه.
راه‌حل: **Pusher** (سرویس real-time خارجی)

---

## فایل‌های ساخته / تغییر داده شده

### فایل‌های جدید

| فایل | توضیح |
|------|-------|
| `server/multiplayer.ts` | Backend API — ساخت room، relay events به Pusher |
| `server/lambda.cts` | Lambda entry point با `.cts` extension (CJS-compatible) |
| `client/src/hooks/useMultiplayer.ts` | React hook برای مدیریت game state + Pusher |
| `client/src/pages/MultiplayerLobby.tsx` | صفحه Create/Join room + Lobby |
| `client/src/pages/MultiplayerBattle.tsx` | صفحه بازی live با timer و scores |
| `dist/handler.js` | ESM shim که server.cjs رو برای Lambda load می‌کنه |

### فایل‌های تغییر یافته

| فایل | تغییر |
|------|-------|
| `server/routes.ts` | اضافه کردن `import { setupMultiplayer }` و صدا زدنش |
| `server/lambda.ts` | اضافه کردن `module.exports.handler` برای CJS |
| `client/src/App.tsx` | اضافه کردن routes `/multiplayer` و `/multiplayer/battle` |
| `client/src/components/HomePage.tsx` | اضافه کردن کارت 🎮 MULTIPLAYER، تغییر grid به `grid-cols-2 md:grid-cols-3` |
| `serverless.yml` | اضافه کردن Pusher env vars، تغییر handler به `dist/handler.handler` |
| `package.json` | اضافه کردن `pusher` و `pusher-js`، اضافه کردن script `build:lambda` |
| `vite.config.ts` | اضافه کردن `define` برای bake کردن `VITE_PUSHER_KEY` و `VITE_PUSHER_CLUSTER` |
| `.env` | اضافه کردن `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` |

---

## Pusher Config

```
App ID:   2142588
Key:      c263aafda9da2e3bee80
Cluster:  us3
```

---

## معماری نهایی

```
HOST CLIENT                    GUEST CLIENT
     │                              │
     ├── POST /api/multiplayer/rooms │  ← دریافت سوالات + roomId
     ├── subscribe Pusher channel ──┤── subscribe Pusher channel
     ├── setReady → relay ──────────┤── دریافت player-ready
     │                              │
     │  (وقتی allReady شد، HOST اجرا می‌کنه)
     ├── relay game-start ──────────┤── status: active
     ├── relay question ────────────┤── سوال نمایش داده میشه
     │                              │
     │                         answer│
     ├── hostHandleAnswer ←── relay submit-answer
     ├── relay answer-result ───────┤── score آپدیت میشه
     └── relay next question ───────┘
```

**چرا Host game رو drive می‌کنه؟**
Lambda stateless هست — `setTimeout` و in-memory state بین request ها از بین میرن.
پس Host client مسئول:
- Generate کردن سوالات (از server دریافت می‌کنه)
- فایر کردن `game-start`, `question`, `question-timeout`
- Handle کردن جواب‌ها و حساب کردن score

---

## مشکلات پیدا و fix شده

### 1. دکمه CREATE ROOM همیشه disabled بود
**دلیل:** `disabled={!state.connected && state.status === "idle"}` — در Pusher mode دیگه `state.connected` وجود نداشت → `undefined` → همیشه disabled
**Fix:** تغییر به `disabled={state.loading}`

### 2. Game start نمیشد
**دلیل:** Lambda stateless — `setTimeout(() => startGame(), 1000)` بعد از response اجرا نمیشد، همچنین `rooms` Map در memory بین invocation ها از بین می‌رفت
**Fix:** game logic به Host client منتقل شد

### 3. Lambda CJS/ESM conflict
**دلیل:** `package.json` داره `"type":"module"` → Lambda فایل `.js` رو ESM می‌دید → `module.exports` کار نمی‌کرد
**Fix:** 
- `server/lambda.cts` با `.cts` extension → esbuild به CJS compile می‌کنه
- `dist/handler.js` یه ESM shim که CJS bundle رو `require()` می‌کنه
- `serverless.yml`: `handler: dist/handler.handler`

### 4. Serverless handler path اشتباه parse می‌شد
**دلیل:** `dist/lambda.cjs.handler` → Lambda آن رو `dist/lambda.cjs.js` + export `handler` می‌دید
**Fix:** اسم فایل به `server.cjs` + wrapper `dist/handler.js`

---

## Deploy Commands

```bash
# Build frontend
npm run build

# Build Lambda (CJS bundle + ESM shim)
npm run build:lambda

# Deploy Lambda
npx serverless deploy

# Upload frontend to S3
aws s3 sync dist/public/ s3://minemath-frontend-022187637285/ --delete \
  --cache-control "public,max-age=31536000,immutable" --exclude "*.html"
aws s3 cp dist/public/index.html s3://minemath-frontend-022187637285/index.html \
  --cache-control "no-cache,no-store,must-revalidate"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2DIDW4SMDZT2T --paths "/*"
```

---

## Infrastructure Info

| سرویس | مقدار |
|-------|-------|
| S3 Bucket | `minemath-frontend-022187637285` |
| API Gateway | `tb9eptn4d4.execute-api.us-east-1.amazonaws.com` |
| CloudFront | `d2t1k8gq76349c.cloudfront.net` (ID: `E2DIDW4SMDZT2T`) |
| Lambda | `minemath-dev-api` — `nodejs20.x` — `us-east-1` |
| DB | Neon PostgreSQL — `ep-green-hat-anpmp83e-pooler.c-6.us-east-1.aws.neon.tech` |

---

## Game Modes

### ⚔️ Math Battle
- 10 سوال، هر دو بازیکن همزمان جواب میدن
- هر کی سریع‌تر جواب بده امتیاز بیشتر (max 100 pts/سوال)
- برنده: بیشترین امتیاز

### 🐉 Co-op Dragon
- Dragon HP: 100
- بازیکنان نوبتی جواب میدن
- جواب غلط: 15 damage
- timeout: 20 damage
- هر دو باید dragon رو شکست بدن

### سطح سوالات بر اساس Grade
- Grade 2-3: جمع و تفریق (max 50)
- Grade 4-5: ضرب (2-12)
- Grade 6-8: ضرب/تقسیم پیچیده‌تر

---

## Git Commits این Session

```
96a5d7a Fix multiplayer game-start: move game logic to host client
afbdddf Fix CREATE ROOM button always disabled
70aef4c Fix Lambda CJS/ESM conflict for multiplayer API
91775fb Switch Multiplayer from WebSocket to Pusher (Lambda-compatible)
6c43c28 Fix grid layout to show all 5 game cards
d544916 Add real-time Multiplayer feature (Math Battle + Co-op Dragon)
```
