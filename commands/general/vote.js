const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Sends the link to vote for me"),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Vote for me")
      .setDescription(
        "Thank you for using my bot. You can vote for me by clicking the link below."
      );
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle("Link")
        .setLabel("Vote")
        .setURL(config.topgg.votelink)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
