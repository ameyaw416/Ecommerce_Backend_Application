import pool from "../config/db.js";

// Function to create the products table
const createProductsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `; // ✅ removed the extra parenthesis before the semicolon

  try {
    await pool.query(createTableQuery);
    console.log("Products table created or already exists.");
  } catch (err) {
    console.error("Error creating products table:", err);
  }
};

export default createProductsTable;
