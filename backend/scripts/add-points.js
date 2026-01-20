// Script to add points to a user
// Run with: node scripts/add-points.js

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

async function addPoints() {
  const email = 'test@example.com';
  const pointsToAdd = 100;

  try {
    // Get user ID
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found:', email);
      await pool.end();
      return;
    }

    const userId = userResult.rows[0].id;

    // Ensure user_points record exists
    await pool.query(
      `INSERT INTO user_points (user_id, current_balance, total_accumulated)
       VALUES ($1, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Add points
    await pool.query(
      `UPDATE user_points
       SET current_balance = current_balance + $1,
           total_accumulated = total_accumulated + $1
       WHERE user_id = $2`,
      [pointsToAdd, userId]
    );

    // Record transaction
    await pool.query(
      `INSERT INTO points_transactions (user_id, type, amount, description)
       VALUES ($1, 'earned', $2, 'Test points added')`,
      [userId, pointsToAdd]
    );

    // Get updated points
    const pointsResult = await pool.query(
      `SELECT current_balance, total_accumulated FROM user_points WHERE user_id = $1`,
      [userId]
    );

    console.log('✅ Points added successfully!');
    console.log('Email:', email);
    console.log('Current Balance:', pointsResult.rows[0].current_balance);
    console.log('Total Accumulated:', pointsResult.rows[0].total_accumulated);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addPoints();



