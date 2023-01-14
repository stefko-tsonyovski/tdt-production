const User = require("../models/User");
const UserPlayer = require("../models/UserPlayer");
const UserWeek = require("../models/UserWeek");
const Player = require("../models/Player");
const League = require("../models/League");

const { NotFoundError } = require("../errors");
const { StatusCodes } = require("http-status-codes");

const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" });
  res.status(StatusCodes.OK).json({ users });
};

const getTop200Users = async (req, res) => {
  let users = await User.find({ role: "user" });
  users = users
    .sort((a, b) => {
      const {
        points: pointsA,
        bracketPoints: bracketPointsA,
        socialPoints: socialPointsA,
        leaguePoints: leaguePointsA,
        firstName: firstNameA,
        lastName: lastNameA,
      } = a;
      const {
        points: pointsB,
        bracketPoints: bracketPointsB,
        socialPoints: socialPointsB,
        leaguePoints: leaguePointsB,
        firstName: firstNameB,
        lastName: lastNameB,
      } = b;

      const totalPointsA =
        pointsA + bracketPointsA + socialPointsA + leaguePointsA;
      const totalPointsB =
        pointsB + bracketPointsB + socialPointsB + leaguePointsB;

      const fullNameA = firstNameA + lastNameA;
      const fullNameB = firstNameB + lastNameB;

      if (totalPointsA > totalPointsB) {
        return -1;
      } else if (totalPointsA < totalPointsB) {
        return 1;
      } else {
        if (fullNameA > fullNameB) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .slice(0, 200)
    .map((user, index) => {
      const { points, bracketPoints, socialPoints, leaguePoints } = user;

      const resultUser = {
        ...user._doc,
        position: index + 1,
        totalPoints: points + bracketPoints + socialPoints + leaguePoints,
      };

      return resultUser;
    });

  res.status(StatusCodes.OK).json({ users });
};

const getUsersByLeague = async (req, res) => {
  const { leagueId } = req.params;
  const { searchTerm } = req.query;

  const league = await League.findOne({ _id: leagueId });

  if (!league) {
    throw new NotFoundError("League does not exist!");
  }

  let users = await User.find({ role: "user", leagueId });

  if (searchTerm) {
    users = users.filter((u) =>
      (u.firstName + " " + u.lastName)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }

  users = users
    .sort((a, b) => {
      const {
        points: pointsA,
        bracketPoints: bracketPointsA,
        socialPoints: socialPointsA,
        leaguePoints: leaguePointsA,
        firstName: firstNameA,
        lastName: lastNameA,
      } = a;
      const {
        points: pointsB,
        bracketPoints: bracketPointsB,
        socialPoints: socialPointsB,
        leaguePoints: leaguePointsB,
        firstName: firstNameB,
        lastName: lastNameB,
      } = b;

      const totalPointsA =
        pointsA + bracketPointsA + socialPointsA + leaguePointsA;
      const totalPointsB =
        pointsB + bracketPointsB + socialPointsB + leaguePointsB;

      const fullNameA = firstNameA + lastNameA;
      const fullNameB = firstNameB + lastNameB;

      if (totalPointsA > totalPointsB) {
        return -1;
      } else if (totalPointsA < totalPointsB) {
        return 1;
      } else {
        if (fullNameA > fullNameB) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .slice(0, 200)
    .map((user, index) => {
      const { points, bracketPoints, socialPoints, leaguePoints } = user;

      const resultUser = {
        ...user._doc,
        position: index + 1,
        totalPoints: points + bracketPoints + socialPoints + leaguePoints,
        leagueCreatorId: league.creatorId,
      };

      return resultUser;
    });

  res.status(StatusCodes.OK).json({
    users,
    leagueName: league.name,
    leagueCreatorId: league.creatorId,
  });
};

const getCurrentUserPosition = async (req, res) => {
  const { userId } = req.user;
  let users = await User.find({ role: "user" });
  users = users
    .sort((a, b) => {
      const {
        points: pointsA,
        bracketPoints: bracketPointsA,
        socialPoints: socialPointsA,
        leaguePoints: leaguePointsA,
        firstName: firstNameA,
        lastName: lastNameA,
      } = a;
      const {
        points: pointsB,
        bracketPoints: bracketPointsB,
        socialPoints: socialPointsB,
        leaguePoints: leaguePointsB,
        firstName: firstNameB,
        lastName: lastNameB,
      } = b;

      const totalPointsA =
        pointsA + bracketPointsA + socialPointsA + leaguePointsA;
      const totalPointsB =
        pointsB + bracketPointsB + socialPointsB + leaguePointsB;

      const fullNameA = firstNameA + lastNameA;
      const fullNameB = firstNameB + lastNameB;

      if (totalPointsA > totalPointsB) {
        return -1;
      } else if (totalPointsA < totalPointsB) {
        return 1;
      } else {
        if (fullNameA > fullNameB) {
          return 1;
        } else {
          return -1;
        }
      }
    })
    .map((user, index) => {
      const { points, bracketPoints, socialPoints, leaguePoints } = user;

      const resultUser = {
        ...user._doc,
        position: index + 1,
        totalPoints: points + bracketPoints + socialPoints + leaguePoints,
      };

      return resultUser;
    });

  const currentUser = await User.findOne({ _id: userId });

  const result = users.find(
    (u) => u._id.toString() === currentUser._id.toString()
  );

  const leagues = await League.find({}).sort("-points");
  const league = await League.findOne({ _id: currentUser.leagueId });

  const leagueIndex = league
    ? leagues.findIndex((l) => l.name === league.name)
    : -1;

  res.status(StatusCodes.OK).json({
    ...result,
    leaguePosition: leagueIndex + 1,
    leagueId: league?._id,
  });
};

const getTeamByUserAndByWeek = async (req, res) => {
  const { userId, weekId } = req.query;

  let players = await Player.find({}).sort("ranking");
  const userPlayers = await UserPlayer.find({
    userId,
    weekId,
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

const getWeeklyPointsByUser = async (req, res) => {
  const { userId, weekId } = req.query;

  const userWeek = await UserWeek.findOne({ userId, weekId });

  if (!userWeek) {
    throw new NotFoundError("User week does not exist!");
  }

  const { points } = userWeek;

  res.status(StatusCodes.OK).json({ points });
};

const getTotalPointsByUser = async (req, res) => {
  const { userId } = req.query;

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError("User does not exist!");
  }

  const { points } = user;

  res.status(StatusCodes.OK).json({ points });
};

module.exports = {
  getAllUsers,
  getTop200Users,
  getUsersByLeague,
  getCurrentUserPosition,
  getTeamByUserAndByWeek,
  getWeeklyPointsByUser,
  getTotalPointsByUser,
};
