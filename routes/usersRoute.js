const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getTop200Users,
  getCurrentUserPosition,
} = require("../controllers/usersController");

router.route("/").get(authenticateUser, getTop200Users);
router.route("/showMe").get(authenticateUser, getCurrentUserPosition);

module.exports = router;
