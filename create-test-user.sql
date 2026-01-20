-- Create a test admin user
-- Password: password123
-- Email: test@example.com

-- First, generate the bcrypt hash for 'password123'
-- You can use an online bcrypt generator or run: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(h => console.log(h))"

-- For now, using a pre-generated hash for 'password123'
INSERT INTO users (email, password_hash, name, company_name, phone, is_admin, can_view_prices, can_order_products)
VALUES (
  'test@example.com',
  '$2a$10$rOzJ0Z8qKXqKXqKXqKXqK.qKXqKXqKXqKXqKXqKXqKXqKXqKXqK',
  'Test User',
  'Test Company',
  '0400000000',
  true,
  true,
  true
)
ON CONFLICT (email) DO UPDATE 
SET is_admin = true,
    can_view_prices = true,
    can_order_products = true;

-- Initialize user points
INSERT INTO user_points (user_id, current_balance, total_accumulated)
SELECT id, 0, 0
FROM users
WHERE email = 'test@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Ensure admin status is set (in case user already existed)
UPDATE users 
SET is_admin = true,
    can_view_prices = true,
    can_order_products = true
WHERE email = 'test@example.com';

-- Show the created user
SELECT id, email, name, company_name, is_admin, can_view_prices, can_order_products 
FROM users 
WHERE email = 'test@example.com';



