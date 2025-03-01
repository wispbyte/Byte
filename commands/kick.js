const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('#database');
const { parseTime } = require('#functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member')
		.addUserOption(option => option.setName('member').setDescription('Member to kick').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for kicking the member').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	mod: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction, client) {
		let member = interaction.options.getMember('member');
		if (!member) return interaction.reply({ content: 'This user does not exist', flags: 'Ephemeral' });
		if (!member.kickable || client.config.moderators.includes(member.id) || member.roles?.cache?.some(role => client.config.modRoles.includes(role?.id))) return interaction.reply({ content: 'I do not have permissions to ban this member', flags: 'Ephemeral' });

		const reason = interaction.options.getString('reason') ?? 'No reason provided';
		await interaction.deferReply();

		try {
			member.kick(reason);
			await db.write('moderationLog', ['action', 'moderator', 'reason', 'time', 'user'], ['kick', interaction.user.id, reason, `${Date.now()}`, member.id]);

			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
						.setDescription(`${member.displayName} has been kicked`)
						.setColor('DarkBlue'),
				],
			});
		}
		catch (err) {
			interaction.followUp({ content: 'There was an issue while kicking this member', embeds: [{ description: `\`\`\`${err}\`\`\``, color: '15548997' }] });
			console.error(err);
		}
	},
};