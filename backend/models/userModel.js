import pool from "../config/db.js";

// Function to get all users
export const getAllUsers = async () => {
  const res = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC;');
  return res.rows;
};

export const updateUserRole = async (userId, newRole) => {
  const allowed = ['user', 'admin'];
  if (!allowed.includes(newRole)) return null;

  const res = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2::uuid RETURNING id, username, email, role, created_at;',
    [newRole, userId]
  );

  return res.rows[0] || null;
};

// Function to get a user by ID
export const getUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

// Function get user by email
export const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

//Function update by id
export const updateUserById = async (id, username, email, password) => {
  const result = await pool.query(
    'UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, username, email, created_at',
    [username, email, password, id]
  );
  return result.rows[0];
};


// Function to delete a user by ID
export const deleteUserById = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

export default { getAllUsers, getUserById, getUserByEmail, updateUserById, deleteUserById}; 



