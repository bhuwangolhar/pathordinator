const db = require("../../models");

const Order = db.Order;
const User = db.User;

const ALLOWED_STATUSES = ['created', 'assigned', 'picked_up', 'delivered'];

exports.createOrder = async (req, res) => {
  try {
    const { customer_id, pickup_address, delivery_address, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude } = req.body;
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    if (!customer_id || !pickup_address || !delivery_address || pickup_latitude === undefined || pickup_longitude === undefined || delivery_latitude === undefined || delivery_longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "customer_id, addresses, and coordinates (latitude/longitude) for both pickup and delivery are required"
      });
    }

    // Validate coordinates
    const pickupLat = Number(pickup_latitude);
    const pickupLng = Number(pickup_longitude);
    const deliveryLat = Number(delivery_latitude);
    const deliveryLng = Number(delivery_longitude);

    if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng) || !Number.isFinite(deliveryLat) || !Number.isFinite(deliveryLng)) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must be valid numbers"
      });
    }

    if (pickupLat < -90 || pickupLat > 90 || deliveryLat < -90 || deliveryLat > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90"
      });
    }

    if (pickupLng < -180 || pickupLng > 180 || deliveryLng < -180 || deliveryLng > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180"
      });
    }

    // Verify customer belongs to the same organization
    const customer = await User.findByPk(customer_id);
    if (!customer || customer.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "Customer must belong to your organization"
      });
    }

    const order = await Order.create({
      customer_id,
      organization_id: userOrganizationId,
      pickup_address,
      pickup_latitude: pickupLat,
      pickup_longitude: pickupLng,
      delivery_address,
      delivery_latitude: deliveryLat,
      delivery_longitude: deliveryLng,
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
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    const orders = await Order.findAll({
      where: { organization_id: userOrganizationId },
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
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

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

    // Verify order belongs to user's organization
    if (order.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this order"
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
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

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

    // Verify order belongs to user's organization
    if (order.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this order"
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