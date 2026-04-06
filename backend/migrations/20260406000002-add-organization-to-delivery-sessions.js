'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('delivery_sessions', 'organization_id', {
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
    await queryInterface.addIndex('delivery_sessions', ['organization_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('delivery_sessions', ['organization_id']);
    await queryInterface.removeColumn('delivery_sessions', 'organization_id');
  }
};
