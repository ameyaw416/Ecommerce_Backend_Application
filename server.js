import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import pool from './backend/config/db.js';
import arcjetMiddleware from './backend/middlewares/arcjetMiddleware.js';


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

// Routes
app.get('/', (req, res) => {
    res.send('E-commerce Application Server is running');
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});