const express = require("express");
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const {
  getAllBrackets,
  getAllBracketsByTournamentIdAndRoundId,
  createBracket,
  updateBracket,
} = require("../controllers/bracketsController");

router
  .route("/")
  .get(authenticateUser, getAllBrackets)
  .post(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    createBracket
  );

router
  .route("/:id")
  .patch(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    updateBracket
  );

router
  .route("/byTournamentAndRound")
  .get(authenticateUser, getAllBracketsByTournamentIdAndRoundId);

module.exports = router;
