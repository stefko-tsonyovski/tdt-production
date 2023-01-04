const Round = require("../models/Round");
const { StatusCodes } = require("http-status-codes");

const getAllRounds = async (req, res) => {
  const rounds = await Round.find({});
  res.status(StatusCodes.OK).json({ rounds });
};

module.exports = {
  getAllRounds,
};
