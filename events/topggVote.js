const User = require("../models/User");

module.exports = {
  async topggVote(user, vote, client) {
    console.log(user, vote);
    let user_info = await User.findOne({
      UserID: user.id,
    });

    if (!user_info) {
      user_info = new User({
        UserID: user.id,
        VoteCount: 0,
        Voted: false,
        LastVoted: Date.now(),
      });
    }

    user_info.VoteCount += 1;
    user_info.Voted = true;
    user_info.LastVoted = Date.now();

    await user_info.save();
  },
};
