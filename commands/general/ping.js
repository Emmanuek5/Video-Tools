const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping the bot"),
  async execute(interaction) {
    const embed = new EmbedBuilder();
    let config = require("../../config.json");
    //caclulate ping
    const ping = Date.now() - interaction.createdTimestamp;
    embed.setTitle("Pong!");
    embed.setDescription(`Pong! ${ping}ms`);
    embed.setFooter({
      text: `Support Server: ${config.invite_link}`,
      iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
    });
    await interaction.reply({ embeds: [embed] });
  },
};
