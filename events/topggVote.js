const User = require("../models/User");

module.exports = {
  async topggVote(user, vote, client) {
    let user_info = await User.findOne({
      id: user.id,
    });

    if (!user_info) {
      user_info = new User({
        id: user.id,
        VoteCount: 0,
        Voted: false,
        LastVoted: Date.now(),
      });
    }

    user_info.VoteCount += vote;
    user_info.Voted = true;
    user_info.LastVoted = Date.now();

    await user_info.save();

    console.log(vote, user);
  },
};
