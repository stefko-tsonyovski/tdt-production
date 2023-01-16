const User = require("../models/User");
const UserWeek = require("../models/UserWeek");
const Week = require("../models/Week");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendResetPasswordEmail,
  sendVerificationEmail,
  createHash,
} = require("../utils");
const crypto = require("crypto");

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

  const verificationToken = crypto.randomBytes(40).toString("hex");

  const userName = firstName + lastName;
  const origin = "http://localhost:3000";

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    points: 0,
    bracketPoints: 0,
    socialPoints: 0,
    leaguePoints: 0,
    predictionPoints: 100,
    trades: 60,
    verificationToken,
  });

  await sendVerificationEmail({
    name: userName,
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  });

  for (let i = 0; i < weeks.length; i++) {
    await UserWeek.create({
      userId: user._id,
      weekId: weeks[i]._id,
      balls: 10,
      balance: 80000000,
      points: 0,
      bracketPoints: 0,
    });
  }

  // const tokenUser = createTokenUser(user);
  // attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.CREATED).json({
    msg: "Success! Please check your email to verify account",
  });
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

  if (!user.isVerified) {
    throw new CustomError.UnauthenticatedError("Please verify your email");
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

const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }

  if (user.verificationToken !== verificationToken) {
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = "";

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Email verified" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError("Please provide valid email");
  }

  const user = await User.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");
    // send email

    const userName = user.firstName + " " + user.lastName;
    await sendResetPasswordEmail({
      name: userName,
      email: user.email,
      token: passwordToken,
      origin: "http://localhost:3000",
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    await User.findOneAndUpdate(
      { email },
      { passwordToken: createHash(passwordToken), passwordTokenExpirationDate }
    );
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Please check your email for reset password link" });
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    throw new CustomError.BadRequestError("Please provide all values");
  }

  const user = await User.findOne({ email });

  if (user) {
    const currentDate = new Date();

    if (
      createHash(token) === user.passwordToken &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;

      await user.save();
    }
  }

  res.status(StatusCodes.OK).json({ msg: "password was reset" });
};

module.exports = {
  register,
  login,
  logout,
  showCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
