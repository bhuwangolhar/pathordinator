'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      role: {
        type: DataTypes.ENUM('customer', 'delivery_partner', 'admin'),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',

      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return User;
};
