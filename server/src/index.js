// server/src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth.routes');
const spaceRoutes = require('./routes/space.routes');
const tenantRoutes = require('./routes/tenant.routes');
const locationRoutes = require('./routes/location.routes'); // New location routes

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/locations', locationRoutes); // Register location routes

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Room Management API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});