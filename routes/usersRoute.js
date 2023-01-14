const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getAllUsers,
  getTop200Users,
  getUsersByLeague,
  getCurrentUserPosition,
  getTeamByUserAndByWeek,
  getWeeklyPointsByUser,
  getTotalPointsByUser,
} = require("../controllers/usersController");

router.route("/").get(authenticateUser, getTop200Users);
router.route("/all").get(authenticateUser, getAllUsers);
router.route("/showMe").get(authenticateUser, getCurrentUserPosition);
router.route("/teamByUser").get(authenticateUser, getTeamByUserAndByWeek);
router.route("/weekly").get(authenticateUser, getWeeklyPointsByUser);
router.route("/total").get(authenticateUser, getTotalPointsByUser);
router.route("/byLeague/:leagueId").get(authenticateUser, getUsersByLeague);

module.exports = router;
