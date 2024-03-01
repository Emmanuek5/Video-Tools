const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
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
  async execute(interaction) {
    const user = interaction.options.getUser("user")
      ? interaction.options.getUser("user")
      : interaction.user;
    const data = await User.findOne({ UserID: user.id });
    const embed = new EmbedBuilder();
    embed.setTitle(`${user.tag}'s stats`);
    embed
      .setDescription(
        `**${user.tag}** has voted **${
          data.VoteCount
        }** times /n He Last Voted on **${
          data.LastVoted ? new Date(data.LastVoted).toLocaleString() : "Never"
        }**`
      )
      .addFields(
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
    await interaction.reply({ embeds: [embed] });
  },
};
