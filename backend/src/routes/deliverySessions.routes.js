const express = require("express");
const router = express.Router();
const deliverySessionController = require("../controllers/deliverySessions.controller");
const authenticateToken = require("../middleware/authenticate");

router.post("/start", authenticateToken, deliverySessionController.startSession);
router.patch("/:id/end", authenticateToken, deliverySessionController.endSession);
router.get("/order/:orderId", authenticateToken, deliverySessionController.getSessionByOrder);

module.exports = router;