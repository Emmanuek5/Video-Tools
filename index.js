process.on("unhandledRejection", (err) => {
  console.log(err);
});

process.on("uncaughtException", (err) => {
  console.log(err);
});
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  ActivityType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Partials,
  Collection,
  REST,
  Routes,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");
const COLOURS = require("./utils/colours");
const { sleep } = require("./utils/functions");
const guildJoin = require("./events/guildJoin");
const { default: mongoose } = require("mongoose");
const { ready } = require("./events/ready");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const autoUpdate = require("./utils/autoUpdate");
const genAI = new GoogleGenerativeAI(config.ai.gemini);
const { guildDelete } = require("./events/guildDelete");
const cloudinary = require("cloudinary");
const client = new Client({
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});
const commands_folder = path.join(__dirname, "commands");
const commands = [];

const walkSync = (dir, array) => {
  let files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath, array);
    } else {
      if (!file.endsWith(".js")) return;
      array.push(require(filePath));
    }
  });
};

client.commands = commands;
client.config = config;

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isCommand()) return;
    const command = commands.find(
      (cmd) => cmd.data.name === interaction.commandName
    );
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder();
      embed.setTitle("There was an error while executing this command!");
      embed.setDescription(
        "Join our discord server below and report the issue"
      );

      embed.setColor(Colors.Red);
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
      await interaction
        .reply({
          embeds: [embed],
          components: [row],
        })
        .catch(() => {
          interaction.editReply({
            embeds: [embed],
            components: [row],
          });
          return;
        });
    }
  } catch (error) {
    return;
  }
});

client.on("guildCreate", (guild) => {
  guildJoin(guild, client);
});
client.on("guildDelete", (guild) => {
  guildDelete(guild, client);
});

client.on("ready", ready);
client.on("ready", async () => {
  const invite_link = client.generateInvite({
    scopes: ["bot", "applications.commands"],
    permissions: [
      PermissionsBitField.Flags.Administrator,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.MentionEveryone,
      PermissionsBitField.Flags.ManageRoles,
      PermissionsBitField.Flags.ModerateMembers,
      PermissionsBitField.Flags.ManageMessages,
    ],
  });
  let message = "------------------------\n";
  message += `Invite Link: ${invite_link}\n`;
  message += `Bot Name: ${client.user.username}\n`;
  message += `Bot ID: ${client.user.id}\n`;
  message += "Made by: Cloven Bots : https://discord.gg/aJA74Vw4\n";
  message += "------------------------";
  //create a mongoose connection
  mongoose
    .connect(config.database.uri)
    .then(() =>
      console.log(
        COLOURS.applyColor("Connected to MongoDB!", COLOURS.GREEN_TEXT)
      )
    )
    .catch((error) => console.error("Error connecting to MongoDB:", error));

  console.log(COLOURS.applyColor(message, COLOURS.GREEN_TEXT));
  walkSync(commands_folder, commands);

  await sleep(5000);
  let commands_to_send = [];
  for (const command of commands) {
    if (command.data.name) {
      commands_to_send.push(command.data);
    }
  }
  const rest = new REST({ version: "10" }).setToken(config.token);
  (async () => {
    try {
      console.log(
        COLOURS.applyColor(
          "Started refreshing application (/) commands.",
          COLOURS.YELLOW_TEXT
        )
      );
      await rest.put(Routes.applicationCommands(config.client_id), {
        body: commands_to_send,
      });
      console.log(
        COLOURS.applyColor(
          "Successfully reloaded application (/) commands.",
          COLOURS.GREEN_TEXT
        )
      );
    } catch (error) {
      console.error(error);
    }
  })();
});

client.login(config.token);
