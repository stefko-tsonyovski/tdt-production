const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  getAll,
  getAllPlayers,
  getAllPlayersInTeam,
  addPlayerInTeam,
  deletePlayerInTeam,
  addBallToUserPlayer,
  deleteBallFromUserPlayer,
  calculatePointsForUserPlayers,
  calculateTotalPoints,

  getWeeklyPoints,
  getTotalPoints,

  getSinglePlayer,
  getSinglePlayerMatches,
} = require("../controllers/playersController");

router.route("/").post(authenticateUser, getAllPlayers).get(getAll);

router
  .route("/team")
  .post(authenticateUser, getAllPlayersInTeam)
  .delete(authenticateUser, deletePlayerInTeam);

router.route("/add").post(authenticateUser, addPlayerInTeam);
router.route("/addBall").patch(authenticateUser, addBallToUserPlayer);
router.route("/deleteBall").patch(authenticateUser, deleteBallFromUserPlayer);

router
  .route("/calculateWeekly")
  .get(authenticateUser, getWeeklyPoints)
  .patch(authenticateUser, calculatePointsForUserPlayers);

router
  .route("/calculateTotal")
  .get(authenticateUser, getTotalPoints)
  .patch(authenticateUser, calculateTotalPoints);

router.route("/calculateTotal").patch(authenticateUser, calculateTotalPoints);
router.route("/:id").get(authenticateUser, getSinglePlayer);
router.route("/:id/matches").get(authenticateUser, getSinglePlayerMatches);

module.exports = router;
