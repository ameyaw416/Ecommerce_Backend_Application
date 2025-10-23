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

    // We'll compute totalAmount using product prices from DB to avoid trusting client prices.
    let totalAmount = 0;

    // Prepare to insert order after validations
    // First, for each item, lock product row and check stock & get price
    // We'll collect the product data so we can insert order_items and update stock
    const productDataById = new Map();

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        throw new Error('Each item must have productId and quantity');
      }

      // Lock the product row to prevent concurrent modifications
      const productRes = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1::uuid FOR UPDATE',
        [item.productId]
      );

      if (!productRes.rows.length) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const product = productRes.rows[0];
      const qty = Number(item.quantity);

      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`Invalid quantity for product ${item.productId}`);
      }

      if (product.stock == null || Number(product.stock) < qty) {
        throw new Error(`Insufficient stock for product ${product.id} (${product.name})`);
      }

      // Use product.price as unit_price (safe, authoritative)
      const unitPrice = Number(product.price);

      totalAmount += unitPrice * qty;

      productDataById.set(item.productId, {
        id: product.id,
        name: product.name,
        unitPrice,
        qty
      });
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

    // Insert order items and decrement stock
    const insertItemText = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1::uuid, $2::uuid, $3, $4)';
    const updateStockText = 'UPDATE products SET stock = stock - $1 WHERE id = $2::uuid';

    for (const [productId, pd] of productDataById) {
      // insert item using the db price
      await client.query(insertItemText, [orderId, pd.id, pd.qty, pd.unitPrice]);

      // decrement stock (we already locked row earlier)
      await client.query(updateStockText, [pd.qty, pd.id]);
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
