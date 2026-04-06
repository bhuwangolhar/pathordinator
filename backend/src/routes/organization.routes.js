const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization.controller");

router.post("/:organization_id/users", organizationController.addUserToOrganization);
router.get("/:organization_id/users", organizationController.getOrganizationUsers);
router.get("/:organization_id", organizationController.getOrganizationDetails);
router.put("/:organization_id/users/:user_id/deactivate", organizationController.deactivateOrgUser);
router.put("/:organization_id/users/:user_id/activate", organizationController.activateOrgUser);

module.exports = router;
