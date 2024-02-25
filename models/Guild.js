const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  GuildID: {
    type: String,
    required: true,
    unique: true,
  },
  GuildName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Guild", guildSchema);
