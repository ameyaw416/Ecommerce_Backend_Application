import pool from "../config/db.js";

// Function to create the cart_items table
const createCartsItemTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS cart_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, product_id)
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log("cart_items table created or already exists.");
  } catch (err) {
    console.error("Error creating cart_items table:", err);
  }
};

export default createCartsItemTable;
