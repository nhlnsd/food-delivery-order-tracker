const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  placeOrder,
  getMyOrder,
  getOrder,
  getRestaurantOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

// Customer routes
router.post('/', authenticate, requireRole('customer'), placeOrder);
router.get('/my', authenticate, requireRole('customer'), getMyOrder);

// Restaurant routes
router.get('/restaurant', authenticate, requireRole('restaurant'), getRestaurantOrders);
router.patch('/:id/status', authenticate, requireRole('restaurant'), updateOrderStatus);

// Shared (owner only)
router.get('/:id', authenticate, getOrder);

module.exports = router;
