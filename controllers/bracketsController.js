const Bracket = require("../models/Bracket");
const Tournament = require("../models/Tournament");
const Round = require("../models/Round");
const Player = require("../models/Player");

const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");

const getAllBrackets = async (req, res) => {
  const brackets = await Bracket.find({});
  res.status(StatusCodes.OK).json({ brackets });
};

const getAllBracketsByTournamentId = async (req, res) => {
  const { tournamentId } = req.query;

  const brackets = await Bracket.find({
    tournamentId: Number(tournamentId),
  });
  res.status(StatusCodes.OK).json({ brackets });
};

const getAllBracketsByTournamentIdAndRoundId = async (req, res) => {
  const { tournamentId, roundId } = req.query;

  let brackets = await Bracket.find({
    tournamentId: Number(tournamentId),
    roundId,
  }).lean();
  let resultBrackets = [];

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];

    const homePlayer = await Player.findOne({ id: bracket.homeId }).lean();
    const awayPlayer = await Player.findOne({ id: bracket.awayId }).lean();

    const finalBracket = {
      ...bracket,
      homePlayer,
      awayPlayer,
    };

    resultBrackets.push(finalBracket);
  }

  res.status(StatusCodes.OK).json({ brackets: resultBrackets });
};

const createBracket = async (req, res) => {
  const { connectedBracketId } = req.body;

  const bracketsByConnectedId = await Bracket.find({ connectedBracketId });

  if (connectedBracketId && bracketsByConnectedId.length >= 2) {
    throw new BadRequestError(
      "You cannot have more than 2 brackets attached to a given bracket!"
    );
  }

  const bracket = await Bracket.create({ ...req.body });
  res.status(StatusCodes.CREATED).json({ bracket });
};

const getBracket = async (req, res) => {
  const { id } = req.params;

  const bracket = await Bracket.findOne({ _id: id });

  if (!bracket) {
    throw new NotFoundError("Bracket does not exist!");
  }

  const tournament = await Tournament.findOne({ id: bracket.tournamentId });

  if (!tournament) {
    throw new NotFoundError("Tournament does not exist!");
  }

  const round = await Round.findOne({ _id: bracket.roundId });

  if (!round) {
    throw new NotFoundError("Round does not exist!");
  }

  const homePlayer = await Player.findOne({ id: bracket.homeId });

  const awayPlayer = await Player.findOne({ id: bracket.awayId });

  const winnerPlayer = await Player.findOne({ id: bracket.winnerId });

  console.log(bracket);

  res.status(StatusCodes.OK).json({
    bracket,
    tournament,
    round,
    homePlayer,
    awayPlayer,
    winnerPlayer,
  });
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
  getAllBracketsByTournamentId,
  getAllBracketsByTournamentIdAndRoundId,
  createBracket,
  getBracket,
  updateBracket,
};
