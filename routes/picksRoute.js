const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");
const {
  havePickBeenMade,
  createPick,
  getWeeklyBracketPoints,
  getTotalBracketPoints,
  calculateWeeklyBracketPoints,
  calculateTotalBracketPoints,
} = require("../controllers/picksController");

router.route("/haveBeenMade").get(authenticateUser, havePickBeenMade);
router.route("/").post(authenticateUser, createPick);

router
  .route("/calculateWeekly")
  .get(authenticateUser, getWeeklyBracketPoints)
  .patch(authenticateUser, calculateWeeklyBracketPoints);

router
  .route("/calculateTotal")
  .get(authenticateUser, getTotalBracketPoints)
  .patch(authenticateUser, calculateTotalBracketPoints);

module.exports = router;
