const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  Colors,
} = require("discord.js");
const Video = require("../../classes/Video");
const path = require("path");
const { download } = require("../../utils/functions");
const fs = require("fs");
const User = require("../../models/User");
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
    const user = await User.findOne({ UserID: interaction.user.id });
    try {
      const videoAttachment = interaction.options.get("video");
      const subtitleAttachment = interaction.options.get("subtitle");

      // Check if both video and subtitle attachments are provided
      if (
        !videoAttachment ||
        !videoAttachment.attachment ||
        !subtitleAttachment ||
        !subtitleAttachment.attachment
      ) {
        await interaction.editReply(
          "Please provide both a video and subtitle file."
        );
        return;
      }

      // Check if the video attachment is of the correct type (e.g., mp4)
      if (
        !videoAttachment ||
        !videoAttachment.attachment ||
        !videoAttachment.attachment.contentType.startsWith("video/")
      ) {
        await interaction.editReply(
          "Please provide a valid video file (e.g., .mp4)."
        );
        return;
      }
      // Check if the subtitle attachment is of the correct type (e.g., srt)
      if (!subtitleAttachment.attachment.name.endsWith(".srt")) {
        await interaction.editReply(
          "Please provide a subtitle attachment with .srt extension."
        );
        return;
      }

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

      const progressCallback = (progress) => {
        interaction.editReply(
          `:hourglass: Adding subtitles... ${progress.toFixed(2)}% `
        );
      };

      const file = await video
        .addSubtitles(
          path.join(
            process.cwd(),
            "data",
            "/videos/subtitled",
            Date.now() + ".mp4"
          ),
          progressCallback
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
              user.Subtitled++;
              user.save();
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
