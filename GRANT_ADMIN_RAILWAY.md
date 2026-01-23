# Grant Admin Access via Railway

## Method 1: Using Railway CLI (Recommended)

Railway doesn't have a direct web-based console - you need to use the Railway CLI from your local machine.

### Step 1: Install Railway CLI

**Windows (PowerShell):**
```powershell
iwr https://railway.app/install.ps1 | iex
```

**Mac/Linux:**
```bash
curl -fsSL https://railway.app/install.sh | sh
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### Step 3: Link to Your Project

Navigate to your project directory (the root of your repo):
```bash
cd C:\Users\jett\OneDrive\Desktop\replitsite\efx2026
railway link
```

Select your project when prompted.

### Step 4: Run the Grant Admin Script

**Option A: Single command (easiest)**
```bash
railway run node backend/scripts/grant-admin.js mark@efx.net.au paul@efx.net.au jett@efx.net.au
```

**Option B: Interactive shell**
```bash
railway shell
# Then inside the shell:
cd backend
node scripts/grant-admin.js mark@efx.net.au paul@efx.net.au jett@efx.net.au
```

### Important Notes:
- The `railway run` command automatically injects all environment variables (including `DATABASE_URL`)
- If you get database connection errors, you might need to use the **public** database URL instead of the internal one
- You can find the public database URL in Railway Dashboard → Database → Connect tab

## Method 2: Using Railway Web Console (If Available)

Some Railway projects have a web-based console:

1. Go to Railway Dashboard
2. Click on your **backend service**
3. Look for a **"Console"** or **"Terminal"** tab
4. If available, click it to open a web-based terminal
5. Run: `node scripts/grant-admin.js mark@efx.net.au paul@efx.net.au jett@efx.net.au`

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
