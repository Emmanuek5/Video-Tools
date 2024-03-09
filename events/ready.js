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
    function connectWebSocket() {
      const websocket = new WebSocket(config.details.websocket, {
        headers: {
          Authorization: "Bearer " + config.details.token,
        },
      });

      websocket.on("close", (code, reason) => {
        console.log("WebSocket closed. Reconnecting...");
        setTimeout(connectWebSocket, 1000); // Reconnect after 1 second
      });

      websocket.on("error", (err) => {
        console.log("WebSocket error:", err);
      });

      websocket.on("open", () => {
        console.log("Connected to WebSocket");
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
      });
    }

    connectWebSocket();

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
      connectWebSocket();
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
