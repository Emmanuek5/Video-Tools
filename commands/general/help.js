const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows all commands")
    .addStringOption((option) => {
      return option
        .setName("command")
        .setDescription("The command you want help with")
        .setRequired(false);
    }),
  async execute(interaction, client) {
    const commands = client.commands;
    const embed = new EmbedBuilder();
    const command = interaction.options.getString("command");

    if (command) {
      const filteredCommands = commands.filter(
        (cmd) => cmd.data.name === command
      );

      if (filteredCommands.length > 0) {
        const selectedCommand = filteredCommands[0].data;
        embed.setTitle(`Help with ${selectedCommand.name} command`);
        embed.setDescription(selectedCommand.description);
        embed.setColor("#0099ff"); // Set color to blue
        if (selectedCommand.options) {
          embed.addFields({
            name: "Options",
            value: selectedCommand.options
              .map((option) => `• ${option.name} - ${option.description}`)
              .join("\n"),
            inline: true,
          });
        }
      } else {
        embed.setTitle("Command not found");
        embed.setDescription("The requested command was not found.");
        embed.setColor("#ff0000"); // Set color to red for error message
      }
    } else {
      embed.setTitle("Help");
      embed.setColor("#0099ff"); // Set color to blue
      embed.addFields({
        name: "Available Commands",
        value: commands
          .map(
            (command) =>
              `\`${command.data.name}\` - ${command.data.description}`
          )
          .join("\n"),
        inline: true,
      });
    }

    embed.setThumbnail(client.user.displayAvatarURL());
    embed.setFooter({
      text: `Requested by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
    });

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
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
