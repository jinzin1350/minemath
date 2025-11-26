# Replit Environment Setup

## Required Environment Variables (Secrets)

برای اینکه TheChildrenAI authentication کار کنه، باید این متغیرها رو در **Secrets** قسمت Replit تنظیم کنید:

### 1. USE_THECHILDRENAI_AUTH
```
USE_THECHILDRENAI_AUTH=true
```

### 2. THECHILDRENAI_API_URL
```
THECHILDRENAI_API_URL=https://api.thechildrenai.com/api/v1
```

### 3. SESSION_SECRET
یک رشته random برای امنیت session:
```bash
# Generate a random secret:
openssl rand -base64 32
```
سپس در Secrets تنظیم کنید:
```
SESSION_SECRET=<generated-random-string>
```

### 4. DATABASE_URL
این متغیر به صورت خودکار توسط Replit Postgres تنظیم می‌شه. نیازی به تنظیم دستی نیست.

---

## چک کردن Environment Variables

برای مطمئن شدن که همه چیز درست تنظیم شده:

```bash
# در Replit Shell اجرا کنید:
echo "USE_THECHILDRENAI_AUTH=$USE_THECHILDRENAI_AUTH"
echo "THECHILDRENAI_API_URL=$THECHILDRENAI_API_URL"
echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "SESSION_SECRET is set: $([ -n "$SESSION_SECRET" ] && echo 'YES' || echo 'NO')"
```

---

## ساخت جدول robot_progress

اگر error "relation robot_progress does not exist" دریافت کردید:

```bash
# Run the SQL migration:
psql $DATABASE_URL -f db/init-robot-progress.sql
```

یا از Drizzle ORM استفاده کنید:
```bash
npx drizzle-kit push
```

---

## تست TheChildrenAI Authentication

1. مطمئن شوید Replit app در حال اجراست
2. از TheChildrenAI panel، روی "Launch App" کلیک کنید
3. باید بدون error وارد شوید

اگر Internal Server Error می‌بینید:
- چک کنید که `USE_THECHILDRENAI_AUTH=true` است
- چک کنید که جدول `robot_progress` وجود دارد
- لاگ‌های Replit Console رو بررسی کنید
