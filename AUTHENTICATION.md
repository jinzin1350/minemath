# MineMath Authentication Guide

MineMath supports **TWO authentication methods** that work simultaneously:

## 🔐 Authentication Methods

### 1. **TheChildrenAI Token Authentication** (Primary)
Users access MineMath through TheChildrenAI.com dashboard and receive a JWT token automatically.

**How it works:**
- User clicks "Play MineMath" on TheChildrenAI.com
- TheChildrenAI generates a secure JWT token
- User is redirected to MineMath with token in URL: `?token=xxx`
- MineMath verifies token with TheChildrenAI API
- User is automatically logged in

**Configuration:**
```bash
USE_THECHILDRENAI_AUTH=true  # Enable TheChildrenAI token verification
THECHILDRENAI_API_URL=https://api.thechildrenai.com/api/v1
```

---

### 2. **Email/Password Authentication** (Secondary/Fallback)
Users can also create accounts directly on MineMath and login with email/password.

**How it works:**
- User visits MineMath landing page
- Clicks "LOGIN / SIGN UP" button
- Creates account with email, password, and name
- Logs in with credentials anytime

**Available at:** `/auth` route (always available in all environments)

---

## 🚀 How Both Methods Work Together

The authentication system is **smart** and supports both methods simultaneously:

```
User Request
    ↓
Check for TheChildrenAI token?
    ↓
  YES → Verify with TheChildrenAI API → Login ✅
    ↓
   NO → Check for session cookie?
    ↓
  YES → Verify session → Login ✅
    ↓
   NO → Redirect to /auth (unauthorized)
```

**This means:**
- TheChildrenAI users can play seamlessly (recommended)
- Direct users can create accounts and play independently
- Both user types can access all features
- Progress is saved separately for each user

---

## 🛠️ Setup for Different Environments

### **Production (Recommended)**
Enable both authentication methods:

```bash
# .env
USE_THECHILDRENAI_AUTH=true
THECHILDRENAI_API_URL=https://api.thechildrenai.com/api/v1
DATABASE_URL=your-production-database-url
SESSION_SECRET=your-secure-random-secret
```

**Result:**
- ✅ TheChildrenAI users can login via token
- ✅ Direct users can login via /auth with email/password
- ✅ Both methods work simultaneously

---

### **Local Development**
Test with email/password only:

```bash
# .env
USE_THECHILDRENAI_AUTH=false
DATABASE_URL=postgresql://localhost/minemath
SESSION_SECRET=your-local-secret
NODE_ENV=development
```

**Result:**
- ❌ TheChildrenAI token verification disabled
- ✅ Email/password login via /auth works
- ✅ Faster local testing without external API calls

---

## 📝 Creating Your First Account

### Via UI (Recommended):
1. Start server: `npm run dev`
2. Open browser: `http://localhost:5000`
3. Click **"LOGIN / SIGN UP"** button
4. Fill in:
   - First Name: Your name
   - Last Name: (Optional)
   - Email: your@email.com
   - Password: min 6 characters
5. Click **"SIGN UP"**
6. You're logged in! 🎉

### Via Database (Advanced):
```sql
INSERT INTO users (id, email, password, first_name, age)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', -- password: "123456"
  'Test User',
  10
);
```

Login with:
- Email: `test@example.com`
- Password: `123456`

---

## 🔒 Security Notes

### Password Hashing
All passwords are hashed using **bcrypt** with 10 salt rounds before storing in database.

### Session Management
- Sessions stored in PostgreSQL using `connect-pg-simple`
- Session TTL: 7 days
- HttpOnly cookies (XSS protection)
- Secure cookies in production (HTTPS only)

### TheChildrenAI Token Verification
- Tokens verified with TheChildrenAI API on each request
- Tokens expire after 4 hours
- Invalid tokens rejected immediately

---

## 🐛 Troubleshooting

### "Unauthorized" error when accessing /auth
**Solution:** Make sure `/auth` route is added in `App.tsx`:
```tsx
<Route path="/auth" component={Auth} />
```

### TheChildrenAI token not working
**Check:**
1. `USE_THECHILDRENAI_AUTH=true` in `.env`
2. `THECHILDRENAI_API_URL` is correct
3. Token is valid (not expired)
4. Network connection to TheChildrenAI API

### Email/password login not working
**Check:**
1. Database connection is working
2. `users` table exists (run migrations: `npm run db:push`)
3. Session storage is configured correctly
4. `SESSION_SECRET` is set in `.env`

---

## 📚 API Endpoints

### Authentication Endpoints
- `POST /api/signup` - Create new user account
- `POST /api/login` - Login with email/password
- `POST /api/logout` - Logout and destroy session
- `GET /api/auth/user` - Get current user info

### Protected Endpoints
All other API endpoints require authentication (either method).

---

**Questions?** Check the main README or open an issue.
