# 🛠️ Recovery Log — 2026-04-16

## خلاصه مشکل
سیستم دچار خرابی شد و فایل‌های local از بین رفتند. هدف: بازگرداندن سایت به وضعیت **Apr 15 21:10 UTC** (ساعت کانادا).

---

## ✅ مراحل انجام شده

### 1. بررسی وضعیت پروژه
- خواندن فایل‌های memory: `MEMORY.md`, `session_work_log.md`, `streak_plan.md`
- شناسایی کامل infrastructure:
  - **S3 Bucket:** `minemath-frontend-022187637285`
  - **CloudFront:** `E2DIDW4SMDZT2T` → `d2t1k8gq76349c.cloudfront.net`
  - **Lambda:** `minemath-dev-api` (us-east-1)
  - **Database:** Neon PostgreSQL

---

### 2. بررسی Lambda Versions
```bash
aws lambda list-versions-by-function --function-name minemath-dev-api --region us-east-1
```
**نتیجه:** 21 version موجود بود. Version مورد نظر:

| Version | LastModified (UTC) | توضیح |
|---|---|---|
| 14 | 2026-04-15T04:37:54 | ✅ آخرین version کار کرده |
| 15 | 2026-04-15T21:10:53 | ❌ داشت `fs` dynamic require bug |
| 21 | 2026-04-15T22:08:56 | آخرین version قبل از خرابی |

---

### 3. بررسی S3 Versioning
```bash
aws s3api get-bucket-versioning --bucket minemath-frontend-022187637285
```
**نتیجه:** Versioning غیرفعال بود → rollback از S3 ممکن نبود.

---

### 4. تلاش Rollback به Version 15 (ناموفق)
- دانلود zip از AWS و آپلود به S3 به عنوان واسط
- deploy موفق بود ولی Lambda خطای `500` می‌داد
- **علت:** Version 15 داشت bug مربوط به `Dynamic require of "fs" is not supported`

---

### 5. Rollback موفق به Version 14 ✅
```bash
# دانلود کد Version 14
$url14 = aws lambda get-function --function-name minemath-dev-api --qualifier 14 --region us-east-1 --query "Code.Location" --output text
Invoke-WebRequest -Uri $url14 -OutFile "C:\temp\lambda_v14.zip"

# آپلود به S3
aws s3 cp C:\temp\lambda_v14.zip s3://minemath-frontend-022187637285/lambda-backups/lambda_v14.zip --region us-east-1

# Deploy از S3 به Lambda
aws lambda update-function-code --function-name minemath-dev-api --s3-bucket minemath-frontend-022187637285 --s3-key lambda-backups/lambda_v14.zip --region us-east-1
```
**نتیجه:** `{"message":"Unauthorized"}` (401) ✅ Lambda کار می‌کنه!

---

### 6. Rebuild و Deploy فرانت‌اند ✅
```bash
# برگشت به commit مربوطه
git checkout 2095da0

# Build
npm run build

# آپلود به S3
aws s3 sync dist/public s3://minemath-frontend-022187637285 --delete --region us-east-1

# پاک کردن CloudFront cache
aws cloudfront create-invalidation --distribution-id E2DIDW4SMDZT2T --paths "/*"
```
**نتیجه:** سایت با UI درست بالا اومد ✅

---

### 7. ذخیره تمام تغییرات در Git ✅
```bash
git switch -c restore-backup
git add -A
git commit -m "Restore all session work: dark theme, streak UI, game fixes"
git switch main
git merge restore-backup
git pull origin main --no-rebase
git push origin main
```
**نتیجه:** همه کدهای session دیروز (dark theme، streak UI، game fixes) روی GitHub ذخیره شد ✅

---

## 📊 وضعیت نهایی

| لایه | وضعیت |
|---|---|
| 🌐 **سایت** | Live و کار می‌کنه |
| ⚡ **Lambda** | Version 14 — سالم |
| 🗂️ **S3 Frontend** | Build جدید deploy شده |
| 💾 **GitHub** | همه کدها push شده |
| 🗄️ **Database** | Neon — دست نخورده |

---

## ⚠️ اقدامات پیشنهادی برای آینده

### 1. فعال کردن S3 Versioning
```bash
aws s3api put-bucket-versioning \
  --bucket minemath-frontend-022187637285 \
  --versioning-configuration Status=Enabled
```

### 2. گرفتن Lambda Version قبل از هر deploy بزرگ
```bash
aws lambda publish-version --function-name minemath-dev-api --region us-east-1
```

### 3. منظم git commit کردن
هر روز حداقل یک commit قبل از اتمام کار.

---

## 🔑 اطلاعات مهم Infrastructure

| سرویس | مقدار |
|---|---|
| S3 Bucket | `minemath-frontend-022187637285` |
| CloudFront ID | `E2DIDW4SMDZT2T` |
| CloudFront URL | `d2t1k8gq76349c.cloudfront.net` |
| Lambda Function | `minemath-dev-api` |
| Lambda Region | `us-east-1` |
| DB Host | `ep-green-hat-anpmp83e-pooler.c-6.us-east-1.aws.neon.tech` |
| API Gateway | `tb9eptn4d4.execute-api.us-east-1.amazonaws.com` |
