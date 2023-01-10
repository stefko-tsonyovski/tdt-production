const User = require("../models/User");

const { NotFoundError } = require("../errors");
const { StatusCodes } = require("http-status-codes");

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
  if (!currentUser) {
    throw new NotFoundError("User does not exist!");
  }

  const result = users.find((u) => u.email === currentUser.email);

  res.status(StatusCodes.OK).json({ ...result });
};

module.exports = {
  getTop200Users,
  getCurrentUserPosition,
};
