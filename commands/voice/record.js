const {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
} = require("@discordjs/voice");
const {
  GuildMember,

  ActionRowBuilder,
  ButtonBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} = require("discord.js");
const fs = require("fs");
const { createListeningStream } = require("../../utils/createListeningStream");
const { sleep } = require("../../utils/functions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("record")
    .setDescription("Record your voice channel"),
  /**
   * A function to execute video cutting based on provided options from interaction.
   *
   * @param {ChatInputCommandInteraction} interaction - the interaction object containing options for video cutting
   * @return {Promise<void>} a promise that resolves when the video cutting is completed
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    const config = require("../../config.json");
    const embed = new EmbedBuilder();
    let connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      const member = interaction.member;
      if (member instanceof GuildMember && member.voice.channel) {
        const channel = member.voice.channel;
        connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false,
        });

        const player = createAudioPlayer();
        let resource = createAudioResource(
          "https://cdn.discordapp.com/attachments/1071848731911147651/1206705691948224642/recording.mp3?ex=65dcfb40&is=65ca8640&hm=ac305a5279608b43e5ee1065b6cf8c8ce2c6e665a2f39c09198abc73d86184af&",
          {
            inlineVolume: true,
          }
        );
        resource.volume.setVolume(2);
        player.play(resource);
        connection.subscribe(player);
      } else {
        await interaction.editReply("Join a voice channel and then try again!");
        return;
      }
    }

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
      const receiver = connection.receiver;
      embed.setTitle("Recording Started");
      embed.setColor("#3498db");
      embed.setDescription(
        `If you stop speaking for 5 seconds, the recording will end.`
      );

      const message = await interaction.editReply({
        embeds: [embed],
        fetchReply: true,
      });

      const filename = await createListeningStream(receiver, interaction).then(
        async (filename) => {
          embed.setTitle("Recording Complete");
          embed.setColor(Colors.Green);
          embed.setDescription("Your recording has been saved!");

          const attachment = new AttachmentBuilder(filename, {
            name: `recording-${Date.now()}.mp3`,
            description: "Recording",
          });
          await interaction.editReply({
            embeds: [embed],
            files: [attachment],
          });
          await sleep(4000);
          fs.unlinkSync(filename);
          connection.destroy();
        }
      );
    } catch (error) {
      console.warn(error);
      const embed = new EmbedBuilder();
      embed.setTitle("An error occurred while recording the voice channel.");
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
