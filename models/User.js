const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  UserID: {
    type: String,
    required: true,
    unique: true,
  },
  VoteCount: {
    type: Number,
    default: 0,
  },
  Voted: {
    type: Boolean,
    default: false,
  },
  LastVoted: {
    type: Date,
    default: Date.now,
  },
  Clips: {
    type: Number,
    default: 0,
  },
  Cuts: {
    type: Number,
    default: 0,
  },
  Subtitled: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("User", userSchema);
