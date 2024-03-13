const express = require("express");
const router = express.Router();
const Guild = require("../models/Guild");

router.client = null;

router.get("/servers", async (req, res) => {
  const data = [];
  for (const [id, guild] of router.client.guilds.cache) {
    data.push({
      id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount,
    });
  }
  res.status(200).json(data);
});

router.get("/server/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const guild = await router.client.guilds.fetch(id);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }
    const dbData = await Guild.findOne({ GuildID: id });

    const data = {
      id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount,
      settings: {
        botName: dbData.BotName,
      },
      channels: [],
      roles: [],
    };

    for (const [id, channel] of guild.channels.cache) {
      data.channels.push({
        id,
        name: channel.name,
        type: channel.type,
      });
    }

    for (const [id, role] of guild.roles.cache) {
      data.roles.push({
        id,
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        permissions: role.permissions.toArray(),
        position: role.position,
        managed: role.managed,
        mentionable: role.mentionable,
        tags: role.tags,
      });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: "An error occurred" });
    console.log(error);
  }
});
router.post("/server/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const guild = await router.client.guilds.fetch(id);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }

    const dbData = await Guild.findOne({ GuildID: id });

    if (!dbData) {
      const newGuild = new Guild({
        GuildID: id,
        GuildName: guild.name,
        BotName: req.body.settings.botName,
      });
      await newGuild.save();
    } else {
      dbData.BotName = req.body.settings.botName;
      await dbData.save();
    }

    // Fetch the bot's member object for the guild
    const botMember = await guild.members.fetch(router.client.user.id);
    if (botMember) {
      await botMember.setNickname(req.body.settings.botName);
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: "Bot is not a member of this guild" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "An error occurred" });
  }
});

module.exports = router;
