const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  AttachmentBuilder,
  EmbedBuilder,
  Colors,
} = require("discord.js");
const Video = require("../../classes/Video");
const path = require("path");
const { download } = require("../../utils/functions");
const fs = require("fs");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("subtitle")
    .setDescription("Add subtitles to the video")
    .addAttachmentOption((option) => {
      return option
        .setName("video")
        .setDescription("The video you want to add subtitles to")
        .setRequired(true);
    })
    .addAttachmentOption((option) => {
      return option
        .setName("subtitle")
        .setDescription("The subtitle file you want to use")
        .setRequired(true);
    }),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    const video = new Video();
    try {
      const videoAttachment = interaction.options.get("video");
      const subtitleAttachment = interaction.options.get("subtitle");

      video.setFile(
        path.join(
          process.cwd(),
          "data",
          "videos",
          Date.now() + videoAttachment.name + ".mp4"
        )
      );
      await interaction.editReply("Downloading and processing the video...");
      await video.download(videoAttachment.attachment.url);

      video.setSubtitles(
        await download(
          subtitleAttachment.attachment.url,
          Date.now() + subtitleAttachment.name + ".srt"
        )
      );

      interaction.editReply("Adding subtitles to the video...");

      const file = await video
        .addSubtitles(
          path.join(
            process.cwd(),
            "data",
            "/videos/subtitled",
            Date.now() + ".mp4"
          )
        )
        .then((path) => {
          const attachment = new AttachmentBuilder()
            .setFile(path)
            .setName("subtitled_video.mp4");

          const embed = new EmbedBuilder()
            .setTitle("Subtitled video")
            .setColor("#0099ff")
            .setDescription(`Successfully added subtitles to the video.`);

          interaction
            .editReply({ content: " ", embeds: [embed], files: [attachment] })
            .then(() => {
              video.delete();

              fs.unlinkSync(path);
            });
        });
    } catch (error) {
      console.log(error);
      video.delete();
      const embed = new EmbedBuilder();
      embed.setTitle("An error occurred while adding subtitles to the video.");
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
