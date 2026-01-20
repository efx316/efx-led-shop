import pool from '../src/db/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Running migration: add_user_permissions.sql');
    
    // Read the migration file
    const migrationPath = join(__dirname, '../../database/migrations/add_user_permissions.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('Added columns: can_view_prices, can_order_products');
    console.log('Updated existing admin users with permissions.');
    
    // Verify the migration
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('can_view_prices', 'can_order_products')
    `);
    
    if (result.rows.length === 2) {
      console.log('✅ Verification: Permission columns exist in database');
    } else {
      console.log('⚠️  Warning: Expected 2 columns but found', result.rows.length);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
