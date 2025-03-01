const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('#database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDescription('Unmute a member')
		.addUserOption(option => option.setName('member').setDescription('Member to unmute').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for unmuting the member').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	mod: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction, client) {
		let member = interaction.options.getMember('member');
		if (!member) return interaction.reply({ content: 'This user does not exist', flags: 'Ephemeral' });
		if (!member.moderatable) {
			return interaction.reply({ content: 'I do not have permission to unmute this member', flags: 'Ephemeral' });
		}

		const reason = interaction.options.getString('reason') ?? 'No reason provided';
		await interaction.deferReply();

		try {
			member.timeout(0, reason);
			await db.write('moderationLog', ['action', 'moderator', 'reason', 'time', 'user'], ['unmute', interaction.user.id, reason, `${Date.now()}`, member.id]);

			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
						.setDescription(`${member.displayName} has been unmuted`),
				],
			});
		}
		catch (err) {
			interaction.followUp({ content: 'There was an issue while unmuting this member', embeds: [{ description: `\`\`\`${err}\`\`\``, color: '15548997' }] });
			console.error(err);
		}
	},
};
