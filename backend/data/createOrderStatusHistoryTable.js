//Function to create the order_status_history table
import pool from '../config/db.js';

const createOrderStatusHistoryTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS order_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      previous_status VARCHAR(50) NOT NULL,
      new_status VARCHAR(50) NOT NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('Order Status History table created or already exists.');
  } catch (err) {
    console.error('Error creating Order Status History table:', err);
  }
};

export default createOrderStatusHistoryTable;