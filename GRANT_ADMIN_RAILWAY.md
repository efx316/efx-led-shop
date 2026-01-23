# Grant Admin Access via Railway

## Quick Method: Using Railway Console

1. **Go to Railway Dashboard**
   - Open your Railway project
   - Click on your **backend service**

2. **Open Railway Console**
   - Click on the **"Console"** tab (or look for "Open Console" button)
   - This opens a terminal connected to your backend service

3. **Run the grant-admin script:**
   ```bash
   node scripts/grant-admin.js mark@efx.net.au paul@efx.net.au jett@efx.net.au
   ```

4. **The script will:**
   - Connect to your Railway database (DATABASE_URL is automatically available)
   - Grant admin access to all three users
   - Show you a summary

## Alternative: Direct SQL (if you have database access)

If you have direct access to your PostgreSQL database, you can run:

```sql
UPDATE users 
SET is_admin = true,
    can_view_prices = true,
    can_order_products = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email IN ('mark@efx.net.au', 'paul@efx.net.au', 'jett@efx.net.au');

-- Verify the update
SELECT id, email, name, is_admin, can_view_prices, can_order_products
FROM users
WHERE email IN ('mark@efx.net.au', 'paul@efx.net.au', 'jett@efx.net.au');
```

## Important Notes

- **Users must exist first**: Make sure all three users have registered accounts before running this
- If a user doesn't exist, the script will show "User not found" for that email
- After granting admin access, users may need to log out and log back in to see admin features
