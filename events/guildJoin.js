const { ButtonBuilder } = require("@discordjs/builders");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ChannelType,
  Guild,
  PermissionsBitField,
  Client,
} = require("discord.js");
const config = require("../config.json");
const GuildModel = require("../models/Guild");

/**
 * Join a guild and perform a series of actions such as sending welcome messages, creating invite links, and logging the guild information.
 *
 * @param {Guild} guild - The guild to join
 * @param {Client} client - The client making the join request
 * @return {Promise<void>} A promise that resolves when all actions are completed
 */
async function guildJoin(guild, client) {
  client.emit("updateStatus", "online");

  // Sending a welcome message to the guild owner
  const embed2 = new EmbedBuilder()
    .setTitle(`Welcome **${guild.name}**.`)
    .setColor("#0099ff")
    .setDescription(
      `Thanks For Adding The bot. To get started use the \`/help\` command.`
    )
    .setThumbnail(guild.iconURL())
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Join Our Server")
      .setStyle("Link")
      .setURL(config.invite_link),
    new ButtonBuilder()
      .setStyle("Link")
      .setURL(config.details.website)
      .setLabel("Visit Our Website")
  );

  const owner = await guild.members.fetch(guild.ownerId);
  if (owner) {
    owner.send({ embeds: [embed2], components: [row] }).catch(() => {});
  }

  // Logging the guild information
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle(`"${guild.name}" Has Added The Bot To Their Server`)
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

  // Creating an invite link for the server
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

    client.channels.cache.get(config.info.join_channel).send({
      embeds: [embed],
      components: [row1],
    });
  }

  // Checking and creating server data in the database
  try {
    let guildData = await GuildModel.findOne({ GuildID: guild.id });
    if (!guildData) {
      guildData = new GuildModel({
        GuildID: guild.id,
        GuildName: guild.name,
      });
      await guildData.save();
    }
  } catch (error) {
    console.error("Error occurred while checking/creating guild data:", error);
  }
}

module.exports = guildJoin;
