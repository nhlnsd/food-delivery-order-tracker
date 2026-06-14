const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Restaurant } = require('../models');
const { success, created, error, unauthorized, serverError } = require('../utils/response');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const formatUserResponse = (user, restaurantProfile = null) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  restaurantId: restaurantProfile ? restaurantProfile.id : null,
});

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return error(res, 'name, email, password, and role are required');
    }

    if (!['customer', 'restaurant'].includes(role)) {
      return error(res, 'role must be customer or restaurant');
    }

    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters');
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    let restaurantProfile = null;
    if (role === 'restaurant') {
      restaurantProfile = await Restaurant.create({
        userId: user.id,
        name,
      });
    }

    const token = generateToken(user.id);

    return created(res, {
      token,
      user: formatUserResponse(user, restaurantProfile),
    }, 'Account created successfully');
  } catch (err) {
    return serverError(res, err.message);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return unauthorized(res, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return unauthorized(res, 'Invalid credentials');
    }

    let restaurantProfile = null;
    if (user.role === 'restaurant') {
      restaurantProfile = await Restaurant.findOne({ where: { userId: user.id } });
    }

    const token = generateToken(user.id);

    return success(res, {
      token,
      user: formatUserResponse(user, restaurantProfile),
    }, 200, 'Login successful');
  } catch (err) {
    return serverError(res, err.message);
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    let restaurantProfile = null;
    if (req.user.role === 'restaurant') {
      restaurantProfile = await Restaurant.findOne({ where: { userId: req.user.id } });
    }
    return success(res, { user: formatUserResponse(req.user, restaurantProfile) });
  } catch (err) {
    return serverError(res, err.message);
  }
};

module.exports = { register, login, me };
