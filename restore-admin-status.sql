-- Quick fix: Restore admin status for test@example.com
-- Run this if your admin status was lost

UPDATE users 
SET is_admin = true,
    can_view_prices = true,
    can_order_products = true
WHERE email = 'test@example.com';

-- Verify the update
SELECT id, email, name, is_admin, can_view_prices, can_order_products 
FROM users 
WHERE email = 'test@example.com';
