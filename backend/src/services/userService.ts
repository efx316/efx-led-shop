import bcrypt from 'bcryptjs';
import pool from '../db/index.js';

export interface User {
  id: number;
  email: string;
  name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  company_name?: string;
  phone?: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, company_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, company_name, phone, created_at`,
    [
      input.email,
      passwordHash,
      input.name || null,
      input.company_name || null,
      input.phone || null,
    ]
  );

  const user = result.rows[0];

  // Initialize user points
  await pool.query(
    `INSERT INTO user_points (user_id, current_balance, total_accumulated)
     VALUES ($1, 0, 0)`,
    [user.id]
  );

  return user;
}

export async function getUserByEmail(email: string): Promise<User & { password_hash: string } | null> {
  const result = await pool.query(
    `SELECT id, email, password_hash, name, company_name, phone, created_at
     FROM users WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    `SELECT id, email, name, company_name, phone, created_at
     FROM users WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

