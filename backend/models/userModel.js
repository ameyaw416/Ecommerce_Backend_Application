import pool from "../config/db.js";

// Function to get all users
export const getAllUsers = async () => {
  const res = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC;');
  return res.rows;
};

/**
 * Update a user's role and record the change in user_role_history
 * @param {string} userId - The user whose role is being changed
 * @param {string} newRole - "user" | "admin"
 * @param {string|null} changedByUserId - The admin who made the change (req.user.id)
 * @returns {object|null} - Updated user row or null if not found / invalid role
 */

export const updateUserRole = async (userId, newRole, changedByUserId = null) => {
  const allowed = ['user', 'admin'];
  if (!allowed.includes(newRole)) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the user row so role doesn't change under us
    const sel = await client.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1::uuid FOR UPDATE;',
      [userId]
    );
    if (!sel.rows.length) {
      await client.query('ROLLBACK');
      return null;
    }

    const previousRole = sel.rows[0].role;
    if (previousRole === newRole) {
      // No change needed, but still return the user
      await client.query('COMMIT');
      return sel.rows[0];
    }

    // Update role
    const upd = await client.query(
      'UPDATE users SET role = $1 WHERE id = $2::uuid RETURNING id, username, email, role, created_at;',
      [newRole, userId]
    );
    const updatedUser = upd.rows[0];

    // Insert history
    await client.query(
      `INSERT INTO user_role_history (user_id, previous_role, new_role, changed_by)
       VALUES ($1::uuid, $2, $3, $4::uuid);`,
      [userId, previousRole, newRole, changedByUserId]
    );

    await client.query('COMMIT');
    return updatedUser;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Optional: fetch role change history for a user (admin/reporting)
 */

export const getUserRoleHistory = async (userId) => {
  const res = await pool.query(
    `SELECT id, user_id, previous_role, new_role, changed_by, changed_at
     FROM user_role_history
     WHERE user_id = $1::uuid
     ORDER BY changed_at DESC;`,
    [userId]
  );
  return res.rows;
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
export const updateUserById = async (id, fields = {}) => {
  const { username, email, password } = fields;
  const sets = [];
  const values = [];
  let idx = 1;

  if (username !== undefined) {
    sets.push(`username = $${idx++}`);
    values.push(username);
  }

  if (email !== undefined) {
    sets.push(`email = $${idx++}`);
    values.push(email);
  }

  if (password !== undefined) {
    sets.push(`password = $${idx++}`);
    values.push(password);
  }

  if (!sets.length) {
    const existing = await getUserById(id);
    return existing || null;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role, created_at`,
    values
  );
  return result.rows[0] || null;
};


// Function to delete a user by ID
export const deleteUserById = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

// Get users with filters, search, sort, pagination
export const getUsersFiltered = async ({
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'created_at',
  sortDir = 'desc',
  created_from = null,
  created_to = null,
}) => {
  const allowedSort = new Set(['created_at', 'email', 'username']);
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sortCol = allowedSort.has(sortBy) ? sortBy : 'created_at';

  const where = [];
  const params = [];
  let idx = 1;

  if (search) {
    where.push(`(username ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (created_from) {
    where.push(`created_at >= $${idx}`);
    params.push(new Date(created_from));
    idx++;
  }

  if (created_to) {
    where.push(`created_at < $${idx}`);
    params.push(new Date(created_to));
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limitNum;

  const q = `
    SELECT id, username, email, role, created_at,
           COUNT(*) OVER() AS total_count
    FROM users
    ${whereSql}
    ORDER BY ${sortCol} ${dir}
    LIMIT $${idx} OFFSET $${idx + 1};
  `;
  params.push(limitNum, offset);

  const res = await pool.query(q, params);
  const total = res.rows.length ? Number(res.rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / limitNum));

  return {
    data: res.rows.map(({ total_count, ...r }) => r),
    pagination: { page: pageNum, limit: limitNum, total, pages },
  };
};



export default { getAllUsers, getUserById, getUserByEmail, updateUserById, deleteUserById, getUsersFiltered }; 


