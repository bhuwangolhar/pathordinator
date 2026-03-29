'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
    }
  }

  Order.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('created', 'assigned', 'picked_up', 'delivered'),
        allowNull: false,
        defaultValue: 'created'
      },
      pickup_address: {
        type: DataTypes.STRING,
        allowNull: false
      },
      delivery_address: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return Order;
};