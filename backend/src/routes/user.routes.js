const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { requireSelfOrElevated } = require("../middleware/ownership");
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/user.controller");
const { idParam, updateUserBody } = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER"), getUsers);
router.get("/:id", validate({ params: idParam }), requireSelfOrElevated, getUserById);
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate({ params: idParam, body: updateUserBody }),
  updateUser
);
router.delete("/:id", authorizeRoles("ADMIN"), validate({ params: idParam }), deleteUser);

module.exports = router;
