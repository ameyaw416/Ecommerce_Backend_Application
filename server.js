import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import pool from './backend/config/db.js';
import arcjetMiddleware from './backend/middlewares/arcjetMiddleware.js';
import createUsersTable from './backend/data/createUsersTable.js';
import createProductsTable from './backend/data/createProductsTable.js';
import createCartsItemTable from './backend/data/createCartsItemTable.js';
import createOrdersTable from './backend/data/createOrdersTable.js';
import createOrderStatusHistoryTable from './backend/data/createOrderStatusHistoryTable.js';
import errorHandling from './backend/middlewares/errorHandlingMiddleware.js';
import createOrderItemsTable from './backend/data/createOrderItemsTable.js';
import authRoute from './backend/routes/authRoute.js';
import verifyAuth from './backend/middlewares/verifyAuthMiddleware.js';
import usersRoute from './backend/routes/usersRoute.js';
import productsRoute from './backend/routes/productsRoute.js';
import cartRoute from './backend/routes/cartRoute.js';
import orderRoute from './backend/routes/orderRoute.js';



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
app.use(arcjetMiddleware); // Apply Arcjet middleware globally
app.use(cookieParser());

// Routes
//app.use(verifyAuth); // Protect all routes below this line
app.use('/api/auth',authRoute);
app.use('/api/users', verifyAuth, usersRoute);
app.use('/api/products', verifyAuth, productsRoute);
app.use('/api/cart', verifyAuth, cartRoute);
app.use('/api/orders', verifyAuth, orderRoute);

// Error handling middleware
app.use(errorHandling);


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