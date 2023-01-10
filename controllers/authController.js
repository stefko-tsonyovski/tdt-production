const User = require("../models/User");
const UserWeek = require("../models/UserWeek");
const Week = require("../models/Week");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { attachCookiesToResponse, createTokenUser } = require("../utils");

const register = async (req, res) => {
  const { email, firstName, lastName, password } = req.body;
  const weeks = await Week.find({});

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    points: 0,
    bracketPoints: 0,
  });

  for (let i = 0; i < weeks.length; i++) {
    await UserWeek.create({
      userId: user._id,
      weekId: weeks[i]._id,
      balls: 10,
      balance: 100000000,
      points: 0,
      bracketPoints: 0,
      socialPoints: 0,
      leaguePoints: 0,
    });
  }

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.CREATED).json({ ...tokenUser });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ ...tokenUser });
};

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ ...req.user });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

module.exports = {
  register,
  login,
  logout,
  showCurrentUser,
};
