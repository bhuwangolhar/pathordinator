'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Order extends Model {
        static associate(models) {
            Order.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
            Order.belongsTo(models.Organization, { foreignKey: 'organization_id', as: 'organization' });
            Order.hasOne(models.DeliverySession, { foreignKey: 'order_id', as: 'deliverySession' });
        }
    }

    Order.init(
        {
            customer_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            organization_id: {
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
            pickup_latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: false
            },
            pickup_longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: false
            },
            delivery_address: {
                type: DataTypes.STRING,
                allowNull: false
            },
            delivery_latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: false
            },
            delivery_longitude: {
                type: DataTypes.DECIMAL(11, 8),
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
