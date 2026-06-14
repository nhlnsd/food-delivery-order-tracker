require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./database');
const { User, Restaurant, Order, OrderItem } = require('../models');

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    console.log('Seeding users...');

    // Create restaurant user
    const restaurantUser = await User.findOrCreate({
      where: { email: 'restaurant@demo.com' },
      defaults: {
        name: 'Spice Garden Kitchen',
        email: 'restaurant@demo.com',
        password: await bcrypt.hash('password123', 10),
        role: 'restaurant',
      },
    });

    // Create restaurant profile
    const restaurant = await Restaurant.findOrCreate({
      where: { userId: restaurantUser[0].id },
      defaults: {
        userId: restaurantUser[0].id,
        name: 'Spice Garden Kitchen',
        address: '42 MG Road, Bangalore',
        phone: '+91 98765 43210',
      },
    });

    // Create customer user
    const customerUser = await User.findOrCreate({
      where: { email: 'customer@demo.com' },
      defaults: {
        name: 'Arjun Sharma',
        email: 'customer@demo.com',
        password: await bcrypt.hash('password123', 10),
        role: 'customer',
      },
    });

    // Create a sample order
    const existingOrder = await Order.findOne({
      where: { customerId: customerUser[0].id },
    });

    if (!existingOrder) {
      const order = await Order.create({
        customerId: customerUser[0].id,
        restaurantId: restaurant[0].id,
        status: 'placed',
        deliveryAddress: '10 Koramangala, Bangalore',
        totalAmount: 485.00,
        estimatedDeliveryMinutes: 35,
      });

      await OrderItem.bulkCreate([
        { orderId: order.id, name: 'Butter Chicken', quantity: 1, price: 280.00 },
        { orderId: order.id, name: 'Garlic Naan (2)', quantity: 1, price: 80.00 },
        { orderId: order.id, name: 'Mango Lassi', quantity: 1, price: 125.00 },
      ]);

      console.log('Sample order created:', order.id);
    }

    console.log('\n========== SEED COMPLETE ==========');
    console.log('Restaurant login:  restaurant@demo.com / password123');
    console.log('Customer login:    customer@demo.com  / password123');
    console.log('===================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
