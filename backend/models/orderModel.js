// backend/models/orderModel.js
import pool from '../config/db.js';

export const createOrder = async (userId, items, shippingAddress) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items must be a non-empty array');
    }

    // lock & validate products; compute totals from DB prices
    let totalAmount = 0;
    const productDataById = new Map();

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        throw new Error('Each item must have productId and quantity');
      }

      const r = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1::uuid FOR UPDATE',
        [item.productId]
      );
      if (!r.rows.length) throw new Error(`Product not found: ${item.productId}`);

      const product = r.rows[0];
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) throw new Error(`Invalid quantity for ${item.productId}`);
      if (Number(product.stock ?? 0) < qty) {
        throw new Error(`Insufficient stock for product ${product.id} (${product.name})`);
      }

      const unitPrice = Number(product.price);
      totalAmount += unitPrice * qty;

      productDataById.set(product.id, { id: product.id, name: product.name, unitPrice, qty });
    }

    const shippingAddressJson = typeof shippingAddress === 'string'
      ? JSON.stringify({ address: shippingAddress })
      : JSON.stringify(shippingAddress);

    const orderInsert = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, status)
       VALUES ($1::uuid, $2, $3::jsonb, 'pending') RETURNING *`,
      [userId, totalAmount, shippingAddressJson]
    );

    const order = orderInsert.rows[0];
    const orderId = order.id;

    const insertItemSQL =
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1::uuid, $2::uuid, $3, $4)';
    const decStockSQL = 'UPDATE products SET stock = stock - $1 WHERE id = $2::uuid';

    for (const pd of productDataById.values()) {
      await client.query(insertItemSQL, [orderId, pd.id, pd.qty, pd.unitPrice]);
      await client.query(decStockSQL, [pd.qty, pd.id]);
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1::uuid', [userId]);
    await client.query('COMMIT');

    return { order, orderId, totalAmount };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
};

export const getAllOrders = async () => {
  const q = `
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
      ) FILTER (WHERE oi.id IS NOT NULL) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
    ORDER BY o.created_at DESC;
  `;
  const res = await pool.query(q);
  return res.rows;
};

export const getOrdersByUser = async (userId) => {
  const q = `
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
      ) FILTER (WHERE oi.id IS NOT NULL) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = $1::uuid
    GROUP BY o.id
    ORDER BY o.created_at DESC;
  `;
  const res = await pool.query(q, [userId]);
  return res.rows;
};

export const getOrderById = async (orderId, userId) => {
  const q = `
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
      ) FILTER (WHERE oi.id IS NOT NULL) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.id = $1::uuid AND o.user_id = $2::uuid
    GROUP BY o.id;
  `;
  const res = await pool.query(q, [orderId, userId]);
  return res.rows[0] || null;
};

export const updateOrderStatus = async (orderId, status) => {
  const q = `
    UPDATE orders
    SET status = $1
    WHERE id = $2::uuid
    RETURNING id, user_id, total_amount, status, shipping_address, created_at;
  `;
  const res = await pool.query(q, [status, orderId]);
  return res.rows[0] || null;
};
