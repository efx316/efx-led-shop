-- EFX LED Shop Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    is_admin BOOLEAN DEFAULT false,
    can_view_prices BOOLEAN DEFAULT false,
    can_order_products BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User points tracking
CREATE TABLE IF NOT EXISTS user_points (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_balance INTEGER DEFAULT 0,
    total_accumulated INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points transactions
CREATE TABLE IF NOT EXISTS points_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'spent')),
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (linked to Square orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    square_order_id VARCHAR(255) UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    custom_order_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos uploaded by users
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_key VARCHAR(255) NOT NULL,
    description TEXT,
    approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points shop items
CREATE TABLE IF NOT EXISTS points_shop_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    point_cost INTEGER NOT NULL,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points redemptions
CREATE TABLE IF NOT EXISTS points_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES points_shop_items(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_square_order_id ON orders(square_order_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photos(approved);
CREATE INDEX IF NOT EXISTS idx_points_shop_items_active ON points_shop_items(active);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_user_id ON points_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_status ON points_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_points_shop_items_updated_at ON points_shop_items;
CREATE TRIGGER update_points_shop_items_updated_at BEFORE UPDATE ON points_shop_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_points_redemptions_updated_at ON points_redemptions;
CREATE TRIGGER update_points_redemptions_updated_at BEFORE UPDATE ON points_redemptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_points_updated_at ON user_points;
CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

