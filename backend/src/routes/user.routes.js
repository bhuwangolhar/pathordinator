const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

router.get("/", userController.getUsers);

router.post("/", userController.createUser);

router.put("/:id/deactivate", userController.deactivateUser);

router.put("/:id/activate", userController.activateUser);

module.exports = router;