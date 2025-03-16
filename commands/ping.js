const { formatTime } = require('#functions');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!'),

	/**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Client} client
     */
	async execute(interaction, client) {
		await interaction.deferReply();
		const uptime = process.uptime();
		const formattedTime = formatTime(Math.floor(uptime) * 1000, '%dd %hh %mm %ss');

		const memoryUsageMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

		interaction.editReply({
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
						value: `> \`${formattedTime}\``,
						inline: true,
					},
					{
						name: `${client.cemojis.system.memory.emoji} Memory usage`,
						value: `> \`${memoryUsageMb}MB\``,
						inline: true,
					},
				]).setFooter({ iconURL: interaction.inGuild() ? interaction.guild.iconURL() : undefined, text: 'WispByte' }),
			],
		});
	},
	/**
	 * @param {import('discord.js').Message} message
	 * @param {string[]} args
	 * @param {import('../main').ByteClient} client
	 */
	async messageExecute(message, args, client) {
		const reply = await message.reply('Pinging...');

		const uptime = process.uptime();
		const formattedTime = formatTime(Math.floor(uptime) * 1000, '%dd %hh %mm %ss');

		const memoryUsageMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

		reply.edit({
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
						value: `> \`${formattedTime}\``,
						inline: true,
					},
					{
						name: `${client.cemojis.system.memory.emoji} Memory usage`,
						value: `> \`${memoryUsageMb}MB\``,
						inline: true,
					},
				]).setFooter({ iconURL: message.inGuild() ? message.guild.iconURL() : undefined, text: 'WispByte' }),
			],
			content: '',
		});
	},
};