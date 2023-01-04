const mongoose = require("mongoose");

const PickSchema = new mongoose.Schema({
  playerId: {
    type: Number,
    required: [true, "Please provide player id"],
  },
  userId: {
    type: String,
    required: [true, "Please provide user id"],
  },
  bracketId: {
    type: String,
    required: [true, "Please provide bracket id"],
  },
});

module.exports = mongoose.model("Pick", PickSchema);
