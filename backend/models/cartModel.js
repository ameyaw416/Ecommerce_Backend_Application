//creating cartModel.js
import pool from "../config/db.js";

// Function to add an item to the cart
export const addItemToCart = async (userId, productId, quantity) => {
  const query = `
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, product_id)
    DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    RETURNING *;
  `;
  const values = [userId, productId, quantity];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    throw err;
  }
};

// Function to get all items in a user's cart
export const getCartItems = async (userId) => {
  const query = `
    SELECT ci.id, ci.product_id, p.name, p.price, ci.quantity, ci.added_at
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = $1;
  `;
  const values = [userId];

  try {
    const res = await pool.query(query, values);
    return res.rows;
  } catch (err) {
    throw err;
  }
};

// Function to update the quantity of an item in the cart
export const updateCartItemQuantity = async (userId, itemId, quantity) => {
  const query = `
    UPDATE cart_items
    SET quantity = $1
    WHERE id = $2 AND user_id = $3
    RETURNING *;
  `;
  const values = [quantity, itemId, userId];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    throw err;
  }
};

// Function to remove an item from the cart
export const removeItemFromCart = async (userId, itemId) => {
  const query = `
    DELETE FROM cart_items
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const values = [itemId, userId];

  try {
    const res = await pool.query(query, values);
    return res.rows[0];
  } catch (err) {
    throw err;
  }
};