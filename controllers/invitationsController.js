const { StatusCodes } = require("http-status-codes");
const { sendEmail } = require("../utils/email");
const { sendByGrid } = require("../utils/sendgrid");

const SOCIAL_POINTS = 5;

const Invitation = require("../models/Invitation");
const { NotFoundError, UnauthorizedError } = require("../errors");
const User = require("../models/User");

const msg = {
  to: "",
  from: "miroslav.uzunov@scalefocus.com",
  subject: "Sending with SendGrid Is Fun",
  text: "and easy to do anywhere, even with Node.js",
};

const sendInvitation = async (req, res) => {
  const { receiver } = req.body;
  const userId = req.user.userId;
  console.log(userId);

  msg.to = receiver;
  sendEmail(msg);
  sendByGrid(msg);

  await Invitation.create({
    senderId: userId,
    receiverEmail: msg.to,
  });

  res.status(StatusCodes.OK).send();
};

const verifyInvitation = async (req, res) => {
  const { invitationId } = req.body;
  const userId = req.user.userId;
  const email = req.user.email;

  const invitation = Invitation.find({ _id: invitationId });

  if (!invitation) {
    throw new NotFoundError("Invitation not found");
  }

  if (invitation.receiverEmail !== email) {
    throw new UnauthorizedError(
      "You are not authorized to verify this invitation"
    );
  }

  const user = await User.find({ _id: userId });

  if (!user) {
    throw new NotFoundError(`User with id: ${userId} was not found`);
  }

  await invitation.findOneAndUpdate({ _id: invitationId }, { verified: true });
  user.socialPoints += SOCIAL_POINTS;

  res.status(StatusCodes.OK).send();
};

module.exports = { sendInvitation, verifyInvitation };
