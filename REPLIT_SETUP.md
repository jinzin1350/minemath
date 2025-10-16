# راهنمای تنظیم MineMath در Replit

این راهنما مراحل تنظیم و اجرای MineMath در Replit را شرح می‌دهد.

## مرحله 1: تنظیم Environment Variables (Secrets)

### در Replit UI:

1. از نوار کناری سمت چپ، روی آیکون **🔒 Secrets** کلیک کنید
2. Secrets زیر را اضافه کنید:

#### برای حالت TheChildrenAI (Embedded Mode):

| Key | Value |
|-----|-------|
| `USE_THECHILDRENAI_AUTH` | `true` |
| `THECHILDRENAI_API_URL` | `https://api.thechildrenai.com/api/v1` |
| `DATABASE_URL` | (your Neon PostgreSQL URL) |
| `SESSION_SECRET` | (a random string) |

#### برای حالت Standalone (بدون TheChildrenAI):

| Key | Value |
|-----|-------|
| `USE_THECHILDRENAI_AUTH` | `false` |
| `DATABASE_URL` | (your Neon PostgreSQL URL) |
| `SESSION_SECRET` | (a random string) |

### نکات مهم:

- **SESSION_SECRET**: یک رشته تصادفی طولانی (حداقل 32 کاراکتر)
  - می‌توانید از این سایت استفاده کنید: https://randomkeygen.com/
  - یا در Terminal تایپ کنید: `openssl rand -base64 32`

- **DATABASE_URL**: URL اتصال به دیتابیس Neon PostgreSQL شما
  - فرمت: `postgresql://user:password@host/database?sslmode=require`

## مرحله 2: Migration دیتابیس

بعد از تنظیم DATABASE_URL، باید schema دیتابیس را ایجاد کنید:

```bash
npm run db:push
```

این دستور جداول مورد نیاز را در دیتابیس ایجاد می‌کند.

## مرحله 3: نصب Dependencies

```bash
npm install
```

## مرحله 4: اجرای سرور

```bash
npm run dev
```

یا می‌توانید روی دکمه **Run** بالای صفحه کلیک کنید.

## مرحله 5: تست

### تست در حالت TheChildrenAI:

1. یک JWT token معتبر از TheChildrenAI بگیرید
2. به این آدرس بروید:
   ```
   https://your-repl-name.your-username.replit.app?token=YOUR_JWT_TOKEN
   ```
3. باید به طور خودکار وارد شوید و نام کودک نمایش داده شود

### تست در حالت Standalone:

1. `USE_THECHILDRENAI_AUTH` را روی `false` تنظیم کنید
2. به URL اصلی Repl بروید
3. روی "Play Now" کلیک کنید
4. صفحه Sign Up/Login باید نمایش داده شود

## عیب‌یابی (Troubleshooting)

### خطا: "DATABASE_URL is not defined"

**راه حل:**
1. به Secrets بروید
2. مطمئن شوید `DATABASE_URL` اضافه شده
3. سرور را restart کنید

### خطا: "Token verification failed"

**راه حل:**
1. بررسی کنید `THECHILDRENAI_API_URL` صحیح باشد
2. مطمئن شوید token معتبر است (منقضی نشده)
3. بررسی کنید CORS روی API TheChildrenAI تنظیم شده

### خطا: "Failed to connect to database"

**راه حل:**
1. بررسی کنید DATABASE_URL صحیح است
2. مطمئن شوید دیتابیس Neon فعال است
3. بررسی کنید رمز عبور درست است

### سایر مشکلات:

1. **حذف node_modules و نصب مجدد:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **بررسی logs سرور:**
   - در Terminal، خروجی سرور را بخوانید
   - پیام‌های خطا معمولاً دلیل مشکل را نشان می‌دهند

3. **Restart کردن Repl:**
   - روی دکمه Stop کلیک کنید
   - چند ثانیه صبر کنید
   - روی Run کلیک کنید

## تغییر بین حالت‌ها

می‌توانید به راحتی بین دو حالت جابجا شوید:

### برای تبدیل به حالت TheChildrenAI:
1. به Secrets بروید
2. `USE_THECHILDRENAI_AUTH` را روی `true` تنظیم کنید
3. سرور را restart کنید

### برای تبدیل به حالت Standalone:
1. به Secrets بروید
2. `USE_THECHILDRENAI_AUTH` را روی `false` تنظیم کنید
3. سرور را restart کنید

## Deployment

وقتی آماده deployment هستید:

1. مطمئن شوید تمام Secrets تنظیم شده‌اند
2. `NODE_ENV` را روی `production` تنظیم کنید
3. مطمئن شوید migration دیتابیس اجرا شده
4. سرور را restart کنید

## لینک‌های مفید

- [مستندات Replit Secrets](https://docs.replit.com/programming-ide/workspace-features/storing-sensitive-information-environment-variables)
- [مستندات Neon PostgreSQL](https://neon.tech/docs/introduction)
- [راهنمای کامل TheChildrenAI Integration](./THECHILDRENAI_SETUP.md)

## پشتیبانی

اگر مشکلی داشتید:
1. ابتدا logs سرور را بررسی کنید
2. مستندات عیب‌یابی بالا را مطالعه کنید
3. مطمئن شوید تمام environment variables صحیح تنظیم شده‌اند
