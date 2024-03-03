const {
  SlashCommandBuilder,
  BaseInteraction,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  Colors,
} = require("discord.js");
const Video = require("../../classes/Video");
const path = require("path");
const { formatTime } = require("../../utils/functions");
const User = require("../../models/User");

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
  async execute(interaction, client) {
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

    // Check if the start and end times are valid
    if (
      !start ||
      !end ||
      !/^\d{2}:\d{2}$/.test(start) || // Use regex to check time format
      !/^\d{2}:\d{2}$/.test(end)
    ) {
      await interaction.editReply(
        "Please provide valid start and end times. eg: 00:10 , 01:20"
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

    intraction.editReply("Downloading and processing the video...");
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
      const progressCallback = async (percentComplete) => {
        await interaction.editReply(
          `:hourglass: Cutting ${percentComplete}% complete...`
        );
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
          user.Cuts++;
          user.save();
          video.delete();
        });
    } catch (error) {
      console.error("Error cutting video:", error);
      video.delete();
      const embed = new EmbedBuilder();
      embed.setColor(Colors.Red);

      embed.setTitle("An error occurred while cutting the video.");
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
