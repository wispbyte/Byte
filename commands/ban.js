const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('#database');
const { parseTime } = require('#functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a member')
		.addUserOption(option => option.setName('member').setDescription('Member to ban').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for banning the member').setRequired(false))
		.addStringOption(option => option.setName('delete-messages').setDescription('How long ago to delete messages from this member (defaults to 2 weeks)').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	mod: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction, client) {
		let member = interaction.options.getMember('member');
		if (!member) {
			const user = interaction.options.getUser('member');
			if (!user) return interaction.reply({ content: 'This user does not exist', flags: 'Ephemeral' });
			member = (await interaction.guild.members.fetch(user.id).catch(() => { /* */ })) ?? user.id;
		}
		if (typeof member !== 'string' && !member.bannable || client.config.moderators.includes(member.id) || member.roles?.cache?.some(role => client.config.modRoles.includes(role?.id))) return interaction.reply({ content: 'I do not have permissions to ban this member', flags: 'Ephemeral' });

		const reason = interaction.options.getString('reason') ?? 'No reason provided';
		const clearMessages = parseTime(interaction.options.getString('delete-messages')) ?? 604800;
		if (clearMessages > 604800) return interaction.reply({ content: 'I cannot delete messages older than 2 weeks', flags: 'Ephemeral' });
		await interaction.deferReply();


		try {
			await interaction.guild.bans.create(member.id ?? member, { reason: reason, deleteMessageSeconds: clearMessages });
			await db.write('moderationLog', ['action', 'moderator', 'reason', 'time', 'user'], ['ban', interaction.user.id, reason, `${Date.now()}`, member.id ?? member]);

			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
						.setDescription(`${member.displayName ?? member} has been banned`)
						.setColor('DarkBlue'),
				],
			});
		}
		catch (err) {
			interaction.followUp({ content: 'There was an issue while banning this member', embeds: [{ description: `\`\`\`${err}\`\`\``, color: '15548997' }] });
			console.error(err);
		}
	},
};