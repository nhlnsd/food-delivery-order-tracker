const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

// Enforce valid transitions
const VALID_TRANSITIONS = {
  placed: ['confirmed'],
  confirmed: ['preparing'],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
};

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'restaurants', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM(...ORDER_STATUSES),
    allowNull: false,
    defaultValue: 'placed',
  },
  deliveryAddress: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  estimatedDeliveryMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 30,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'orders',
  indexes: [
    { fields: ['customerId'] },
    { fields: ['restaurantId'] },
    { fields: ['status'] },
    { fields: ['customerId', 'status'] },
    { fields: ['restaurantId', 'status'] },
  ],
});

Order.ORDER_STATUSES = ORDER_STATUSES;
Order.VALID_TRANSITIONS = VALID_TRANSITIONS;

Order.isValidTransition = (from, to) => {
  return VALID_TRANSITIONS[from] && VALID_TRANSITIONS[from].includes(to);
};

module.exports = Order;
