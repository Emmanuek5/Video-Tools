const { ButtonBuilder } = require("@discordjs/builders");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ChannelType,
  Guild,
  PermissionsBitField,
  Client,
  Colors,
} = require("discord.js");
const GuildModel = require("../models/Guild");
const config = require("../config.json");

module.exports = {
  /**
   * A description of the entire function.
   *
   * @param {Client} client - description of parameter
   * @param {Guild} guild - description of parameter
   * @return {type}
   */
  guildDelete: async (guild, client) => {
    client.emit("updateStatus", "online");

    const guildInfo = await GuildModel.findOne({
      GuildID: guild.id,
    });
    if (!guildInfo) {
      return;
    }
    await GuildModel.findOneAndDelete({
      GuildID: guild.id,
    });

    const owner = await guild.members.fetch(guild.ownerId);

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle(`"${guild.name}" Has Removed The Bot From Their Server`)
      .addFields(
        {
          name: "Server Name",
          value: `${guild.name}`,
          inline: true,
        },
        {
          name: "Server ID",
          value: `${guild.id}`,
          inline: true,
        },
        {
          name: "Server Owner",
          value: `${owner.user.tag}`,
          inline: true,
        },
        {
          name: "Member Count",
          value: `${guild.memberCount}`,
          inline: true,
        }
      );

    const inviteChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText
    );

    if (inviteChannel) {
      const invite = await inviteChannel.createInvite({
        maxAge: 0,
        maxUses: 0,
      });

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Join The Server")
          .setStyle("Link")
          .setURL(invite.url)
      );

      client.channels.cache.get(config.info.leave_channel).send({
        embeds: [embed],
        components: [row1],
      });
      return;
    }

    client.channels.cache.get(config.info.leave_channel).send({
      embeds: [embed],
    });
  },
};
