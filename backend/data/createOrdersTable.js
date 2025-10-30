// backend/data/createOrdersTable.js
import pool from '../config/db.js';

const createOrdersTable = async () => {
  const createEnum = `
    DO $$ BEGIN
      CREATE TYPE order_status_enum AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  const createTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      status order_status_enum DEFAULT 'pending',
      total_amount NUMERIC(12,2) DEFAULT 0,
      shipping_address JSONB,
      created_at TIMESTAMP DEFAULT now()
    );
  `;

  try {
    await pool.query(createEnum);
    await pool.query(createTable);
    console.log('orders table created or already exists (with status enum).');
  } catch (err) {
    console.error('Error creating orders table:', err);
    throw err;
  }
};

export default createOrdersTable;
