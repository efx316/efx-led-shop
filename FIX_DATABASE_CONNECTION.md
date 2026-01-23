# Fix Database Connection Issue

## Problem Found
The `railway run` scripts were loading your local `.env` file which points to `localhost:5432` (local database), overriding Railway's environment variables. This is why:
- ✅ You can log in with mark/paul/jett on Railway (backend uses Railway's DATABASE_URL)
- ❌ `railway run` scripts only see test user (scripts use local DATABASE_URL)

## Solution Applied
Updated `grant-admin.js` and `list-users.js` to prioritize Railway's environment variables over local `.env` files.

## Next Steps

### 1. Verify Railway Backend Service Has DATABASE_URL
Go to Railway Dashboard → Your Backend Service (`efx-led-shop`) → Variables tab

**Check if `DATABASE_URL` exists:**
- If it exists: Great! The scripts should now work.
- If it doesn't exist: Add it using Railway's database reference:
  - Variable name: `DATABASE_URL`
  - Value: `${{ Postgres.DATABASE_URL }}` (use Railway's variable reference)

### 2. Test the Fixed Scripts
Run the grant-admin script again:
```bash
railway run --service efx-led-shop node backend/scripts/grant-admin.js mark@efx.net.au paul@efx.net.au jett@efx.net.au
```

This should now:
- Connect to Railway's database (not local)
- Find mark, paul, and jett
- Grant them admin access

### 3. Verify Users Exist
First, list users to confirm they're in Railway's database:
```bash
railway run --service efx-led-shop node backend/scripts/list-users.js
```

You should now see mark, paul, and jett instead of just the test user.
