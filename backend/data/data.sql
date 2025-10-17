Database Schema (Simplified) -- users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT now() -- products
    CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL,
        sku VARCHAR(100),
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
-- cart_items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT now(),
    UNIQUE (user_id, product_id)
);
-- orders + order_items
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount NUMERIC(12, 2),
    shipping_address JSONB,
    created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    price_at_purchase NUMERIC(12, 2),
    quantity INTEGER NOT NULL
);