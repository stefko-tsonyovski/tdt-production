const mongoose = require("mongoose");

const InvitationSchema = mongoose.Schema({
  senderId: {
    type: String,
    required: [true, "Please provide sender Id"],
  },
  receiverEmail: {
    type: String,
    required: [true, "Please provide sender Id"],
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Invitation", InvitationSchema);
