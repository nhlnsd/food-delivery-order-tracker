require('dotenv').config();
const sequelize = require('./database');
const { User, Restaurant, Order, OrderItem } = require('../models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established.');

    console.log('Running migrations (sync with alter)...');
    await sequelize.sync({ alter: true });
    console.log('Migration complete.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
