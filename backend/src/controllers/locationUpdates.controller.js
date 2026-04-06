const db = require("../../models");

const LocationUpdate = db.LocationUpdate;
const DeliverySession = db.DeliverySession;

exports.addLocationUpdate = async (req, res) => {
  try {
    const { session_id, latitude, longitude } = req.body;
    const userOrganizationId = req.user?.organization_id;
    const parsedSessionId = Number(session_id);
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    if (!session_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "session_id, latitude, and longitude are required"
      });
    }

    if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "session_id must be a valid positive integer"
      });
    }

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude must be valid numbers"
      });
    }

    const session = await DeliverySession.findByPk(parsedSessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Delivery session not found"
      });
    }

    // Verify session belongs to user's organization
    if (session.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this session"
      });
    }

    if (!session.is_active) {
      return res.status(400).json({
        success: false,
        message: "Cannot add a location update to an ended session"
      });
    }

    const update = await LocationUpdate.create({
      session_id: parsedSessionId,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      recorded_at: new Date()
    });

    // Get the session with associated user to broadcast update
    const sessionWithUser = await DeliverySession.findByPk(parsedSessionId, {
      include: [
        {
          model: db.User,
          as: 'delivery_partner',
          attributes: ['id', 'name']
        }
      ]
    });

    // Emit location update via WebSocket
    if (global.io && sessionWithUser) {
      const deliveryRoom = `delivery-${parsedSessionId}`;
      global.io.to(deliveryRoom).emit('location-update', {
        id: update.id,
        delivery_session_id: parsedSessionId,
        latitude: update.latitude,
        longitude: update.longitude,
        timestamp: update.recorded_at,
        delivery_partner_id: sessionWithUser.delivery_partner_id,
        user_name: sessionWithUser.delivery_partner?.name || 'Delivery Partner'
      });
    }

    res.status(201).json({ success: true, data: update });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add location update" });
  }
};

exports.getSessionLocations = async (req, res) => {
  try {
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    // First, verify the session belongs to the user's organization
    const session = await DeliverySession.findByPk(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Delivery session not found"
      });
    }

    if (session.organization_id !== userOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this session"
      });
    }

    const locations = await LocationUpdate.findAll({
      where: { session_id: req.params.sessionId },
      order: [['recorded_at', 'ASC']]
    });

    res.json({ success: true, count: locations.length, data: locations });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch locations" });
  }
};

exports.getLatestLocationByOrder = async (req, res) => {
  try {
    const userOrganizationId = req.user?.organization_id;

    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: "User must belong to an organization"
      });
    }

    const session = await DeliverySession.findOne({
      where: { order_id: req.params.orderId, is_active: true, organization_id: userOrganizationId }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "No active session for this order" });
    }

    const location = await LocationUpdate.findOne({
      where: { session_id: session.id },
      order: [['recorded_at', 'DESC']]
    });

    if (!location) {
      return res.status(404).json({ success: false, message: "No location data yet for this session" });
    }

    res.json({ success: true, data: { session, location } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch latest location" });
  }
};
