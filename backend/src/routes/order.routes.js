const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const authenticateToken = require("../middleware/authenticate");

router.get("/", authenticateToken, orderController.getOrders);
router.get("/:id", authenticateToken, orderController.getOrderById);
router.post("/", authenticateToken, orderController.createOrder);
router.patch("/:id/status", authenticateToken, orderController.updateOrderStatus);

module.exports = router;