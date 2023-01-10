const express = require("express");
const router = express.Router();

const {
  sendInvitation,
  verifyInvitation,
} = require("../controllers/invitationsController");
const { authenticateUser } = require("../middleware/authentication");

router.route("/").post(authenticateUser, sendInvitation);
router.route("/verify").post(authenticateUser, verifyInvitation);

module.exports = router;
