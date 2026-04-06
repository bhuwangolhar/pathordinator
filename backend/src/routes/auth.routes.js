const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/user/:email", authController.getUserByEmail);
router.post("/verify-password", authController.verifyUserPassword);

module.exports = router;
