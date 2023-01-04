const Player = require("../models/Player");
const UserPlayer = require("../models/UserPlayer");
const UserWeek = require("../models/UserWeek");
const Week = require("../models/Week");
const Match = require("../models/Match");
const User = require("../models/User");
const Tournament = require("../models/Tournament");

const pointsSystem = require("../utils/pointsSystem");
const parseDate = require("../utils/parseDate");

const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");
const { NotFoundError } = require("../errors");

const getAll = async (req, res) => {
  const players = await Player.find({}).sort("ranking");
  res.status(StatusCodes.OK).json({ players });
};

const getAllPlayers = async (req, res) => {
  const { playerSearchItem, isBought, selected, page, itemsPerPage } = req.body;

  let players = await Player.find({}).sort("ranking");

  const userPlayers = await UserPlayer.find({
    weekId: selected.value,
    userId: req.user.userId,
  });
  let boughtPlayers = [];

  for (let i = 0; i < userPlayers.length; i++) {
    const player = players.find((p) => p.id === userPlayers[i].playerId);
    boughtPlayers.push(player);
  }

  if (isBought) {
    players = boughtPlayers;
  }

  if (playerSearchItem) {
    players = players.filter((p) =>
      p.name.toLowerCase().includes(playerSearchItem.toLowerCase())
    );
  }

  const totalItems = players.length;

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  players = players.slice(start, end);

  res.status(StatusCodes.OK).json({ players, totalItems });
};

const getAllPlayersInTeam = async (req, res) => {
  const { selected } = req.body;

  let players = await Player.find({}).sort("ranking");
  const userPlayers = await UserPlayer.find({
    weekId: selected.value,
    userId: req.user.userId,
  });

  let boughtPlayers = [];

  for (let i = 0; i < userPlayers.length; i++) {
    const player = players.find((p) => p.id === userPlayers[i].playerId);
    boughtPlayers.push({
      _id: player._id,
      id: player.id,
      name: player.name,
      country: player.country,
      points: player.points,
      ranking: player.ranking,
      price: player.price,
      imageUrl: player.imageUrl,
      gender: player.gender,
      pointsWon: userPlayers[i].pointsWon,
      balls: userPlayers[i].balls,
    });
  }

  players = boughtPlayers;

  res.status(StatusCodes.OK).json({ players });
};

const getSinglePlayer = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(StatusCodes.OK).json({});
  }

  const player = await Player.findOne({ id: Number(id) });
  if (!player) {
    throw new NotFoundError("Player does not exist");
  }

  res.status(StatusCodes.OK).json({ player });
};

const getSinglePlayerMatches = async (req, res) => {
  const { id } = req.params;
  let matches = await Match.find({
    $or: [
      { homeId: { $eq: id } },
      {
        awayId: { $eq: id },
      },
    ],
  });

  const players = await Player.find({});
  const tournaments = await Tournament.find({});
  const player = players.find((player) => player.id === Number(id));

  matches = matches.map((match) => {
    const homePlayer = players.find((player) => player.id === match.homeId);
    const awayPlayer = players.find((player) => player.id === match.awayId);
    const tournament = tournaments.find(
      (tournament) => tournament.id === match.tournamentId
    );
    return {
      ...match._doc,
      tournament: { ...tournament._doc },
      homePlayer: { ...homePlayer._doc },
      awayPlayer: { ...awayPlayer._doc },
    };
  });

  res.status(StatusCodes.OK).json({ player, matches });
};

const addPlayerInTeam = async (req, res) => {
  const { playerId, weekId } = req.body;
  const { userId } = req.user;

  const week = await Week.findOne({ _id: weekId });

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const userPlayers = await UserPlayer.find({ weekId, userId });
  if (userPlayers.length >= 8) {
    throw new BadRequestError("You already have 8 players in your team!");
  }

  const userPlayer = await UserPlayer.findOne({ playerId, weekId, userId });

  if (userPlayer) {
    throw new BadRequestError("Player is already present in your team!");
  }

  const player = await Player.findOne({ id: playerId });
  const userWeek = await UserWeek.findOne({ userId, weekId });

  if (player.price > userWeek.balance) {
    throw new BadRequestError(
      "You do not have enough money to buy this player!"
    );
  }

  // check for date

  const playerInTeam = await UserPlayer.create({
    playerId,
    weekId,
    userId,
    pointsWon: 0,
    balls: 1,
  });

  await UserWeek.findOneAndUpdate(
    { userId, weekId },
    { balance: userWeek.balance - player.price },
    { runValidators: true }
  );

  res
    .status(StatusCodes.CREATED)
    .json({ playerInTeam, msg: "Player added successfully to your team!" });
};

