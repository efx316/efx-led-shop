import bcrypt from 'bcryptjs';
import pool from '../src/db/index.js';

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('User already exists!');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, company_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name`,
      [email, passwordHash, 'Test User', 'Test Company', '0400000000']
    );

    const user = result.rows[0];

    // Initialize user points
    await pool.query(
      `INSERT INTO user_points (user_id, current_balance, total_accumulated)
       VALUES ($1, 0, 0)`,
      [user.id]
    );

    console.log('✅ Test user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();



