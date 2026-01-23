# Grant Admin Access to Users

This guide explains how to grant admin access to users in your EFX LED Shop application.

## Method 1: Using the Admin Script (Recommended)

The easiest way to grant admin access is using the provided script.

### Prerequisites
- Node.js installed
- Access to the backend directory
- Database connection configured (via `DATABASE_URL` environment variable)

### Steps

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the grant-admin script with email addresses:**
   ```bash
   node scripts/grant-admin.js user1@example.com user2@example.com user3@example.com
   ```

   Or run interactively (will prompt for emails):
   ```bash
   node scripts/grant-admin.js
   ```

3. **The script will:**
   - Ensure admin columns exist in the database
   - Update each user's `is_admin`, `can_view_prices`, and `can_order_products` to `true`
   - Display a summary of successful and failed operations

### Example Output
```
✓ Ensured admin columns exist
✅ user1@example.com is now an admin!
   Name: John Doe
   Admin: true
   Can View Prices: true
   Can Order Products: true

✅ user2@example.com is now an admin!
   Name: Jane Smith
   Admin: true
   Can View Prices: true
   Can Order Products: true

📊 Summary:
   ✅ Successfully granted admin to 2 user(s)
```

## Method 2: Using the Admin API Endpoint

If you already have an admin account, you can use the admin API to grant admin access to other users.

### Prerequisites
- An existing admin account
- Authentication token

### Steps

1. **Login as an admin** and get your authentication token

2. **Make a PATCH request to the admin users endpoint:**
   ```bash
   curl -X PATCH https://your-backend-url.railway.app/api/admin/users/{user_id}/permissions \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "is_admin": true,
       "can_view_prices": true,
       "can_order_products": true
     }'
   ```

   Replace:
   - `{user_id}` with the ID of the user you want to make admin
   - `YOUR_ADMIN_TOKEN` with your JWT token
   - `your-backend-url.railway.app` with your actual backend URL

## Method 3: Direct Database Access

If you have direct database access, you can run SQL directly:

```sql
-- Grant admin access to a user by email
UPDATE users 
SET is_admin = true,
    can_view_prices = true,
    can_order_products = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'user@example.com';

-- Verify the update
SELECT id, email, name, is_admin, can_view_prices, can_order_products
FROM users
WHERE email = 'user@example.com';
```

## Method 4: Using Railway Console

If your backend is deployed on Railway:

1. Go to your Railway project dashboard
2. Open the backend service
3. Click on "Console" or "Deploy Logs"
4. Run the script using Railway's console:
   ```bash
   node scripts/grant-admin.js user1@example.com user2@example.com user3@example.com
   ```

## Important Notes

- **Users must exist first**: Make sure users have registered accounts before granting admin access
- **Admin permissions**: Granting `is_admin = true` automatically grants `can_view_prices` and `can_order_products` permissions
- **Security**: Only grant admin access to trusted users
- **Self-protection**: Admins cannot remove their own admin status via the API (safety feature)

## Troubleshooting

### "User not found" error
- Make sure the user has registered an account first
- Check that the email address is spelled correctly (case-insensitive)
- Verify the user exists in the database: `SELECT * FROM users WHERE email = 'user@example.com';`

### Script fails to connect to database
- Verify `DATABASE_URL` is set correctly in your environment
- Check that your database is accessible from where you're running the script
- For Railway deployments, ensure the script runs in the Railway environment where `DATABASE_URL` is available

### Permission denied errors
- Ensure you have write access to the database
- Check that the database user has UPDATE permissions on the `users` table
