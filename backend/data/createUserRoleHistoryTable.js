import pool from '../config/db.js';

const createUserRoleHistoryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_role_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      previous_role VARCHAR(20) NOT NULL CHECK (previous_role IN ('user','admin')),
      new_role VARCHAR(20) NOT NULL CHECK (new_role IN ('user','admin')),
      changed_by UUID REFERENCES users(id), -- admin who changed it (nullable if done by system)
      changed_at TIMESTAMP DEFAULT now()
    );
  `;
  try {
    await pool.query(query);
    console.log('user_role_history table created or already exists.');
  } catch (err) {
    console.error('Error creating user_role_history table:', err);
    throw err;
  }
};

export default createUserRoleHistoryTable;
