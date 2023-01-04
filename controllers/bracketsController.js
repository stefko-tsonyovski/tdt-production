const Bracket = require("../models/Bracket");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors");

const getAllBrackets = async (req, res) => {
  const brackets = await Bracket.find({});
  res.status(StatusCodes.OK).json({ brackets });
};

const getAllBracketsByTournamentIdAndRoundId = async (req, res) => {
  const { tournamentId, roundId } = req.query;

  const brackets = await Bracket.find({
    tournamentId: Number(tournamentId),
    roundId,
  });
  res.status(StatusCodes.OK).json({ brackets });
};

const createBracket = async (req, res) => {
  const bracket = await Bracket.create({ ...req.body });
  res.status(StatusCodes.CREATED).json({ bracket });
};

const updateBracket = async (req, res) => {
  const { id } = req.params;

  const bracket = await Bracket.findOneAndUpdate(
    { _id: id },
    { ...req.body },
    { runValidators: true, new: true }
  );

  if (!bracket) {
    throw new NotFoundError("Bracket does not exist!");
  }

  res.status(StatusCodes.OK).json({ bracket });
};

module.exports = {
  getAllBrackets,
  getAllBracketsByTournamentIdAndRoundId,
  createBracket,
  updateBracket,
};
