const { ActivityType, Activity, Client } = require("discord.js");
const { checkAndPullChanges } = require("../utils/autoUpdate");

module.exports = {
  /**
   *
   * @param {Client} client
   */
  async ready(client) {
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

    client.on("updateStatus", (status) => {
      client.user.setPresence(presense(status));
    });

    setInterval(() => {
      checkAndPullChanges(client);
    }, 2000); //2 seconds

    setInterval(() => {
      client.user.setPresence(presense("online"));
    }, 10000);
  },
};
