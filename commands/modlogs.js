const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const db = require('#database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modlogs')
		.setDescription('View moderation logs for a user')
		.addUserOption(option => option.setName('user').setDescription('User to view moderation logs of').setRequired(false)),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		const message = (await interaction.deferReply({ withResponse: true })).resource.message;

		const logs = await db.get('moderationLog', { column: 'user', filter: user.id });

		const embed = new EmbedBuilder().setColor('DarkBlue').setTimestamp().setTitle(`Moderation logs for ${user.username}`);
		if (logs.length === 0) return interaction.editReply({ embeds: [embed.setDescription('This user has no logs')] });

		if (logs.length < 25) {
			for (let i = 0; i < logs.length; i++) {
				embed.addFields({ name: `Case ${logs[i].rowid} - ${logs[i].action}`, value: `Reason: ${logs[i].reason}\nModerator: <@${logs[i].moderator}> (${logs[i].moderator})` });
			}

			interaction.editReply({ embeds: [embed] });
		}
		else {
			const pages = [];

			while (logs.length !== 0) {	pages.push(logs.splice(0, 25)); }

			for (let i = 0; i < pages.length; i++) {
				const pageEmbed = new EmbedBuilder()
					.setColor('DarkBlue')
					.setTimestamp()
					.setTitle(`Moderation logs for ${user.username}`)
					.setFooter({ text: `Page: ${i + 1}/${pages.length}` });

				for (let i2 = 0; i2 < pages[i].length; i2++) {
					pageEmbed.addFields({ name: `Case ${pages[i][i2].rowid} - ${pages[i][i2].action}`, value: `Reason: ${pages[i][i2].reason}\nModerator: <@${pages[i][i2].moderator}> (${pages[i][i2].moderator})` });
				}

				pages[i] = pageEmbed;
			}

			let currentPage = 0;
			const actionRow = {
				type: 1,
				components: [
					{ type: 2, emoji: { id: undefined, name: '◀', animated: false }, custom_id: 'modlogBack', style: 1, disabled: true },
					{ type: 2, emoji: { id: undefined, name: '▶', animated: false }, custom_id: 'modlogForward', style: 1 },
				],
			};

			interaction.editReply({ embeds: [pages[0]], components: [actionRow] });

			const collector = message.createMessageComponentCollector({ idle: 60000, filter: (i => i.user.id === interaction.user.id) });

			collector.on('collect', async (i) => {
				if (i.customId === 'modlogBack') {
					currentPage--;
					if (currentPage === 0) actionRow.components[0].disabled = true;
					if (actionRow.components[1].disabled === true) actionRow.components[1].disabled = false;

					await interaction.editReply({ embeds: [pages[currentPage]], components: [actionRow] });
					i.deferUpdate();
				}
				else if (i.customId === 'modlogForward') {
					currentPage++;
					if (currentPage === pages.length - 1) actionRow.components[1].disabled = true;
					if (actionRow.components[0].disabled === true) actionRow.components[0].disabled = false;

					await interaction.editReply({ embeds: [pages[currentPage]], components: [actionRow] });
					i.deferUpdate();
				}
			});

			collector.on('end', (collected, reason) => {
				if (reason === 'idle') {
					message.edit({ embeds: [pages[currentPage]], components: [] });
				}
			});

			collector.on('ignore', (i) => i.reply({ content: 'This is not your command', flags: 'Ephemeral' }));
		}
	},
};