'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'pickup_latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'pickup_longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'delivery_latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'delivery_longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'pickup_latitude');
    await queryInterface.removeColumn('orders', 'pickup_longitude');
    await queryInterface.removeColumn('orders', 'delivery_latitude');
    await queryInterface.removeColumn('orders', 'delivery_longitude');
  }
};
