// Authentication controller
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAccessToken, createRefreshToken } from '../utils/tokenUtils.js';


const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// Helper: promote user to admin if email is in ADMIN_EMAILS
const assignAdminRoleIfMatch = async (userId, email) => {
  try {
    const list = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (!email) return null;

    if (list.includes(String(email).toLowerCase())) {
      // force role = admin
      const upd = await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2::uuid AND role <> $1 RETURNING role',
        ['admin', userId]
      );
      if (upd.rows.length) return upd.rows[0].role; // became admin now
    }

    // return current role if not updated
    const cur = await pool.query('SELECT role FROM users WHERE id = $1::uuid', [userId]);
    return cur.rows[0]?.role || 'user';
  } catch (e) {
    console.error('assignAdminRoleIfMatch error:', e && e.stack ? e.stack : e);
    return null;
  }
};


// User registration Response
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
      [username, email, hashedPassword]
    );

    // ✅ Ensure role based on ADMIN_EMAILS
    const ensuredRole = await assignAdminRoleIfMatch(newUser.rows[0].id, newUser.rows[0].email);
    const safeUser = { ...newUser.rows[0], role: ensuredRole || newUser.rows[0].role };

    res.status(201).json({ message: 'User registered successfully', user: safeUser });
  } catch (error) {
    next(error);
  }
};


// User login Response
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ✅ Ensure role based on ADMIN_EMAILS (may promote)
    const ensuredRole = await assignAdminRoleIfMatch(user.id, user.email);
    const role = ensuredRole || user.role || 'user';

    const payload = { userId: user.id, email: user.email, role };

    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    // Set refresh token as HttpOnly cookie
    res.cookie('jid', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod (HTTPS)
      sameSite: 'strict',
      path: '/api/auth/refresh', // only sent to this path
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Login successful
    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, role },
      accessToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



/// Refresh access token (reads refresh token from cookie)
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.jid;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Check if user still exists (✅ select role too)
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [payload.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    const user = result.rows[0];

    // Optionally re-ensure admin role on refresh as well:
    const ensuredRole = await assignAdminRoleIfMatch(user.id, user.email);
    const role = ensuredRole || user.role || 'user';

    const newPayload = { userId: user.id, email: user.email, role };
    const newAccessToken = createAccessToken(newPayload);
    const newRefreshToken = createRefreshToken(newPayload);

    // Rotate refresh token (optional but recommended)
    res.cookie('jid', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken: newAccessToken,
      user: { id: user.id, email: user.email, role }
    });
  } catch (error) {
    next(error);
  }
};




// User logout response
export const logoutUser = (req, res) => {
  // Clear cookie on logout
  res.clearCookie('jid', { path: '/api/auth/refresh' });
  res.status(200).json({ message: 'Logout successful' });
};   

