// backend/data/createPasswordResetsTable.js
import pool from '../config/db.js';

const createPasswordResetsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS password_resets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT now()
    );

    -- Speed lookups and housekeeping
    CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets (token_hash);
    CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets (expires_at);
    CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets (user_id);
  `;

  try {
    await pool.query(createTableQuery);
    console.log('password_resets table created or already exists.');
  } catch (err) {
    console.error('Error creating password_resets table:', err);
    throw err;
  }
};

export default createPasswordResetsTable;
