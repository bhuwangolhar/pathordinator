'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        // CASCADE: deleting a user removes their orders too.
        // Appropriate here since an order without a customer is orphaned data.
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('created', 'assigned', 'picked_up', 'delivered'),
        allowNull: false,
        defaultValue: 'created'
      },
      pickup_address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      delivery_address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  }
};