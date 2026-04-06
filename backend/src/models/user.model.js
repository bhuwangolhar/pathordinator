'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Order, { foreignKey: 'customer_id', as: 'orders' });
            User.hasMany(models.DeliverySession, { foreignKey: 'delivery_partner_id', as: 'deliverySessions' });
            User.belongsTo(models.Organization, { foreignKey: 'organization_id', as: 'organization' });
        }
    }

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
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            organization_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: true
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
