const { StatusCodes } = require("http-status-codes");
const sendInvitationEmail = require("../utils/sendInvitationEmail");
const { sendByGrid } = require("../utils/sendGrid");

const SOCIAL_POINTS = 5;

const Invitation = require("../models/Invitation");
const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../errors");
const User = require("../models/User");

const sendInvitation = async (req, res) => {
  const { receiver: receiverEmail } = req.body;
  const { userId } = req.user;
  const sender = await User.findOne({ _id: userId });

  if (!receiverEmail) {
    throw new BadRequestError("Please provide valid email.");
  }

  if (sender) {
    if (sender.email === receiverEmail) {
      throw new BadRequestError("Cannot send email to yourself");
    }

    await sendInvitationEmail({
      email: receiverEmail,
      origin: "http://localhost:3000",
    });

    await Invitation.create({
      senderId: userId,
      receiverEmail,
    });
  }

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

  const user = await User.findOne({ _id: invitation.senderId });

  if (!user) {
    throw new NotFoundError(
      `User with id: ${invitation.senderId} was not found`
    );
  }

  await Invitation.findOneAndUpdate({ _id: invitationId }, { verified: true });

  let resultPoints = user.socialPoints;
  resultPoints += SOCIAL_POINTS;

  await User.findOneAndUpdate(
    { _id: invitation.senderId },
    { socialPoints: resultPoints }
  );

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
