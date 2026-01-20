import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  try {
    console.log('Starting category tables migration...');
    
    // Read the migration SQL (just the new tables part)
    const migrationSQL = `
-- Categories table for product categorization
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    square_category_id VARCHAR(255) UNIQUE, -- NULL for custom categories
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL, -- Admin-friendly name
    description TEXT,
    is_active BOOLEAN DEFAULT true, -- Control visibility on frontend
    display_order INTEGER DEFAULT 0, -- Sort order on frontend
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product category mappings
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL, -- Square product ID
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- Primary category for product
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, category_id)
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_square_id ON categories(square_category_id);

-- Trigger for categories updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('Created tables: categories, product_categories');
    console.log('Created indexes and triggers');
    
    // Verify tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('categories', 'product_categories')
    `);
    
    console.log(`\n✅ Verified ${tablesCheck.rows.length} tables created:`);
    tablesCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.log('Note: Tables may already exist. This is safe to ignore.');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

runMigration();
