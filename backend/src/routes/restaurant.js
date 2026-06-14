const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listRestaurants, getRestaurant } = require('../controllers/restaurantController');

router.get('/', authenticate, listRestaurants);
router.get('/:id', authenticate, getRestaurant);

module.exports = router;
