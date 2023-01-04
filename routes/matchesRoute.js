const express = require("express");
const router = express.Router();

const {
  createMatch,
  getSingleMatch,
} = require("../controllers/matchesController");
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

router
  .route("/")
  .post(authenticateUser, authorizePermissions("admin", "owner"), createMatch);

router.route("/:id").get(authenticateUser, getSingleMatch);

module.exports = router;
