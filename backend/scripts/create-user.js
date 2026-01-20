// Quick script to create a test user
// Run with: node scripts/create-user.js

import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createUser() {
  const email = 'test@example.com';
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);

  try {
    // Add name column if it doesn't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)');
    } catch (err) {
      // Column might already exist or error, continue anyway
    }

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, company_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, company_name`,
      [email, hash, 'Test User', 'Test Company', '0400000000']
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      await pool.query(
        `INSERT INTO user_points (user_id, current_balance, total_accumulated)
         VALUES ($1, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );
      console.log('✅ User created!');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.log('User already exists!');
      console.log('Email:', email);
      console.log('Password:', password);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createUser();

