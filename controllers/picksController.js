const Pick = require("../models/Pick");
const Bracket = require("../models/Bracket");
const Tournament = require("../models/Tournament");
const Week = require("../models/Week");
const Round = require("../models/Round");
const UserWeek = require("../models/UserWeek");
const User = require("../models/User");

const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");

const havePickBeenMade = async (req, res) => {
  const { bracketId } = req.query;
  const { userId } = req.user;

  const pick = await Pick.findOne({ userId, bracketId });

  if (!pick) {
    return res.status(StatusCodes.OK).json({ haveBeenMade: false });
  }

  res.status(StatusCodes.OK).json({ haveBeenMade: true, pick });
};

const createPick = async (req, res) => {
  const { bracketId, playerId } = req.body;
  const { userId } = req.user;

  const bracket = await Bracket.findOne({ _id: bracketId });

  if (!bracket) {
    throw new NotFoundError("Bracket not found!");
  }

  const tournament = await Tournament.findOne({ id: bracket.tournamentId });

  if (!tournament) {
    throw new NotFoundError("Tournament not found!");
  }

  const week = await Week.findOne({ _id: tournament.weekId });

  if (!week) {
    throw new NotFoundError("Week not found!");
  }

  // UNCOMMENT IN PRODUCTION !!!!!!

  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const pickExists = await Pick.findOne({ bracketId, playerId, userId });

  if (pickExists) {
    throw new BadRequestError("Pick already exists!");
  }

  const pick = await Pick.create({ bracketId, playerId, userId });

  const connectedBracket = await Bracket.findOne({
    _id: bracket.connectedBracketId,
  });

  if (!connectedBracket) {
    throw new NotFoundError("Bracket not found!");
  }

  if (!connectedBracket.homeId) {
    await Bracket.findOneAndUpdate(
      { _id: connectedBracket._id },
      { homeId: playerId },
      { runValidators: true }
    );
  } else {
    await Bracket.findOneAndUpdate(
      { _id: connectedBracket._id },
      { awayId: playerId },
      { runValidators: true }
    );
  }

  res.status(StatusCodes.CREATED).json({ pick });
};

const calculateWeeklyBracketPoints = async (req, res) => {
  const { weekId } = req.body;
  const { userId } = req.user;

  const week = await Week.findOne({ _id: weekId });

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const end = new Date(week.to);
  const current = new Date();

  // UNCOMMENT IN PRODUCTION

  // if (!(current >= start && current <= end)) {
  //   throw new BadRequestError("You cannot update points for this week yet!");
  // }

  let tournaments = await Tournament.find({ weekId });
  tournaments = tournaments.filter(
    (t) => current >= new Date(t.startDate) && current <= new Date(t.endDate)
  );

  let weeklyPoints = 0;

  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];
    const { id } = tournament;

    const brackets = await Bracket.find({ tournamentId: id });

    for (let j = 0; j < brackets.length; j++) {
      const bracket = brackets[j];
      const { winnerId, _id, roundId } = bracket;

      const round = await Round.findOne({ _id: roundId });

      if (!round) {
        throw new NotFoundError("Round not found!");
      }

      const { name: roundName } = round;

      console.log(_id);

      const picks = await Pick.find({ userId, bracketId: _id });

      for (let k = 0; k < picks.length; k++) {
        const pick = picks[k];
        const { playerId } = pick;

        if (playerId === winnerId) {
          switch (roundName) {
            case "1/64 finals":
              weeklyPoints += 5;
              break;
            case "1/32 finals":
              weeklyPoints += 10;
              break;
            case "1/16 finals":
              weeklyPoints += 20;
              break;
            case "1/8 finals":
              weeklyPoints += 40;
              break;
            case "1/4 finals":
              weeklyPoints += 80;
              break;
            case "1/2 finals":
              weeklyPoints += 160;
              break;
            case "final":
              weeklyPoints += 320;
              break;

            default:
              throw new NotFoundError("Invalid round name!");
          }
        }
      }
    }

    const userWeek = await UserWeek.findOneAndUpdate(
      { userId, weekId },
      { bracketPoints: weeklyPoints },
      { runValidators: true, new: true }
    );

    if (!userWeek) {
      throw new NotFoundError("User week does not exist!");
    }

    res.status(StatusCodes.OK).json({ userWeek, weeklyPoints });
  }
};

const getWeeklyBracketPoints = async (req, res) => {
  const { weekId } = req.query;
  const { userId } = req.user;

  const userWeek = await UserWeek.findOne({ userId, weekId });

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  const { bracketPoints } = userWeek;

  res.status(StatusCodes.OK).json({ bracketPoints });
};

const calculateTotalBracketPoints = async (req, res) => {
  const { userId } = req.user;

  const currentDate = new Date();
  const userWeeks = await UserWeek.find({ userId });
  let totalBracketPoints = 0;

  for (let i = 0; i < userWeeks.length; i++) {
    const userWeek = userWeeks[i];
    const { bracketPoints } = userWeek;

    totalBracketPoints += bracketPoints;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { bracketPoints: totalBracketPoints },
    { runValidators: true, new: true }
  );

  if (!updatedUser) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ updatedUser, totalBracketPoints });
};

const getTotalBracketPoints = async (req, res) => {
  const { userId } = req.user;

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { bracketPoints } = user;

  res.status(StatusCodes.OK).json({ bracketPoints });
};

module.exports = {
  havePickBeenMade,
  createPick,
  calculateWeeklyBracketPoints,
  calculateTotalBracketPoints,
  getWeeklyBracketPoints,
  getTotalBracketPoints,
};
