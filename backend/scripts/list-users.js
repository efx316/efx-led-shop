// Script to list all users in the database
// Usage: node scripts/list-users.js

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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function listUsers() {
  try {
    console.log('📋 Listing all users in database...\n');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
    console.log('');

    const result = await pool.query(
      `SELECT id, email, name, company_name, is_admin, can_view_prices, can_order_products, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} user(s):\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Company: ${user.company_name || 'N/A'}`);
        console.log(`   Admin: ${user.is_admin ? '✅ Yes' : '❌ No'}`);
        console.log(`   Can View Prices: ${user.can_view_prices ? '✅' : '❌'}`);
        console.log(`   Can Order Products: ${user.can_order_products ? '✅' : '❌'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

listUsers();
