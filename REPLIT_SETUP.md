# 🚀 Replit Setup Instructions

## After pulling latest code, run these commands:

### 1. Install Dependencies
```bash
npm install
```

This will install the new `dotenv` package.

### 2. Setup Database (First time only)
```bash
npm run db:push
```

This creates all database tables.

### 3. Start Server
```bash
npm run dev
```

### 4. Clear Browser Cache
- Press: **Ctrl + Shift + R** (Windows/Linux)
- Or: **Cmd + Shift + R** (Mac)

## ✅ You're Ready!

Now you can:
1. Go to `/auth` and create an account
2. Login with email/password
3. Play all games including **RoboTrainer Academy** 🤖

---

## 🐛 Troubleshooting

### If you see "dotenv not found":
```bash
npm install
```

### If missions still look the same:
```bash
# Clear cache
rm -rf dist node_modules/.vite .vite
npm run dev
```
Then hard refresh browser (Ctrl+Shift+R)

### Check Console Logs
Open browser DevTools (F12) → Console
You should see: `🎮 Mission X: [Title]` with different emojis for each mission!
