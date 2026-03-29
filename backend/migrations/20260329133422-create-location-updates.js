'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('location_updates', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'delivery_sessions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('location_updates');
  }
};