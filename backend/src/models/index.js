const User = require('./User');
const Restaurant = require('./Restaurant');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Associations
User.hasOne(Restaurant, { foreignKey: 'userId', as: 'restaurantProfile' });
Restaurant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'orders' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = { User, Restaurant, Order, OrderItem };