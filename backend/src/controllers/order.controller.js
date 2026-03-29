const db = require("../../models");

const Order = db.Order;
const User = db.User;

const ALLOWED_STATUSES = ['created', 'assigned', 'picked_up', 'delivered'];

exports.createOrder = async (req, res) => {
  try {
    const { customer_id, pickup_address, delivery_address } = req.body;

    if (!customer_id || !pickup_address || !delivery_address) {
      return res.status(400).json({
        success: false,
        message: "customer_id, pickup_address, and delivery_address are required"
      });
    }

    const order = await Order.create({
      customer_id,
      pickup_address,
      delivery_address,
      status: 'created'
    });

    res.status(201).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required"
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    await order.update({ status });

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
};