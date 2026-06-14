require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
require('./models'); // load all models + associations

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const restaurantRoutes = require('./routes/restaurants');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { initWebSocket } = require('./utils/websocket');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// WebSocket
initWebSocket(server);

// Start
const PORT = process.env.PORT || 4000;

sequelize.authenticate()
  .then(() => {
    console.log('[DB] Connected to MySQL');
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log(`[WS]     WebSocket on ws://localhost:${PORT}/ws`);
    });
  })
  .catch((err) => {
    console.error('[DB] Connection failed:', err.message);
    console.error('Make sure MySQL is running and .env is configured correctly');
    process.exit(1);
  });

module.exports = { app, server };
