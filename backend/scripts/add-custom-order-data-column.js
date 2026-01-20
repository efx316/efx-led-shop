// Script to add custom_order_data column to orders table
// Run with: node scripts/add-custom-order-data-column.js

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

async function addColumn() {
  try {
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='custom_order_data'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column custom_order_data already exists');
      await pool.end();
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN custom_order_data JSONB
    `);

    console.log('✅ Column custom_order_data added successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addColumn();



