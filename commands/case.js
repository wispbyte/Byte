const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('#database');
const { timeToString, parseTime } = require('#functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('case')
		.setDescription('Manage or view cases')
		.addSubcommand(subcommand => subcommand.setName('view').setDescription('View a case')
			.addStringOption(option => option.setName('case_id').setDescription('Case id to view').setRequired(true)))
		.addSubcommandGroup(group => group.setName('edit').setDescription('Edit a case')
			.addSubcommand(subcommand => subcommand.setName('reason').setDescription('Edit a case reason')
				.addStringOption(option => option.setName('case_id').setDescription('Case id to edit').setRequired(true))
				.addStringOption(option => option.setName('reason').setDescription('Reason to set it to').setRequired(true)))
			.addSubcommand(subcommand => subcommand.setName('duration').setDescription('Edit a case duration')
				.addStringOption(option => option.setName('case_id').setDescription('Case id to edit').setRequired(true))
				.addStringOption(option => option.setName('duration').setDescription('Duration to set it to').setRequired(true))
				.addBooleanOption(option => option.setName('from_now').setDescription('Adjust the duration relative to now (default is no)').setRequired(false))),
		),

	/**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Client} client
     */
	async execute(interaction, client) {
		const subcommand = interaction.options.getSubcommand();
		const subcommandgroup = interaction.options.getSubcommandGroup();
		if (!subcommandgroup) {
			if (subcommand === 'view') {
				const caseid = interaction.options.getString('case_id');


				/** @type {{moderator:string,time:string,action:string,user:string,reason:string,expirationDate:string,duration:string,rowid:string}} */
				const casee = await db.getOne('moderationLog', { column: 'rowid', filter: caseid });
				const user = await client.users.fetch(casee.user);
				const mod = await client.users.fetch(casee.moderator);

				const embed = new EmbedBuilder()
					.setTitle(`Case ${caseid}`)
					.setFields([
						{ name: 'User', value: `${user.displayName} - <@${casee.user}>`, inline: true },
						{ name: 'Moderator', value: `${mod.displayName} - <@${casee.moderator}>`, inline: true },
					])
					.setFooter({ text: `ID: ${interaction.user.id}` })
					.setTimestamp();

				if (casee.duration !== null && casee.duration !== 'null') embed.addFields({ name: 'Duration', value: `Duration: ${timeToString(Number(casee.duration))}`, inline: true });
				embed.addFields({ name: 'Reason', value: casee.reason, inline: true });

				interaction.reply({ embeds: [embed] });
			}
		}
		else if (subcommandgroup === 'edit') {
			if (subcommand === 'reason') {
				const caseid = interaction.options.getString('case_id');
				await interaction.deferReply();

				const casee = await db.getOne('moderationLog', { column: 'rowid', filter: Number(caseid) });
				if (!casee.reason) return interaction.editReply({ content: 'This case does not exist' });

				const newReason = interaction.options.getString('reason');
				await db.update('moderationLog', 'reason', newReason, { column: 'rowid', filter: caseid });

				interaction.editReply({ content: `Updated case ${caseid} from \`${casee.reason}\` to \`${newReason}\`` });
			}
			else if (subcommand === 'duration') {
				const caseid = interaction.options.getString('case_id');
				await interaction.deferReply();

				const casee = await db.getOne('moderationLog', { column: 'rowid', filter: Number(caseid) });
				if (!casee) return interaction.editReply({ content: 'This case does not exist' });

				const member = await interaction.guild.members.fetch(casee.user).catch(() => {/* */});
				if (!member && casee.action === 'mute') return interaction.editReply({ content: 'This user has left the server and I cannot change their mute duration' });

				if (['kick', 'ban'].includes(casee.action)) return interaction.editReply({ content: 'You cannot set the duration on this type of action' });

				if (casee.expirationDate < Date.now()) return interaction.editReply({ content: 'This moderation action has already ended' });

				const fromnow = interaction.options.getBoolean('from_now');
				const duration = parseTime(interaction.options.getString('duration'));
				const endTime = (fromnow ? Date.now() : casee.time) + (duration * 1000);

				if (endTime < casee.expirationDate) return interaction.editReply({ content: 'I cannot set a duration that will cause the moderation action to end now, use the relevant command for that' });

				const durationEffect = endTime - Date.now();

				if (casee.action === 'mute') {
					if (durationEffect > 2.419e9) return interaction.editReply({ content: 'You cannot set a mute duration that will end in more than 28 days' });

					await member.timeout(durationEffect, `Case duration update - ${interaction.user.username}`);
					await db.update('moderationLog', ['duration', 'expirationDate'], [duration, endTime], { column: 'rowid', filter: Number(caseid) });

					interaction.editReply({ content: `Updated case id ${casee.rowid} to end at <t:${endTime}:f>` });
				}


			}
		}
	},
};