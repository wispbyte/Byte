const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('#database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('softban')
		.setDescription('Softban a member (Ban then unban)')
		.addUserOption(option => option.setName('member').setDescription('Member to softban').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for softbanning the member').setRequired(false))
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
		if (typeof member !== 'string' && !member.bannable || client.config.moderators.includes(member.id) || member.roles?.cache?.some(role => client.config.modRoles.includes(role?.id))) return interaction.reply({ content: 'I do not have permissions to softban this member', flags: 'Ephemeral' });

		const reason = interaction.options.getString('reason') ?? 'No reason provided';
		await interaction.deferReply();

		try {
			await interaction.guild.bans.create(member.id ?? member, { reason: reason, deleteMessageSeconds: 604800 });
			await db.write('moderationLog', ['action', 'moderator', 'reason', 'time', 'user'], ['kick', interaction.user.id, reason, `${Date.now()}`, member.id ?? member]);

			setTimeout(async () => {
				await interaction.guild.bans.remove(member.id ?? member, 'Softban unban');

				interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setAuthor({ name: interaction.user.username, iconURL: interaction.member.displayAvatarURL() })
							.setDescription(`${member.displayName ?? member} has been softbanned`)
							.setColor('DarkBlue'),
					],
				});
			}, 3000);
		}
		catch (err) {
			interaction.followUp({ content: 'There was an issue while softbanning this member', embeds: [{ description: `\`\`\`${err}\`\`\``, color: '15548997' }] });
			console.error(err);
		}
	},
};