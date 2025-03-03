const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, GuildMember } = require('discord.js');
const db = require('#database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Unban a member')
		.addUserOption(option => option.setName('member').setDescription('Member to unban').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for unbanning the member').setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	mod: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction, client) {
		let member = interaction.options.getUser('member');
		if (!member) return interaction.reply({ content: 'This user does not exist', flags: 'Ephemeral' });
		const isbanned = interaction.guild.bans.fetch(member).catch((err) => {/* */ });
		if (!isbanned) return interaction.reply({ content: 'That member is not banned' });

		const reason = interaction.options.getString('reason') ?? 'No reason provided';
		await interaction.deferReply();

		try {
			interaction.guild.bans.remove(member, reason);
			await db.write('moderationLog', ['action', 'moderator', 'reason', 'time', 'user'], ['unban', interaction.user.id, reason, `${Date.now()}`, member.id]);

			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
						.setDescription(`${member.displayName} has been unbanned`),
				],
			});
		}
		catch (err) {
			interaction.followUp({ content: 'There was an issue while unmuting this member', embeds: [{ description: `\`\`\`${err}\`\`\``, color: '15548997' }] });
			console.error(err);
		}
	},
};
