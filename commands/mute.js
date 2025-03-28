const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('#database');
const { parseTime } = require('#functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mute a member')
		.addUserOption(option => option.setName('member').setDescription('Member to mute').setRequired(true))
		.addStringOption(option => option.setName('duration').setDescription('Duration of the mute (e.g., 10m, 1h, 1d)').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for muting the member').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	mod: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction, client) {
		let member = interaction.options.getMember('member');
		if (!member) return interaction.reply({ content: 'This user does not exist', flags: 'Ephemeral' });
		if (typeof member === 'string' || !member.moderatable || client.config.moderators.includes(member.id) || member.roles?.cache?.some(role => client.config.modRoles.includes(role?.id))) {
			return interaction.reply({ content: 'I do not have permission to timeout this member', flags: 'Ephemeral' });
		}

		const duration = parseTime(interaction.options.getString('duration'));
		if (!duration || duration < 10 || duration > 2.419e6) { // 10s - 28 days limit although no one is going to mute for 10 seconds
			return interaction.reply({ content: 'Invalid duration. Please provide a time between 10 seconds and 28 days.', flags: 'Ephemeral' });
		}

		const reason = interaction.options.getString('reason') ?? 'No reason provided';
		await interaction.deferReply();

		try {
			await member.timeout(duration * 1000, reason);
			await db.write('moderationLog', ['action', 'moderator', 'reason', 'time', 'user', 'duration', 'expirationDate'], ['mute', interaction.user.id, reason, `${Date.now()}`, member.id, `${duration}`, `${Date.now() + (duration * 1000)}`]);

			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
						.setDescription(`${member.displayName} has been timed out for ${interaction.options.getString('duration')}`),
				],
			});
		}
		catch (err) {
			interaction.followUp({ content: 'There was an issue while timing out this member', embeds: [{ description: `\`\`\`${err}\`\`\``, color: '15548997' }] });
			console.error(err);
		}
	},
};
