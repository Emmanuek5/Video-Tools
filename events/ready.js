const { ActivityType, Activity, Client } = require("discord.js");
const { checkAndPullChanges } = require("../utils/autoUpdate");
const { AutoPoster } = require("topgg-autoposter");
const { app, webhook } = require("../server");

module.exports = {
  /**
   *
   * @param {Client} client
   */
  async ready(client) {
    const ap = AutoPoster(client.config.topgg.token, client);
    const presense = (status = "online") => {
      return {
        status: status,
        activities: [
          {
            name: "/help and " + client.guilds.cache.size + " servers",
            type: ActivityType.Watching,
          },
        ],
      };
    };

    app.post(
      "/topgg/webhook",
      webhook.listener((vote) => {
        const user = client.users.cache.get(vote.user);
        client.emit("topggVote", user, vote, client);
        console.log(vote);
      })
    ); // attach the middleware
    ap.on("posted", () => {
      console.log("Posted!");
    });
    client.on("updateStatus", (status) => {
      ap.post();
      client.user.setPresence(presense(status));
    });

    setInterval(() => {
      checkAndPullChanges(client);
    }, 2000); //2 seconds

    setInterval(() => {
      client.user.setPresence(presense("online"));
    }, 10000);
    app.listen(client.config.topgg.port, () => {
      console.log(
        "Top.gg webhook server running on port " + client.config.topgg.port
      );
    });
  },
};
