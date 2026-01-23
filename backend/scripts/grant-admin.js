// Script to grant admin access to users by email
// Usage: node scripts/grant-admin.js <email1> <email2> <email3>
// Or: node scripts/grant-admin.js (will prompt for emails)

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function grantAdmin(emails) {
  try {
    // Ensure columns exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_prices BOOLEAN DEFAULT false');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS can_order_products BOOLEAN DEFAULT false');
      console.log('✓ Ensured admin columns exist');
    } catch (err) {
      if (!err.message?.includes('already exists')) {
        console.log('Note: Some columns may already exist');
      }
    }

    const results = [];

    for (const email of emails) {
      if (!email || !email.trim()) {
        console.log(`⚠️  Skipping empty email`);
        continue;
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Update user to admin with all permissions
      const result = await pool.query(
        `UPDATE users 
         SET is_admin = true,
             can_view_prices = true,
             can_order_products = true,
             updated_at = CURRENT_TIMESTAMP
         WHERE LOWER(email) = $1 
         RETURNING id, email, name, is_admin, can_view_prices, can_order_products`,
        [trimmedEmail]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`✅ ${user.email} is now an admin!`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Admin: ${user.is_admin}`);
        console.log(`   Can View Prices: ${user.can_view_prices}`);
        console.log(`   Can Order Products: ${user.can_order_products}`);
        console.log('');
        results.push({ success: true, email: user.email, user });
      } else {
        console.log(`❌ User not found: ${trimmedEmail}`);
        console.log(`   💡 Make sure the user exists first (register at /register)`);
        console.log('');
        results.push({ success: false, email: trimmedEmail, error: 'User not found' });
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`   ✅ Successfully granted admin to ${successful} user(s)`);
    if (failed > 0) {
      console.log(`   ❌ Failed for ${failed} user(s)`);
    }

    return results;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
    rl.close();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  let emails = [];

  if (args.length > 0) {
    // Use command line arguments
    emails = args;
  } else {
    // Prompt for emails
    console.log('🔐 Grant Admin Access\n');
    console.log('Enter email addresses (one per line, empty line to finish):\n');
    
    let email = await question('Email: ');
    while (email.trim()) {
      emails.push(email.trim());
      email = await question('Email (or press Enter to finish): ');
    }
  }

  if (emails.length === 0) {
    console.log('❌ No emails provided');
    console.log('\nUsage:');
    console.log('  node scripts/grant-admin.js <email1> <email2> <email3>');
    console.log('  Or run without arguments to enter emails interactively');
    process.exit(1);
  }

  await grantAdmin(emails);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
