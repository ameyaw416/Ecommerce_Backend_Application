// Authentication controller
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
//import {JWT_SECRET, JWT_REFRESH_SECRET} from '../config/config.js';



//standardized response messages



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


// User logout response
export const logoutUser = (req, res) => {
  // For JWT, logout can be handled on the client side by deleting the token
  res.status(200).json({ message: 'Logout successful' });
};      

