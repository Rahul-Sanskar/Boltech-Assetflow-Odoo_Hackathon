const express = require("express");
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/user.controller");
const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