const deletePlayerInTeam = async (req, res) => {
  const { playerId, weekId } = req.query;
  const { userId } = req.user;

  const week = await Week.findOne({ _id: weekId });

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const userPlayer = await UserPlayer.findOneAndRemove({
    playerId,
    weekId,
    userId,
  });

  if (!userPlayer) {
    throw new NotFoundError("User player does not exist!");
  }

  const player = await Player.findOne({ id: playerId });
  const userWeek = await UserWeek.findOne({ userId, weekId });

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  await UserWeek.findOneAndUpdate(
    { userId, weekId },
    {
      balance: userWeek.balance + player.price,
      balls: userWeek.balls + (userPlayer.balls - 1),
      points: userWeek.points - userPlayer.pointsWon,
    },
    { runValidators: true }
  );

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  await User.findOneAndUpdate(
    { _id: userId },
    { points: user.points - userPlayer.pointsWon },
    { runValidators: true }
  );

  res.status(StatusCodes.OK).send();
};

const addBallToUserPlayer = async (req, res) => {
  const { playerId, weekId } = req.body;
  const { userId } = req.user;

  const week = await Week.findOne({ _id: weekId });

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const userWeek = await UserWeek.findOne({ weekId, userId });

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  if (userWeek.balls <= 0) {
    throw new BadRequestError("You do not have tennis balls anymore!");
  }

  const oldUserPlayer = await UserPlayer.findOne({
    playerId,
    weekId,
    userId,
  });

  if (!oldUserPlayer) {
    throw new NotFoundError("User player does not exist!");
  }

  if (oldUserPlayer.balls >= 3) {
    throw new BadRequestError("Max. tennis balls per player is 3!");
  }

  const userPlayer = await UserPlayer.findOneAndUpdate(
    {
      playerId,
      weekId,
      userId,
    },
    { balls: oldUserPlayer.balls + 1 },
    { runValidators: true, new: true }
  );

  await UserWeek.findOneAndUpdate(
    { weekId, userId },
    { balls: userWeek.balls - 1 },
    { runValidators: true }
  );

  res.status(StatusCodes.OK).json({ userPlayer });
};

const deleteBallFromUserPlayer = async (req, res) => {
  const { playerId, weekId } = req.body;
  const { userId } = req.user;

  const week = await Week.findOne({ _id: weekId });

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }
  const start = new Date(week.from);
  const current = new Date();

  if (current >= start) {
    throw new BadRequestError("Deadline passed!");
  }

  const oldUserPlayer = await UserPlayer.findOne({
    playerId,
    weekId,
    userId,
  });

  if (!oldUserPlayer) {
    throw new NotFoundError("User player does not exist!");
  }

  if (oldUserPlayer.balls <= 1) {
    throw new BadRequestError("Min. tennis balls per player is 1!");
  }

  const userPlayer = await UserPlayer.findOneAndUpdate(
    {
      playerId,
      weekId,
      userId,
    },
    { balls: oldUserPlayer.balls - 1 },
    { runValidators: true, new: true }
  );

  const userWeek = await UserWeek.findOne({ weekId, userId });

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  await UserWeek.findOneAndUpdate(
    { weekId, userId },
    { balls: userWeek.balls + 1 },
    { runValidators: true }
  );

  res.status(StatusCodes.OK).json({ userPlayer });
};

