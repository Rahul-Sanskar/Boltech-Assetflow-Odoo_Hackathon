const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  requireAssetDepartmentAccess,
  enforceManagerDepartmentOnBody
} = require("../middleware/ownership");
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
} = require("../controllers/asset.controller");
const {
  idParam,
  createAssetBody,
  updateAssetBody,
  assetQuery
} = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), validate({ query: assetQuery }), getAssets);
router.get("/:id", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), validate({ params: idParam }), getAssetById);
router.post(
  "/",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ body: createAssetBody }),
  enforceManagerDepartmentOnBody("departmentId"),
  createAsset
);
router.patch(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ params: idParam, body: updateAssetBody }),
  requireAssetDepartmentAccess,
  enforceManagerDepartmentOnBody("departmentId"),
  updateAsset
);
router.delete(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ params: idParam }),
  requireAssetDepartmentAccess,
  deleteAsset
);

module.exports = router;
