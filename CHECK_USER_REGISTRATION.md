# Check User Registration Issue

## Problem
Users can register and log in successfully, but they don't appear in the Railway database when running the grant-admin script.

## Diagnostic Steps

### 1. Check Frontend API URL
When you're logged in on Railway, open browser DevTools (F12) → Console tab and look for:
```
[API Config] API_URL: ...
[API Config] VITE_API_URL env: ...
```

This will tell us which backend the frontend is connecting to.

### 2. Check Registration API Call
In DevTools → Network tab:
- Look for the `/api/auth/register` request when you registered
- Check the Request URL - what domain is it going to?
- Check the Response - did it return a 201 status with user data?

### 3. Check Login API Call
In DevTools → Network tab:
- Look for the `/api/auth/login` request
- Check what backend URL it's hitting
- Check the response - does it return user data?

### 4. Verify Database Connection
The grant-admin script is connecting to Railway's database, but only finding the test user. This suggests:
- Users might be registering on a different backend/database
- The frontend might still be pointing to localhost
- There might be multiple database instances

## Quick Fix: Check Browser Console

1. Open your Railway-deployed frontend
2. Open DevTools (F12) → Console
3. Look for the `[API Config]` logs
4. Share what you see - especially the `API_URL` value

This will tell us if the frontend is correctly configured to use the Railway backend.
