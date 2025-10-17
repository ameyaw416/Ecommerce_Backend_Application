// backend/data/createOrderItemsTable.js
import pool from '../config/db.js';

const createOrderItemsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('order_items table created or already exists.');
  } catch (err) {
    console.error('Error creating order_items table:', err);
    throw err;
  }
};

export default createOrderItemsTable;
