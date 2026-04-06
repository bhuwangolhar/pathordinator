'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeliverySession extends Model {
    static associate(models) {
      DeliverySession.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      DeliverySession.belongsTo(models.Organization, { foreignKey: 'organization_id', as: 'organization' });
      DeliverySession.belongsTo(models.User, { foreignKey: 'delivery_partner_id', as: 'deliveryPartner' });
      DeliverySession.hasMany(models.LocationUpdate, { foreignKey: 'session_id', as: 'locationUpdates' });
    }
  }

  DeliverySession.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      delivery_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      ended_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'DeliverySession',
      tableName: 'delivery_sessions',
      timestamps: false
    }
  );

  return DeliverySession;
};