// backend/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import cron job (runs automatically on startup)
require('./cron');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors());              // Allow frontend requests (adjust origin in prod)
app.use(express.json());      // Parse JSON bodies
app.use(helmet());            // Add security headers

// ---------- Routes ----------
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const recipeRoutes = require('./routes/recipes_from_cart');

// Use a consistent /api prefix for all backend routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/recipes', recipeRoutes);

// Health check / root route
app.get('/', (req, res) => {
  res.send('✅ Grocify backend running!');
});

// ---------- 404 Handler ----------
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------- Centralized Error Handler ----------
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
