const { StatusCodes } = require("http-status-codes");
const { sendEmail } = require("../utils/email");
const { sendByGrid } = require("../utils/sendgrid");

const SOCIAL_POINTS = 5;

const Invitation = require("../models/Invitation");
const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../errors");
const User = require("../models/User");

const msg = {
  to: "",
  from: "mern.developers03@gmail.com",
  subject: "JOIN THE GAME",
  text: "",
  html: `
  <p>Join the fun Tennis Dream Team Game.<br> By clicking on the link you will be redirected to the website. <br> 
  Verifying the email invitation you help your sender receive 5 points. <br> 
  You can try the same and receive points (per verified invitation)</p>
  <a href="https://pink-doubtful-goat.cyclic.app/">TennisDreamTeam<a>`,
};

const sendInvitation = async (req, res) => {
  const { receiver: receiverEmail } = req.body;
  const { userId } = req.user;
  const sender = await User.findOne({ _id: userId });
  const receiver = await User.findOne({ email: receiverEmail });

  if (!sender) {
    throw new NotFoundError(`Not found user with user id: ${userId}`);
  }

  if (sender.email === receiverEmail) {
    throw new BadRequestError("Cannot send email to yourself");
  }

  if (receiver) {
    throw new BadRequestError("Cannot send email to an existing users");
  }

  msg.to = receiverEmail;
  sendEmail(msg);
  sendByGrid(msg);

  await Invitation.create({
    senderId: userId,
    receiverEmail,
  });

  res.status(StatusCodes.OK).send();
};

const verifyInvitation = async (req, res) => {
  const { invitationId } = req.body;
  const { userId } = req.user;
  const receiver = await User.findOne({ _id: userId });

  const invitation = await Invitation.findOne({ _id: invitationId });

  if (!invitation) {
    throw new NotFoundError("Invitation not found");
  }

  if (invitation.receiverEmail !== receiver.email) {
    throw new UnauthorizedError(
      "You are not authorized to verify this invitation"
    );
  }

  const user = await User.find({ _id: invitation.senderId });

  if (!user) {
    throw new NotFoundError(
      `User with id: ${invitation.senderId} was not found`
    );
  }

  await Invitation.findOneAndUpdate({ _id: invitationId }, { verified: true });
  user.socialPoints += SOCIAL_POINTS;

  res.status(StatusCodes.OK).send();
};

const getAllSendedInvitations = async (req, res) => {
  const { userId } = req.user;

  const invitations = await Invitation.find({ senderId: userId });

  res.status(StatusCodes.OK).json({ invitations });
};

const getAllReceivedInvitations = async (req, res) => {
  const { userId } = req.user;

  const receiver = await User.findOne({ _id: userId });

  if (!receiver) {
    throw new NotFoundError("Not found error");
  }

  const invitations = await Invitation.find({ receiverEmail: receiver.email });

  res.status(StatusCodes.OK).json({ invitations });
};

module.exports = {
  sendInvitation,
  verifyInvitation,
  getAllSendedInvitations,
  getAllReceivedInvitations,
};
