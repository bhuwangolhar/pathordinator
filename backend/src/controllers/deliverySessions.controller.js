const db = require("../../models");

const DeliverySession = db.DeliverySession;
const Order = db.Order;
const User = db.User;

exports.startSession = async (req, res) => {
  try {
    const { order_id, delivery_partner_id } = req.body;
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    if (!order_id || !delivery_partner_id) {
      return res.status(400).json({
        success: false,
        message: "order_id and delivery_partner_id are required"
      });
    }

    // Verify order belongs to the user's organization
    const order = await Order.findByPk(order_id);
    if (!order || order.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "Order does not belong to your organization"
      });
    }

    // Verify delivery partner belongs to the user's organization
    const deliveryPartner = await User.findByPk(delivery_partner_id);
    if (!deliveryPartner || deliveryPartner.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "Delivery partner does not belong to your organization"
      });
    }

    const session = await DeliverySession.create({
      order_id,
      delivery_partner_id,
      organization_id: userOrganizationId,
      started_at: new Date(),
      is_active: true
    });

    // Get user details for WebSocket broadcast
    const user = await User.findByPk(delivery_partner_id, {
      include: [{ model: db.Organization, as: 'organization' }]
    });

    // Emit session started event
    if (global.io && user) {
      global.io.to(`org-${user.organization_id}`).emit('session-started', {
        sessionId: session.id,
        orderId: order_id,
        deliveryPartnerId: delivery_partner_id,
        partnerName: user.name,
        timestamp: new Date()
      });

      // Start delivery marker for online status
      global.io.to(`org-${user.organization_id}`).emit('user-online', {
        userId: delivery_partner_id,
        status: true,
        timestamp: new Date()
      });
    }

    res.status(201).json({ success: true, data: session });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to start session" });
  }
};

exports.endSession = async (req, res) => {
  try {
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    const session = await DeliverySession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Verify session belongs to user's organization
    if (session.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this session"
      });
    }

    // Update session to mark as ended
    await session.update({ 
      ended_at: new Date(), 
      is_active: false 
    });

    res.json({ success: true, data: session });

  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ success: false, message: "Failed to end session" });
  }
};

exports.getSessionByOrder = async (req, res) => {
  try {
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    const session = await DeliverySession.findOne({
      where: { order_id: req.params.orderId },
      order: [['started_at', 'DESC']],
      include: [
        { model: Order, as: 'order' },
        { model: User, as: 'deliveryPartner', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "No session found for this order" });
    }

    // Verify session belongs to user's organization
    if (session.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this session"
      });
    }

    res.json({ success: true, data: session });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch session" });
  }
};