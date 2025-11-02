import pool from '../config/db.js';

export const createPaymentRecord = async ({ orderId, userId, provider, amount, currency = 'GHS', metadata = null }) => {
  const q = `
    INSERT INTO payments (order_id, user_id, provider, amount, currency, status, metadata)
    VALUES ($1::uuid, $2::uuid, $3, $4, $5, 'pending', $6::jsonb)
    RETURNING *;
  `;
  const r = await pool.query(q, [orderId, userId, provider, amount, currency, metadata ? JSON.stringify(metadata) : null]);
  return r.rows[0];
};

export const attachProviderPaymentId = async (paymentId, providerPaymentId) => {
  const q = `
    UPDATE payments
    SET provider_payment_id = $1, updated_at = now()
    WHERE id = $2::uuid
    RETURNING *;
  `;
  const r = await pool.query(q, [providerPaymentId, paymentId]);
  return r.rows[0] || null;
};

export const updatePaymentStatus = async (paymentId, status, metadata = null) => {
  const q = `
    UPDATE payments
    SET status = $1, metadata = COALESCE($2::jsonb, metadata), updated_at = now()
    WHERE id = $3::uuid
    RETURNING *;
  `;
  const r = await pool.query(q, [status, metadata ? JSON.stringify(metadata) : null, paymentId]);
  return r.rows[0] || null;
};

export const getPaymentById = async (paymentId) => {
  const r = await pool.query('SELECT * FROM payments WHERE id = $1::uuid', [paymentId]);
  return r.rows[0] || null;
};

export const getPaymentsByOrder = async (orderId) => {
  const r = await pool.query(
    'SELECT * FROM payments WHERE order_id = $1::uuid ORDER BY created_at DESC',
    [orderId]
  );
  return r.rows;
};

export const getPaymentsByUser = async (userId) => {
  const r = await pool.query(
    'SELECT * FROM payments WHERE user_id = $1::uuid ORDER BY created_at DESC',
    [userId]
  );
  return r.rows;
};

export const getAllPayments = async () => {
  const r = await pool.query(
    `SELECT * FROM payments ORDER BY created_at DESC`
  );
  return r.rows;
};
