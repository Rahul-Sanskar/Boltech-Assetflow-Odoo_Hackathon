const express = require("express");
const { signup, login } = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { loginBody, signupBody } = require("../validators/schemas");

const router = express.Router();

router.post("/signup", validate({ body: signupBody }), signup);
router.post("/login", validate({ body: loginBody }), login);

module.exports = router;
