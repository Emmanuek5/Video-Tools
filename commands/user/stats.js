const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userstats")
    .setDescription("Get a user's stats")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get the stats of")
        .setRequired(false)
    ),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const user = interaction.options.getUser("user")
      ? interaction.options.getUser("user")
      : interaction.user;
    const data = await User.findOne({ UserID: user.id });
    const embed = new EmbedBuilder();
    embed.setTitle(`${user.tag}'s stats`);
    embed

      .addFields(
        {
          name: "Votes",
          value: `${data.VoteCount}`,
          inline: true,
        },
        {
          name: "Last Voted",
          value: `${new Date(data.LastVoted).toLocaleString()}`,
          inline: true,
        },
        {
          name: "Vidoes Clipped",
          value: `${data.Clips}`,
          inline: true,
        },
        {
          name: "Vidoes Cut",
          value: `${data.Cuts}`,
          inline: true,
        },
        {
          name: "Vidoes Subtitled",
          value: `${data.Subtitled}`,
          inline: true,
        }
      )
      .setColor("#0099ff");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle("Link")
        .setLabel("Vote")
        .setURL(client.config.topgg.votelink)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
