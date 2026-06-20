const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settings.controller");

router.get("/admin/settings", settingsController.getSettings);
router.patch("/admin/settings", settingsController.updateSettings);

router.get("/admin/restaurant-tables", settingsController.getAdminTables);
router.post("/admin/restaurant-tables", settingsController.createTable);
router.patch("/admin/restaurant-tables/:id", settingsController.updateTable);
router.patch(
  "/admin/restaurant-tables/:id/regenerate-token",
  settingsController.regenerateTableToken
);

router.get(
  "/public/table/:number/:token",
  settingsController.validatePublicTable
);

module.exports = router;