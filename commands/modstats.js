const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('#database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modstats')
		.setDescription('Display the amount of moderation actions a mod has taken')
		.addUserOption(op => op.setName('mod').setDescription('Moderator to view the stats of').setRequired(false))
		.setContexts(0),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction, client) {
		const user = interaction.options.getMember('mod') ?? interaction.member;
		await interaction.deferReply();

		/** @type {{action: ('ban'|'mute'|'kick'), time: string}[]} */
		const actions = await db.get('moderationLog', { column: 'moderator', filter: user.id }, ['action', 'time']);

		const stuff = { // 24 hours, 30 days, all time
			ban: [0, 0, 0],
			kick: [0, 0, 0],
			mute: [0, 0, 0],
			warn: [0, 0, 0],
			total: [0, 0, 0],
		};

		for (let i = 0; i < actions.length; i++) {
			const action = actions[i];
			const time = (Date.now() - Number(action.time)) / 1000; //put back into seconds
			if (time < 86400) {
				stuff[action.action][0]++;
				stuff[action.action][1]++;
				stuff[action.action][2]++;
				stuff.total[0]++;
				stuff.total[1]++;
				stuff.total[2]++;
			}
			else if (time < 2592000) {
				stuff[action.action][1]++;
				stuff[action.action][2]++;
				stuff.total[1]++;
				stuff.total[2]++;
			}
			else {
				stuff[action.action][2]++;
				stuff.total[2]++;
			}
		}

		interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle(`Mod stats for ${user.displayName}`)
					.setThumbnail(user.displayAvatarURL())
					.setFields([
						{ name: 'Warns today', value: `${stuff.warn[0]}`, inline: true },
						{ name: 'Warns this month', value: `${stuff.warn[1]}`, inline: true },
						{ name: 'Warns all time', value: `${stuff.warn[2]}`, inline: true },

						{ name: 'Mutes today', value: `${stuff.mute[0]}`, inline: true },
						{ name: 'Mutes this month', value: `${stuff.mute[1]}`, inline: true },
						{ name: 'Mutes all time', value: `${stuff.mute[2]}`, inline: true },

						{ name: 'Kicks today', value: `${stuff.kick[0]}`, inline: true },
						{ name: 'Kicks this month', value: `${stuff.kick[1]}`, inline: true },
						{ name: 'Kicks all time', value: `${stuff.kick[2]}`, inline: true },

						{ name: 'Bans today', value: `${stuff.ban[0]}`, inline: true },
						{ name: 'Bans this month', value: `${stuff.ban[1]}`, inline: true },
						{ name: 'Bans all time', value: `${stuff.ban[2]}`, inline: true },

						{ name: 'Total today', value: `${stuff.total[0]}`, inline: true },
						{ name: 'Total this month', value: `${stuff.total[1]}`, inline: true },
						{ name: 'Total all time', value: `${stuff.total[2]}`, inline: true },
					])
					.setColor('DarkerGrey'),
			],
		});
	},
};