const express = require("express");
const router = express.Router();
const deliverySessionController = require("../controllers/deliverySessions.controller");

router.post("/start", deliverySessionController.startSession);
router.patch("/:id/end", deliverySessionController.endSession);
router.get("/order/:orderId", deliverySessionController.getSessionByOrder);

module.exports = router;