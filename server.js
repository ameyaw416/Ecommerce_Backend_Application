import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import pool from './backend/config/db.js';
import { generalLimiter, authLimiter } from './backend/middlewares/rateLimiterMiddleware.js';
import createUsersTable from './backend/data/createUsersTable.js';
import createProductsTable from './backend/data/createProductsTable.js';
import createCartsItemTable from './backend/data/createCartsItemTable.js';
import createOrdersTable from './backend/data/createOrdersTable.js';
import createOrderStatusHistoryTable from './backend/data/createOrderStatusHistoryTable.js';
import createUserRoleHistoryTable from './backend/data/createUserRoleHistoryTable.js';
import createPasswordResetsTable from './backend/data/createPasswordResetsTable.js';
import errorHandling from './backend/middlewares/errorHandlingMiddleware.js';
import createOrderItemsTable from './backend/data/createOrderItemsTable.js';
import authRoute from './backend/routes/authRoute.js';
import verifyAuth from './backend/middlewares/verifyAuthMiddleware.js';
import usersRoute from './backend/routes/usersRoute.js';
import productsRoute from './backend/routes/productsRoute.js';
import cartRoute from './backend/routes/cartRoute.js';
import orderRoute from './backend/routes/orderRoute.js';
import adminInventoryRoute from './backend/routes/adminInventoryRoute.js';
import adminUserRoute from './backend/routes/adminUserRoute.js';
import bcrypt from 'bcryptjs';





// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(generalLimiter); // Apply general rate limiter to all requests

// Routes
//app.use(verifyAuth); // Protect all routes below this line
app.use('/api/auth',authLimiter, authRoute);
app.use('/api/users', verifyAuth, usersRoute);
app.use('/api/products', verifyAuth, productsRoute);
app.use('/api/cart', verifyAuth, cartRoute);
app.use('/api/orders', verifyAuth, orderRoute);
app.use('/api/admin/inventory',verifyAuth, adminInventoryRoute);
app.use('/api/admin', verifyAuth, adminUserRoute);

// Error handling middleware
app.use(errorHandling);

async function ensureInitialAdmin() {
  const rawEmails = process.env.ADMIN_EMAILS || '';
  const email = rawEmails.split(',').map(e => e.trim()).filter(Boolean)[0];
  const username = (process.env.ADMIN_USERNAME || '').trim();
  const password = process.env.ADMIN_PASSWORD;
  const roleEnv = (process.env.ADMIN_ROLE || 'admin').toLowerCase();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const resetOnBoot = String(process.env.ADMIN_RESET_ON_BOOT || 'false').toLowerCase() === 'true';

  if (!email || !username || !password) {
    console.warn('Skipping admin seed — missing ADMIN_EMAILS/ADMIN_USERNAME/ADMIN_PASSWORD');
    return;
  }
  if (roleEnv !== 'admin') {
    console.warn('[bootstrap] ADMIN_ROLE is not "admin" — forcing role=admin');
  }

  // Ensure a user with this email exists; create if missing
  const existing = await pool.query('SELECT id, email, username, role FROM users WHERE email = $1', [email]);

  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash(password, rounds);
    const insert = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, email, username, role, created_at`,
      [username, email, hash]
    );
    console.log('Admin user created:', insert.rows[0].email);
    return;
  }

  // User exists: enforce admin role, sync username, and optionally reset password
  const user = existing.rows[0];
  let changed = false;

  if (user.role !== 'admin') {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id]);
    changed = true;
  }

  if (username && user.username !== username) {
    await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, user.id]);
    changed = true;
  }

  if (resetOnBoot) {
    const hash = await bcrypt.hash(password, rounds);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
    changed = true;
  }

  console.log(`Admin user ensured (${email}) — ${changed ? 'updated' : 'no changes needed'}`);
}



// Initialize database and create tables
async function init() {
    
try {
  // Enable pgcrypto extension for UUID generation
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // Create tables
  await createUsersTable();
  await createProductsTable();
  await createCartsItemTable();
  await createOrdersTable();
  await createOrderItemsTable();
  await createOrderStatusHistoryTable();
  await createUserRoleHistoryTable();
  await createPasswordResetsTable();

  await ensureInitialAdmin();

  console.log("All tables initialized successfully.");
} catch (err) {
  console.error("Error during database setup:", err);
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
}

init();