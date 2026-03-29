const express = require("express");
const router = express.Router();
const locationUpdateController = require("../controllers/locationUpdates.controller");

router.post("/", locationUpdateController.addLocationUpdate);
router.get("/session/:sessionId", locationUpdateController.getSessionLocations);
router.get("/order/:orderId/latest", locationUpdateController.getLatestLocationByOrder);

module.exports = router;