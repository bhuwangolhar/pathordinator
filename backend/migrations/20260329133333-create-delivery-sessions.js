'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('delivery_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      delivery_partner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('delivery_sessions');
  }
};