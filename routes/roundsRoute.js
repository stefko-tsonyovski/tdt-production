const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authentication");

const { getAllRounds } = require("../controllers/roundsController");

router.route("/").get(authenticateUser, getAllRounds);

module.exports = router;
