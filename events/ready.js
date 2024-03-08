const { ActivityType, Activity, Client } = require("discord.js");
const { checkAndPullChanges } = require("../utils/autoUpdate");
const { AutoPoster } = require("topgg-autoposter");
const { app, webhook } = require("../server");
const config = require("../config.json");
const { WebSocket } = require("ws");

module.exports = {
  /**
   *
   * @param {Client} client
   */
  async ready(client) {
    const websocket = new WebSocket("ws://localhost:3000", {
      headers: {
        Authorization: "Bearer " + config.details.token,
      },
    });

    websocket.on("close", (code, reason) => {
      console.log("close", code, reason.toString());
    });

    websocket.on("error", (err) => {
      console.log("error", err);
    });

    websocket.on("open", (ws) => {
      websocket.send(
        JSON.stringify({
          type: "update",
          botid: client.user.id,
          stats: {
            serverCount: client.guilds.cache.size,
            userCount: client.users.cache.size,
            channelCount: client.channels.cache.size,
          },
        })
      );
      console.log("Connected to websocket");
    });

    const ap = AutoPoster(config.topgg.token, client);
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
      })
    ); // attach the middleware

    // optional
    ap.on("posted", (stats) => {
      console.log(`Posted stats to Top.gg | ${stats.serverCount} servers`);
    });

    client.on("updateStatus", (status) => {
      ap.post();
      websocket.send(
        JSON.stringify({
          type: "update",
          botid: client.user.id,
          stats: {
            serverCount: client.guilds.cache.size,
            userCount: client.users.cache.size,
            channelCount: client.channels.cache.size,
          },
        })
      );
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
