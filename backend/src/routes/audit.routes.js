const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  getAuditCycles,
  getAuditCycleById,
  createAuditCycle,
  assignAuditor,
  addAuditItem,
  updateAuditItem,
  updateAuditCycle
} = require("../controllers/audit.controller");
const {
  idParam,
  itemIdParam,
  createAuditBody,
  updateAuditBody,
  assignAuditorBody,
  addAuditItemBody,
  updateAuditItemBody
} = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), getAuditCycles);
router.get(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam }),
  getAuditCycleById
);
router.post("/", authorizeRoles("ADMIN"), validate({ body: createAuditBody }), createAuditCycle);
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate({ params: idParam, body: updateAuditBody }),
  updateAuditCycle
);
router.post(
  "/:id/assign",
  authorizeRoles("ADMIN"),
  validate({ params: idParam, body: assignAuditorBody }),
  assignAuditor
);
router.post(
  "/:id/items",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ params: idParam, body: addAuditItemBody }),
  addAuditItem
);
router.patch(
  "/:id/items/:itemId",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ params: itemIdParam, body: updateAuditItemBody }),
  updateAuditItem
);

module.exports = router;
