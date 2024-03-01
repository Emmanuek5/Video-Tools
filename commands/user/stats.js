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
    let data = await User.findOne({ UserID: user.id });
    if (!data) {
      data = new User({
        UserID: user.id,
        VoteCount: 0,
        LastVoted: null,
        Clips: 0,
        Cuts: 0,
        Subtitled: 0,
      });
      await data.save();
    }
    const embed = new EmbedBuilder();
    embed.setTitle(`${user.tag}'s stats`);

    // Calculate time elapsed since last voted
    const lastVoted = data.LastVoted ? new Date(data.LastVoted) : null;
    const timeDifference = lastVoted ? Date.now() - lastVoted.getTime() : null;
    const timeAgo = timeDifference
      ? timeDifferenceToHumanReadable(timeDifference)
      : "Never";

    embed
      .addFields(
        {
          name: "Votes",
          value: `${data.VoteCount}`,
          inline: true,
        },
        {
          name: "Last Voted",
          value: timeAgo,
          inline: true,
        },
        {
          name: "Videos Clipped",
          value: `${data.Clips}`,
          inline: true,
        },
        {
          name: "Videos Cut",
          value: `${data.Cuts}`,
          inline: true,
        },
        {
          name: "Videos Subtitled",
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

// Function to convert time difference to human-readable format
function timeDifferenceToHumanReadable(timeDifference) {
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (seconds > 0) return `${seconds} second${seconds > 1 ? "s" : ""} ago`;

  return "Just now";
}
