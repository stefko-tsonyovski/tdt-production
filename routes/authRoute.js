const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  showCurrentUser,
} = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authentication");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/showMe", authenticateUser, showCurrentUser);

module.exports = router;
