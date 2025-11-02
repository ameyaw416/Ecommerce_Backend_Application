import pool from '../config/db.js';

const createPaymentsTable = async () => {
  const q = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL,                -- 'mock' | 'stripe' | 'mtn_momo' | ...
      provider_payment_id VARCHAR(255),             -- id from provider
      amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'GHS',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',-- 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled'
      metadata JSONB,                               -- arbitrary provider payload
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
  `;
  try {
    await pool.query(q);
    console.log('payments table created or already exists.');
  } catch (err) {
    console.error('Error creating payments table:', err);
    throw err;
  }
};

export default createPaymentsTable;
