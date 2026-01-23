# Fix Register Page 404 Error

If the `/register` page is returning a 404 error, follow these steps:

## Quick Fix: Rebuild Frontend on Railway

The most common cause is that the frontend hasn't been rebuilt on Railway after adding the Register component.

### Steps:

1. **Trigger a rebuild on Railway:**
   - Go to your Railway dashboard
   - Select your **frontend service**
   - Click "Deploy" or "Redeploy" to trigger a new build
   - Wait for the build to complete

2. **Verify the Register component is in the build:**
   - Check that `frontend/src/pages/Register.tsx` exists
   - Check that `frontend/src/App.tsx` imports and uses the Register component
   - The route should be: `<Route path="/register" component={Register} />`

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or open in incognito/private mode

## Verify Frontend Configuration

### Check Vite Configuration

The `frontend/vite.config.ts` should have preview settings:

```typescript
preview: {
  host: '0.0.0.0',
  port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
  allowedHosts: [
    '.railway.app', // Allow all Railway subdomains
    'localhost',
  ],
}
```

### Check Package.json Start Script

The `frontend/package.json` should have:

```json
{
  "scripts": {
    "start": "vite preview --host 0.0.0.0 --port $PORT"
  }
}
```

## Verify Register Component

1. **Check the file exists:**
   ```bash
   ls frontend/src/pages/Register.tsx
   ```

2. **Check it's imported in App.tsx:**
   ```typescript
   import Register from './pages/Register'
   ```

3. **Check the route is defined:**
   ```typescript
   <Route path="/register" component={Register} />
   ```

## Test Locally First

Before deploying, test locally:

```bash
cd frontend
npm install
npm run build
npm run preview
```

Then visit `http://localhost:4173/register` - it should work.

## Common Issues

### Issue: Route not matching
**Solution:** Make sure the route is defined BEFORE the catch-all 404 route:
```typescript
<Switch>
  <Route path="/register" component={Register} />
  {/* ... other routes ... */}
  <Route>404 - Not Found</Route>  {/* This must be last */}
</Switch>
```

### Issue: Component not exported
**Solution:** Verify Register.tsx exports the component:
```typescript
export default function Register() {
  // ...
}
```

### Issue: Build doesn't include Register
**Solution:** 
- Check for TypeScript errors: `cd frontend && npm run check`
- Check build logs on Railway for errors
- Ensure Register.tsx has no syntax errors

### Issue: Vite preview not serving SPA correctly
**Solution:** Vite preview should handle SPA routing automatically. If not:
- Check Railway logs for errors
- Verify `vite preview` is being used (not a static file server)
- Ensure Railway is using the `start` script from package.json

## Railway-Specific Checks

1. **Root Directory:** Should be set to `frontend`
2. **Build Command:** Should be `npm install && npm run build`
3. **Start Command:** Should be `npm start` (which runs `vite preview`)
4. **Environment Variables:** Ensure `PORT` is set (Railway sets this automatically)

## Still Not Working?

1. **Check Railway deployment logs** for build errors
2. **Check browser console** for JavaScript errors
3. **Verify the Register component** compiles without errors:
   ```bash
   cd frontend
   npm run check
   ```
4. **Test the API endpoint directly:**
   ```bash
   curl -X POST https://your-backend-url.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Alternative: Use Admin API to Create Users

If registration still doesn't work, you can create users via the admin API (if you have an admin account) or directly in the database, then grant admin access using the `grant-admin.js` script.
