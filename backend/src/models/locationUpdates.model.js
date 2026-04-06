'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LocationUpdate extends Model {
    static associate(models) {
      LocationUpdate.belongsTo(models.DeliverySession, { foreignKey: 'session_id', as: 'session' });
    }
  }

  LocationUpdate.init(
    {
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      recorded_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'LocationUpdate',
      tableName: 'location_updates',
      timestamps: false
    }
  );

  return LocationUpdate;
};