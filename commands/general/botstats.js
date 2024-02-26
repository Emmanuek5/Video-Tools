const { EmbedBuilder } = require("@discordjs/builders");
const {
  SlashCommandBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const os = require("os");

const totalMemory = os.totalmem(); // Total system memory in bytes

function formatCpuUsage(usage) {
  return `${usage.toFixed(2)}%`;
}

function formatUptime(uptime) {
  const totalSeconds = Math.floor(uptime / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatMemory(memory) {
  if (memory < 1024 * 1024) {
    return `${memory} B`; // Handle bytes directly if less than 1 MB
  } else if (memory < 1024 * 1024 * 1024) {
    return `${(memory / (1024 * 1024)).toFixed(2)} MB`; // Convert to MB and format
  } else {
    return `${(memory / (1024 * 1024 * 1024)).toFixed(2)} GB`; // Convert to GB and format
  }
}

function formatPercentage(usage, total) {
  return ((usage / total) * 100).toFixed(2) + "%";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botstats")
    .setDescription("Get bot stats"),
  async execute(interaction, client) {
    const guild = client.guilds.cache.size;
    const user = client.users.cache.size;
    const channel = client.channels.cache.size;
    const uptime = formatUptime(client.uptime);
    const ping = interaction.createdTimestamp - Date.now();
    const memoryUsage = process.memoryUsage().heapUsed;

    // CPU usage is returned in microseconds, uptime is in milliseconds, so we convert to milliseconds
    const uptimeInSeconds = client.uptime / 1000;

    const memoryPercentage = formatPercentage(memoryUsage, totalMemory);
    const cpuUsage = os.cpus()[0].times;
    const cpuUsagePercent = formatCpuUsage(
      ((cpuUsage.user + cpuUsage.nice + cpuUsage.sys) / cpuUsage.idle) * 100
    );

    const embed = new EmbedBuilder()
      .setTitle("Bot Stats")
      .setColor(Colors.Green)
      .addFields(
        { name: "Guilds", value: `${guild}`, inline: true },
        { name: "Users", value: `${user}`, inline: true },
        { name: "Channels", value: `${channel}`, inline: true },
        { name: "Uptime", value: `${uptime}`, inline: true },
        { name: "Ping", value: `${ping}ms`, inline: true },
        {
          name: "Memory",
          value: `${formatMemory(memoryUsage)} / ${formatMemory(
            totalMemory
          )} (${memoryPercentage})`,
          inline: true,
        },
        {
          name: "CPU Usage",
          value: `${cpuUsagePercent} (${os.cpus().length} cores)`,
          inline: true,
        }
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

    embed.setFooter({
      text: `Requested by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    });
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
