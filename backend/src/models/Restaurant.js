const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Restaurant = sequelize.define('Restaurant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'users', key: 'id' },
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'restaurants',
  indexes: [
    { unique: true, fields: ['userId'] },
  ],
});

module.exports = Restaurant;
