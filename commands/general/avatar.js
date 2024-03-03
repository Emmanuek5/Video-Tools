const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  Colors,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Sets the bot's avatar for the server")
    .addAttachmentOption((option) => {
      return option
        .setName("image")
        .setDescription("The image to set the avatar to")
        .setRequired(true);
    }),

  async execute(interaction, client) {
    const imageAttachment = interaction.options.get("image");

    if (
      !imageAttachment ||
      !imageAttachment.attachment ||
      !imageAttachment.attachment.contentType.startsWith("image/")
    ) {
      await interaction.reply(
        "Please provide an image attachment (e.g., .png, .jpg, .jpeg, .gif)"
      );
      return;
    }

    try {
      // Get the image URL
      const imageURL = imageAttachment.attachment.url;

      // Set the bot's avatar using the provided image
      await client.user.setAvatar(imageURL);

      // Respond to the user
      await interaction.reply("Bot avatar updated successfully!");
    } catch (error) {
      console.error("Error setting bot avatar:", error);
      const embed = new EmbedBuilder();
      embed.setTitle("An error occurred while setting the bot's avatar");
      embed.setColor(Colors.Red);
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
      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    }
  },
};
