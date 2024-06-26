const {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  Colors,
  ChatInputCommandInteraction,
} = require("discord.js");
const Video = require("../../classes/Video");
const path = require("path");
const { formatTime, sleep } = require("../../utils/functions");
const { createWriteStream } = require("fs");
const archiver = require("archiver");
const fs = require("fs");
const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clip")
    .setDescription("Clip a video into multiple parts")
    .addAttachmentOption((option) => {
      return option
        .setName("video")
        .setDescription("The video you want to clip")
        .setRequired(true);
    })
    .addIntegerOption((option) => {
      return option
        .setName("parts")
        .setDescription("The number of parts to split the video into")
        .setRequired(true);
    })
    .addNumberOption((option) => {
      return option
        .setName("duration")
        .setDescription("The duration of each part")
        .setRequired(true);
    }),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {*} client
   * @returns
   */
  async execute(interaction, client) {
    await interaction.deferReply();

    // Retrieve options from interaction
    const videoAttachment = interaction.options.getAttachment("video");
    const parts = interaction.options.getInteger("parts");
    const duration = interaction.options.getNumber("duration");

    // Check if the video attachment exists
    if (!videoAttachment || !videoAttachment.attachment) {
      await interaction.editReply("Please provide a video attachment.");
      return;
    }

    if (
      !videoAttachment ||
      !videoAttachment.attachment ||
      !videoAttachment.contentType.startsWith("video/")
    ) {
      await interaction.editReply(
        "Please provide a valid video file (e.g., .mp4)."
      );
      return;
    }

    // Check if the number of parts is valid
    if (!parts || parts <= 0 || parts > 20) {
      // Adjust the range as per your requirements
      await interaction.editReply(
        "Please provide a valid number of parts (1-20)."
      );
      return;
    }

    // Check if the duration is valid
    if (!duration || duration <= 0) {
      await interaction.editReply(
        "Please provide a valid duration (greater than 0 seconds)."
      );
      return;
    }

    // Create a new instance of the Video class
    const video = new Video();
    const user = await User.findOne({ UserID: interaction.user.id });
    // Set file name, duration, and download the video
    video.setFile(
      path.join(
        process.cwd(),
        "/data/videos/",
        Date.now() + "_" + videoAttachment.name + ".mp4"
      )
    );
    video.setName(videoAttachment.name); // Assuming the name is provided
    await interaction.editReply(
      "Downloading and processing the video... :hourglass_flowing_sand:"
    );
    const file = await video.download(videoAttachment.url);

    try {
      await interaction.editReply(
        "Video downloaded successfully! Now clipping..."
      );

      let progressPercent = 0;
      const progressCallback = (progress) => {
        progressPercent = progress;
        interaction.editReply(
          `Clipping video... :hourglass_flowing_sand: ${progress.toFixed(2)}%`
        );
      };

      // Get the path to the zip file(s)
      const zipFilePaths = await video.clip(parts, duration, progressCallback);

      // Send the zip file(s) back to the user
      for (const zipFilePath of zipFilePaths) {
        const attachment = new AttachmentBuilder()
          .setFile(zipFilePath)
          .setName(`${video.name}_clipped.zip`);
        await interaction.editReply({
          content: "Video clipped successfully",
          files: [attachment],
        });
        // Delete the video file and zip file after sending
        video.delete();
        user.Clips++;
        user.save();
        fs.unlinkSync(zipFilePath);
      }
    } catch (error) {
      console.error("Error clipping video:", error);
      video.delete();
      const embed = new EmbedBuilder();
      embed.setColor(Colors.Red);
      embed.setTitle("An error occurred while clipping the video.");
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
