const db = require("../../models");

const LocationUpdate = db.LocationUpdate;
const DeliverySession = db.DeliverySession;

exports.addLocationUpdate = async (req, res) => {
  try {
    const { session_id, latitude, longitude } = req.body;
    const parsedSessionId = Number(session_id);
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

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

    res.status(201).json({ success: true, data: update });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add location update" });
  }
};

exports.getSessionLocations = async (req, res) => {
  try {
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
    const session = await DeliverySession.findOne({
      where: { order_id: req.params.orderId, is_active: true }
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
