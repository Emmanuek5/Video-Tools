const {
  SlashCommandBuilder,
  BaseInteraction,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} = require("discord.js");
const Video = require("../../classes/Video");
const path = require("path");
const { formatTime } = require("../../utils/functions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cut")
    .setDescription("Cut a video")
    .addAttachmentOption((option) => {
      return option
        .setName("video")
        .setDescription("The video you want to cut")
        .setRequired(true);
    })
    .addStringOption((option) => {
      return option
        .setName("start")
        .setDescription("The start of the cut eg: 00:10")
        .setRequired(true);
    })
    .addStringOption((option) => {
      return option
        .setName("end")
        .setDescription("The end of the cut eg: 01:20")
        .setRequired(true);
    }),
  /**
   * A function to execute video cutting based on provided options from interaction.
   *
   * @param {ChatInputCommandInteraction} interaction - the interaction object containing options for video cutting
   * @return {Promise<void>} a promise that resolves when the video cutting is completed
   */
  async execute(interaction) {
    await interaction.deferReply();
    // Retrieve options from interaction
    const videoAttachment = interaction.options.get("video");
    const start = interaction.options.getString("start");
    const end = interaction.options.getString("end");

    // Check if the video attachment exists
    if (!videoAttachment || !videoAttachment.attachment) {
      await interaction.editReply("Please provide a video attachment.");
      return;
    }

    // Create a new instance of the Video class
    const video = new Video();

    // Set file name, duration, and download the video
    video.setFile(
      path.join(
        process.cwd(),
        "/data/videos/",
        Date.now() + "_" + videoAttachment.name + ".mp4"
      )
    );
    video.setName(videoAttachment.name); // Assuming the name is provided
    const file = await video.download(videoAttachment.attachment.url);

    try {
      // Format start and end time strings to date number values
      const startTimeParts = start.split(":").map((part) => parseFloat(part));
      const endTimeParts = end.split(":").map((part) => parseFloat(part));
      const startTime =
        startTimeParts[0] * 60 + // Minutes instead of hours
        startTimeParts[1] +
        (startTimeParts[2] || 0);
      const endTime =
        endTimeParts[0] * 60 + // Minutes instead of hours
        endTimeParts[1] +
        (endTimeParts[2] || 0);

      const startTimeString = formatTime(startTime);
      let dur = formatTime(endTime - startTime);
      let cutfile = path.join(
        process.cwd(),
        "/data/videos/cuts/",
        Date.now() + "_" + videoAttachment.name + "cut.mp4"
      );

      let progressPercent = 0;
      const progressCallback = (percentComplete) => {
        if (percentComplete > progressPercent) {
          progressPercent = percentComplete;
          interaction.editReply(`Cutting ${progressPercent}% complete...`);
        }
      };

      await video.cut(startTimeString, dur, cutfile, progressCallback);
      const attachment = new AttachmentBuilder()
        .setFile(cutfile)
        .setName("cut.mp4");
      await interaction
        .editReply({
          content: "Video cut successfully",
          files: [attachment],
        })
        .then(() => {
          video.delete();
        });
    } catch (error) {
      console.error("Error cutting video:", error);
      await interaction.editReply("An error occurred while cutting the video.");
    }
  },
};
