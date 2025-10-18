// Authentication controller
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAccessToken, createRefreshToken } from '../utils/tokenUtils.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;



// User registration Response
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
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

    const payload = { userId: user.id, email: user.email };

    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    // Send refresh token as HttpOnly cookie
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
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Refresh access token (reads refresh token from cookie)

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

    // continue with your logic here...

  } catch (error) {
    next(error);
  }
};




// User logout response
export const logoutUser = (req, res) => {
  // For JWT, logout can be handled on the client side by deleting the token
  res.status(200).json({ message: 'Logout successful' });
};      

