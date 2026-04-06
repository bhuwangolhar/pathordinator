const express = require("express");
const router = express.Router();
const locationUpdateController = require("../controllers/locationUpdates.controller");
const authenticateToken = require("../middleware/authenticate");

router.post("/", authenticateToken, locationUpdateController.addLocationUpdate);
router.get("/session/:sessionId", authenticateToken, locationUpdateController.getSessionLocations);
router.get("/order/:orderId/latest", authenticateToken, locationUpdateController.getLatestLocationByOrder);

module.exports = router;