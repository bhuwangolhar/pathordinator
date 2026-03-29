const db = require("../../models");

const DeliverySession = db.DeliverySession;
const Order = db.Order;
const User = db.User;

exports.startSession = async (req, res) => {
  try {
    const { order_id, delivery_partner_id } = req.body;

    if (!order_id || !delivery_partner_id) {
      return res.status(400).json({
        success: false,
        message: "order_id and delivery_partner_id are required"
      });
    }

    const session = await DeliverySession.create({
      order_id,
      delivery_partner_id,
      started_at: new Date(),
      is_active: true
    });

    res.status(201).json({ success: true, data: session });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to start session" });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await DeliverySession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    await session.update({ ended_at: new Date(), is_active: false });

    res.json({ success: true, data: session });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to end session" });
  }
};

exports.getSessionByOrder = async (req, res) => {
  try {
    const session = await DeliverySession.findOne({
      where: { order_id: req.params.orderId },
      include: [
        { model: Order, as: 'order' },
        { model: User, as: 'deliveryPartner', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "No session found for this order" });
    }

    res.json({ success: true, data: session });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch session" });
  }
};