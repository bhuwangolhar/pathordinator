'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'organization_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null initially for existing records
      references: {
        model: 'organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Create index for faster queries
    await queryInterface.addIndex('orders', ['organization_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('orders', ['organization_id']);
    await queryInterface.removeColumn('orders', 'organization_id');
  }
};
