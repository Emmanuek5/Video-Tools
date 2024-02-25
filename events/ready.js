const { ActivityType, Activity, Client } = require("discord.js");

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
      client.user.setPresence(presense("online"));
    }, 10000);
  },
};
