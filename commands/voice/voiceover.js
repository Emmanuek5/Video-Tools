const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  Colors,
} = require("discord.js");
const Video = require("../../classes/Video");
const { download } = require("../../utils/functions");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voiceover")
    .setDescription("Replaces the audio in a video with the provided audio")
    .addAttachmentOption((option) => {
      return option
        .setName("audio")
        .setDescription("The audio to replace the video's audio with")
        .setRequired(true);
    })
    .addAttachmentOption((option) => {
      return option
        .setName("video")
        .setDescription("The video to replace the audio in")
        .setRequired(true);
    }),
  async execute(interaction, client) {
    await interaction.deferReply();
    const video = new Video();
    try {
      const audioAttachment = interaction.options.get("audio");
      const videoAttachment = interaction.options.get("video");

      const audioFile = await download(
        audioAttachment.attachment.url,
        path.join(
          process.cwd(),
          "data",
          "audio",
          `${audioAttachment.attachment.id}.mp3`
        )
      );
      video.setFile(
        path.join(
          process.cwd(),
          "data",
          "videos",
          `${videoAttachment.attachment.id}.mp4`
        )
      );
      await video.download(videoAttachment.attachment.url);

      const processedVideo = await video.replaceAudio(
        audioFile,
        path.join(
          process.cwd(),
          "data",
          "videos",
          "processed",
          `${Date.now()}_${videoAttachment.attachment.id}.mp4`
        ),
        // Progress callback function
        (progress) => {
          const emojis = ["▶️", "⏸️", "⏹️"];
          const emojiIndex = Math.floor(progress / 33.4);
          const emoji = emojis[emojiIndex] || emojis[emojis.length - 1];
          interaction.editReply(`${emoji} Progress: ${progress}%`);
        }
      );
      const attachment = new AttachmentBuilder()
        .setFile(processedVideo)
        .setName("processed.mp4");

      interaction.editReply({
        content: "✅ Video processed successfully!",
        files: [attachment],
      });
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
