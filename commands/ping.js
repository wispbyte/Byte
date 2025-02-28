const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!'),

	/**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Client} client
     */
	async execute(interaction, client) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const uptime = process.uptime();
		const seconds = Math.floor(uptime % 60);
		const minutes = Math.floor((uptime / 60) % 60);
		const hours = Math.floor((uptime / (60 * 60)) % 24);
		const days = Math.floor(uptime / (60 * 60 * 24));

		const memoryUsageMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

		await interaction.editReply({
			embeds: [new EmbedBuilder()
				.setTitle('Bot Information')
				.setColor('Aqua')
				.setTimestamp(Date.now())
				.addFields([
					{
						name: `${client.cemojis.system.latency.emoji} API Latency`,
						value: `> \`${client.ws.ping}ms\``,
						inline: true,
					},
					{
						name: `${client.cemojis.system.uptime.emoji} Uptime`,
						value: `> \`${days}d ${hours}h ${minutes}m ${seconds}s\``,
						inline: true,
					},
					{
						name: `${client.cemojis.system.memory.emoji} Memory usage`,
						value: `> \`${memoryUsageMb}MB\``,
						inline: true,
					},
				]).setFooter({ iconURL: interaction.guild.iconURL(), text: 'Wispbyte' })],
		});
	},
};