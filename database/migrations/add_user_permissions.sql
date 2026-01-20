-- Add permission columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_view_prices BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_order_products BOOLEAN DEFAULT false;

-- Update existing admins to have all permissions
UPDATE users 
SET can_view_prices = true, can_order_products = true 
WHERE is_admin = true;
