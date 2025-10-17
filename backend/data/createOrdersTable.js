// backend/data/createOrdersTable.js
import pool from '../config/db.js';

const createOrdersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'pending',
      total_amount NUMERIC(12,2) DEFAULT 0,
      shipping_address JSONB,
      created_at TIMESTAMP DEFAULT now()
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('orders table created or already exists.');
  } catch (err) {
    console.error('Error creating orders table:', err);
    throw err;
  }
};

export default createOrdersTable;
