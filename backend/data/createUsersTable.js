import pool from "../config/db.js";

// Function to create the users table
const createUsersTable = async () => {
    const createTableQuery = `
     CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    try {
        await pool.query(createTableQuery);
        console.log("User table created or already exists.");
    } catch (err) {
        console.error("Error creating user table:", err);
    }
};

export default createUsersTable;