const calculatePointsForUserPlayers = async (req, res) => {
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

  const userPlayers = await UserPlayer.find({ weekId, userId });
  let weeklyPoints = 0;

  for (let i = 0; i < userPlayers.length; i++) {
    const userPlayer = userPlayers[i];
    const { _id, balls } = userPlayer;

    let homeMatches = await Match.find({
      homeId: userPlayer.playerId,
      round: "n/a",
    });
    homeMatches = homeMatches.filter(
      (m) => new Date(m.date) >= start && new Date(m.date) <= end
    );

    let awayMatches = await Match.find({
      awayId: userPlayer.playerId,
      round: "n/a",
    });
    awayMatches = awayMatches.filter(
      (m) => new Date(m.date) >= start && new Date(m.date) <= end
    );

    let homePoints = 0;
    let awayPoints = 0;

    for (let j = 0; j < homeMatches.length; j++) {
      const homeMatch = homeMatches[j];

      let {
        homeSets,
        homeSet1,
        homeSet2,
        homeSet3,
        homeSet4,
        homeSet5,
        homeAces,
        homeUnforcedErrors,
        homeDoubleFaults,
        homeWinners,
      } = homeMatch;

      if (homeSet3 === "n/a") {
        homeSet3 = 0;
      }

      if (homeSet4 === "n/a") {
        homeSet4 = 0;
      }

      if (homeSet5 === "n/a") {
        homeSet5 = 0;
      }

      const pointsForWin =
        homeMatch.winnerId === userPlayer.playerId ? pointsSystem.MATCH : 0;

      homePoints +=
        Number(homeSets) * pointsSystem.SET +
        Number(homeSet1) * pointsSystem.GAME +
        Number(homeSet2) * pointsSystem.GAME +
        Number(homeSet3) * pointsSystem.GAME +
        Number(homeSet4) * pointsSystem.GAME +
        Number(homeSet5) * pointsSystem.GAME +
        Number(homeAces) * pointsSystem.ACE +
        Number(homeUnforcedErrors) * pointsSystem.UNFORCED_ERROR +
        Number(homeDoubleFaults) * pointsSystem.DOUBLE_FAULT +
        Number(homeWinners) * pointsSystem.WINNER +
        pointsForWin;
    }

    for (let j = 0; j < awayMatches.length; j++) {
      const awayMatch = awayMatches[j];

      let {
        awaySets,
        awaySet1,
        awaySet2,
        awaySet3,
        awaySet4,
        awaySet5,
        awayAces,
        awayUnforcedErrors,
        awayDoubleFaults,
        awayWinners,
      } = awayMatch;

      if (awaySet3 === "n/a") {
        awaySet3 = 0;
      }

      if (awaySet4 === "n/a") {
        awaySet4 = 0;
      }

      if (awaySet5 === "n/a") {
        awaySet5 = 0;
      }

      const pointsForWin =
        awayMatch.winnerId === userPlayer.playerId ? pointsSystem.MATCH : 0;

      awayPoints +=
        Number(awaySets) * pointsSystem.SET +
        Number(awaySet1) * pointsSystem.GAME +
        Number(awaySet2) * pointsSystem.GAME +
        Number(awaySet3) * pointsSystem.GAME +
        Number(awaySet4) * pointsSystem.GAME +
        Number(awaySet5) * pointsSystem.GAME +
        Number(awayAces) * pointsSystem.ACE +
        Number(awayUnforcedErrors) * pointsSystem.UNFORCED_ERROR +
        Number(awayDoubleFaults) * pointsSystem.DOUBLE_FAULT +
        Number(awayWinners) * pointsSystem.WINNER +
        pointsForWin;
    }

    const totalPoints = (homePoints + awayPoints) * balls;
    weeklyPoints += totalPoints;

    await UserPlayer.findOneAndUpdate(
      { _id },
      { pointsWon: totalPoints },
      { runValidators: true }
    );
  }

  const userWeek = await UserWeek.findOneAndUpdate(
    { userId, weekId },
    { points: weeklyPoints },
    { runValidators: true, new: true }
  );

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  res.status(StatusCodes.OK).json({ userWeek, weeklyPoints });
};

const calculateTotalPoints = async (req, res) => {
  const { userId } = req.user;

  const userPlayers = await UserPlayer.find({ userId });
  let totalPoints = 0;

  for (let i = 0; i < userPlayers.length; i++) {
    const userPlayer = userPlayers[i];
    const { pointsWon } = userPlayer;

    totalPoints += pointsWon;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { points: totalPoints },
    { runValidators: true, new: true }
  );

  if (!updatedUser) {
    throw new NotFoundError("User does not exist!");
  }

  res.status(StatusCodes.OK).json({ updatedUser, totalPoints });
};

const getWeeklyPoints = async (req, res) => {
  const { weekId } = req.query;
  const { userId } = req.user;

  const userWeek = await UserWeek.findOne({ userId, weekId });

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  const { points } = userWeek;

  res.status(StatusCodes.OK).json({ points });
};

const getTotalPoints = async (req, res) => {
  const { userId } = req.user;

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { points } = user;

  res.status(StatusCodes.OK).json({ points });
};

module.exports = {
  getAll,
  getAllPlayers,
  getAllPlayersInTeam,
  getSinglePlayer,
  getSinglePlayerMatches,
  addPlayerInTeam,
  deletePlayerInTeam,
  addBallToUserPlayer,
  deleteBallFromUserPlayer,
  calculatePointsForUserPlayers,
  calculateTotalPoints,
  getWeeklyPoints,
  getTotalPoints,
};
