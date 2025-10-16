# TheChildrenAI Integration Setup

This document explains how to configure MineMath to work with TheChildrenAI platform's JWT authentication.

## Overview

MineMath supports two authentication modes:
1. **Simple Email/Password Auth** - Standalone mode (default)
2. **TheChildrenAI JWT Auth** - Integrated mode with TheChildrenAI platform

## Environment Variables

Add these variables to your `.env` file or Replit Secrets:

### For TheChildrenAI Integration (Embedded Mode)

```bash
# Enable TheChildrenAI authentication
USE_THECHILDRENAI_AUTH=true

# TheChildrenAI API base URL
THECHILDRENAI_API_URL=https://api.thechildrenai.com/api/v1

# Session secret (required for both modes)
SESSION_SECRET=your-secret-key-here

# Database URL (required for both modes)
DATABASE_URL=your-neon-postgres-url-here
```

### For Standalone Mode (Default)

```bash
# TheChildrenAI auth disabled (or omit this variable)
USE_THECHILDRENAI_AUTH=false

# Session secret
SESSION_SECRET=your-secret-key-here

# Database URL
DATABASE_URL=your-neon-postgres-url-here
```

## How It Works

### TheChildrenAI Integration Flow:

1. Child logs into TheChildrenAI platform at `thechildrenai.com`
2. Child navigates to games portal
3. Clicks "Play MineMath" button
4. Gets redirected to: `https://minemath.replit.app?token={JWT_TOKEN}`
5. MineMath frontend:
   - Extracts token from URL
   - Stores it in cookie
   - Removes token from URL
   - Reloads page
6. MineMath backend:
   - Intercepts API requests with middleware
   - Verifies token with TheChildrenAI API
   - Creates/updates user in MineMath database using `child_id` as primary key
   - Allows request to proceed

### Standalone Mode Flow:

1. User visits MineMath directly
2. Sees landing page with "Play Now" button
3. Clicks button → redirected to `/auth` page
4. Can sign up with email/password or log in
5. Session stored in PostgreSQL
6. Can play the game

## Database Schema

The `users` table uses UUID as primary key to support both modes:

- **TheChildrenAI mode**: Uses `child_id` from JWT token as the user ID
- **Standalone mode**: Generates random UUID for new signups

## Token Verification Endpoint

When in TheChildrenAI mode, the backend calls:

```
POST https://api.thechildrenai.com/api/v1/auth/verify-child-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "child_id": "uuid-here",
    "display_name": "Noah",
    "age": 8,
    "grade_level": 3,
    "parent_email": "parent@example.com",
    "avatar_color": "#4CAF50"
  }
}
```

## Testing

### Test TheChildrenAI Integration:

1. Set `USE_THECHILDRENAI_AUTH=true` in environment
2. Get a valid child JWT token from TheChildrenAI platform
3. Visit: `https://your-minemath-url.replit.app?token={JWT_TOKEN}`
4. Should automatically log in and show child's name
5. Progress should save with child's ID

### Test Standalone Mode:

1. Set `USE_THECHILDRENAI_AUTH=false` or omit the variable
2. Visit your MineMath URL
3. Click "Play Now" → should see signup/login page
4. Create account or log in
5. Should access game normally

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema migrated (`npm run db:push`)
- [ ] Server restarted after env var changes
- [ ] Test token verification endpoint is accessible
- [ ] CORS configured on TheChildrenAI API to allow your Replit domain
- [ ] Test both authentication modes work correctly

## Troubleshooting

### "Token verification failed"
- Check that `THECHILDRENAI_API_URL` is correct
- Verify TheChildrenAI API is accessible
- Check CORS configuration on TheChildrenAI side

### "No authentication token provided"
- Token might not be in URL parameter or cookie
- Check browser console for errors
- Verify cookie is being set correctly

### "Invalid or expired token"
- Child tokens expire after 4 hours
- Child needs to log in again to TheChildrenAI platform
- Token might be malformed

### User not created in database
- Check database connection
- Verify `child_id` from token is valid UUID
- Check server logs for errors

## Security Notes

- Tokens are stored in HTTP-only cookies (not accessible to JavaScript)
- Tokens expire after 4 hours
- All communication over HTTPS in production
- Child password/PIN never sent to MineMath
- Only child ID and basic info (name, age, parent email) are shared

## Support

For integration issues:
- Check server logs in Replit
- Verify environment variables are set correctly
- Test both modes independently
- Contact TheChildrenAI team if token verification fails
