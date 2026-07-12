const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/category.controller");
const { idParam, createCategoryBody, updateCategoryBody } = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), getCategories);
router.get("/:id", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), validate({ params: idParam }), getCategoryById);
router.post("/", authorizeRoles("ADMIN"), validate({ body: createCategoryBody }), createCategory);
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate({ params: idParam, body: updateCategoryBody }),
  updateCategory
);
router.delete("/:id", authorizeRoles("ADMIN"), validate({ params: idParam }), deleteCategory);

module.exports = router;
