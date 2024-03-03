const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  Colors,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("name")
    .setDescription("Sets the name of the bot for your server")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the bot")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const name = interaction.options.getString("name");
    const { guild } = interaction;

    try {
      await guild.me.setNickname(name);
      await interaction.reply(`Successfully set bot's name to ${name}`);
    } catch (error) {
      console.error("Error cutting video:", error);

      const embed = new EmbedBuilder();
      embed.setColor(Colors.Red);
      embed.setTitle("An error occurred while setting the bot's name");
      embed.setDescription(
        "Join our discord server below and report the issue \n `" + error + "`"
      );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle("Link")
          .setLabel("Invite Me")
          .setURL(
            `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=1099783400472&scope=bot%20applications.commands`
          ),

        new ButtonBuilder()
          .setStyle("Link")
          .setLabel("Support Server")
          .setURL(client.config.invite_link)
      );
      await interaction.reply({
        embeds: [embed],
        components: [row],
      });
    }
  },
};
