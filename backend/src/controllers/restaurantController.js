const { Restaurant } = require('../models');
const { success, notFound, serverError } = require('../utils/response');

// GET /api/restaurants — List all restaurants (for customers placing orders)
const listRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll({
      attributes: ['id', 'name', 'address', 'phone'],
    });
    return success(res, { restaurants });
  } catch (err) {
    return serverError(res, err.message);
  }
};

// GET /api/restaurants/:id
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      attributes: ['id', 'name', 'address', 'phone'],
    });
    if (!restaurant) return notFound(res, 'Restaurant not found');
    return success(res, { restaurant });
  } catch (err) {
    return serverError(res, err.message);
  }
};

module.exports = { listRestaurants, getRestaurant };
