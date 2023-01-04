const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, "Please provide id"],
  },
  status: {
    type: String,
    required: [true, "Please provide status"],
  },
  homeId: {
    type: Number,
    required: [true, "Please provide home id"],
  },
  awayId: {
    type: Number,
    required: [true, "Please provide away id"],
  },
  date: {
    type: String,
    required: [true, "Please provide date"],
  },
  court: {
    type: String,
    required: [true, "Please provide court"],
  },
  round: {
    type: String,
    default: "n/a",
  },
  winnerId: {
    type: Number,
    required: [true, "Please provide winner id"],
  },
  homeSets: {
    type: String,
    required: [true, "Please provide home sets"],
  },
  awaySets: {
    type: String,
    required: [true, "Please provide away sets"],
  },
  homeSet1: {
    type: String,
    required: [true, "Please provide home set 1"],
  },
  homeSet2: {
    type: String,
    required: [true, "Please provide home set 2"],
  },
  homeSet3: {
    type: String,
    required: [true, "Please provide home set 3"],
  },
  homeSet4: {
    type: String,
    required: [true, "Please provide home set 4"],
  },
  homeSet5: {
    type: String,
    required: [true, "Please provide home set 5"],
  },
  awaySet1: {
    type: String,
    required: [true, "Please provide away set 1"],
  },
  awaySet2: {
    type: String,
    required: [true, "Please provide away set 2"],
  },
  awaySet3: {
    type: String,
    required: [true, "Please provide away set 3"],
  },
  awaySet4: {
    type: String,
    required: [true, "Please provide away set 4"],
  },
  awaySet5: {
    type: String,
    required: [true, "Please provide away set 5"],
  },
  homeAces: {
    type: Number,
    required: [true, "Please provide home aces"],
  },
  homeDoubleFaults: {
    type: Number,
    required: [true, "Please provide home double faults"],
  },
  homeWinners: {
    type: Number,
    required: [true, "Please provide home winners"],
  },
  homeUnforcedErrors: {
    type: Number,
    required: [true, "Please provide home unforced errors"],
  },
  awayAces: {
    type: Number,
    required: [true, "Please provide away aces"],
  },
  awayDoubleFaults: {
    type: Number,
    required: [true, "Please provide away double faults"],
  },
  awayWinners: {
    type: Number,
    required: [true, "Please provide away winners"],
  },
  awayUnforcedErrors: {
    type: Number,
    required: [true, "Please provide away unforced errors"],
  },
  tournamentId: {
    type: Number,
    required: [true, "Please provide tournament id"],
  },
  roundId: {
    type: String,
    required: [true, "Please provide round id"],
  },
});

module.exports = mongoose.model("Match", MatchSchema);
