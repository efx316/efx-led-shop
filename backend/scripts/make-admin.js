// Script to make a user an admin
// Run with: node scripts/make-admin.js

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'efxsql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'efx_led_shop',
});

async function makeAdmin() {
  const email = 'test@example.com';

  try {
    // Add columns if they don't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_prices BOOLEAN DEFAULT false');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS can_order_products BOOLEAN DEFAULT false');
      console.log('✓ Ensured admin columns exist');
    } catch (err) {
      // Columns might already exist
    }

    // Update user to admin with all permissions
    const result = await pool.query(
      `UPDATE users 
       SET is_admin = true,
           can_view_prices = true,
           can_order_products = true
       WHERE email = $1 
       RETURNING id, email, is_admin, can_view_prices, can_order_products`,
      [email]
    );

    if (result.rows.length > 0) {
      console.log('✅ User is now an admin!');
      console.log('Email:', result.rows[0].email);
      console.log('Admin:', result.rows[0].is_admin);
      console.log('Can View Prices:', result.rows[0].can_view_prices);
      console.log('Can Order Products:', result.rows[0].can_order_products);
    } else {
      console.log('❌ User not found:', email);
      console.log('💡 Make sure the user exists first by running create-test-user.sql');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

makeAdmin();

