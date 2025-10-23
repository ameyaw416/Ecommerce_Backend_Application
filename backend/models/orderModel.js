// models/orderModel.js
import pool from '../config/db.js';

export const createOrder = async (userId, items, shippingAddress) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items must be a non-empty array');
    }

    // Compute total using unit_price
    let totalAmount = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unit_price == null) {
        throw new Error('Each item must have productId, quantity and unit_price');
      }
      totalAmount += Number(item.unit_price) * Number(item.quantity);
    }

    // Ensure shippingAddress is JSON: if it's a string, wrap into an object; otherwise stringify object
    const shippingAddressJson = typeof shippingAddress === 'string'
      ? JSON.stringify({ address: shippingAddress })
      : JSON.stringify(shippingAddress);

    // Insert into orders table (cast shipping_address to jsonb)
    const orderInsert = await client.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES ($1::uuid, $2, $3::jsonb, $4) RETURNING *',
      [userId, totalAmount, shippingAddressJson, 'pending']
    );

    const order = orderInsert.rows[0];
    const orderId = order.id;

    // Insert order items using unit_price column
    const insertItemText = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1::uuid, $2::uuid, $3, $4)';
    for (const item of items) {
      await client.query(insertItemText, [orderId, item.productId, item.quantity, item.unit_price]);
    }

    // Clear user's cart (optional behavior kept as before)
    await client.query('DELETE FROM cart_items WHERE user_id = $1::uuid', [userId]);

    await client.query('COMMIT');

    return { order, orderId, totalAmount };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Rollback error in createOrder model:', rbErr);
    }
    console.error('createOrder model error ->', err && err.stack ? err.stack : err);
    throw err;
  } finally {
    client.release();
  }
};
// Function to get all orders (admin)
export const getAllOrders = async () => {
  const query = `
    SELECT 
      o.id, o.user_id, o.total_amount, o.status, o.shipping_address, o.created_at,
      json_agg(
        json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', p.name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
    ORDER BY o.created_at DESC;
  `;
  const res = await pool.query(query);
  return res.rows;
};

// Function to get orders by user
export const getOrdersByUser = async (userId) => {
  const query = `
    SELECT 
      o.id, 
      o.user_id, 
      o.total_amount, 
      o.status, 
      o.shipping_address,
      o.created_at,
      json_agg(
        json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', p.name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = $1::uuid
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  const res = await pool.query(query, [userId]);
  return res.rows;
};

export const getOrderById = async (orderId, userId) => {
  const query = `
    SELECT 
      o.id, 
      o.user_id, 
      o.total_amount, 
      o.status, 
      o.shipping_address,
      o.created_at,
      json_agg(
        json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', p.name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.id = $1::uuid AND o.user_id = $2::uuid
    GROUP BY o.id
  `;
  const res = await pool.query(query, [orderId, userId]);
  return res.rows[0] || null;
};
