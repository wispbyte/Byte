const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('#database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('View information about a user')
		.addUserOption(option => option.setName('user').setDescription('User to view the data of').setRequired(false))
		.setContexts(0),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction) {
		if (!interaction.inGuild()) return interaction.reply({ content: 'This command must be run in a server', flags: 'Ephemeral' });

		await interaction.deferReply();

		const user = interaction.options.getUser('user') ?? interaction.user;
		const member = interaction.options.getMember('user') ?? interaction.member;
		const modlogs = (await db.get('moderationLog', { column: 'user', filter: user.id }, 'action')).length;

		/** @type {string[]} */
		const roles = member.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => `<@&${role.id}>`);
		const rolesjoined = roles.join(' ');

		const embed = new EmbedBuilder()
			.setThumbnail(member.displayAvatarURL())
			.setTitle(`Data for ${member.displayName} (${user.id})`)
			.addFields(
				{ name: 'Joined', value: member.joinedAt.toUTCString(), inline: true },
				{ name: 'Created', value: user.createdAt.toUTCString(), inline: true },
				{ name: 'Moderation logs', value: `${modlogs}`, inline: true },
				{
					name: 'Key Permissions',
					value: member.permissions.toArray()
						.filter(perm => ['KickMembers', 'BanMembers', 'Administrator', 'ManageChannels', 'ManageGuild', 'ManageMessages', 'MentionEveryone', 'MuteMembers', 'DeafenMembers', 'MoveMembers', 'ManageNicknames', 'ManageRoles', 'ManageWebhooks', 'ManageEvents', 'ManageThreads', 'ModerateMembers']
							.includes(perm)).join(', '),
				},
			)

			.setFooter({ text: `ID: ${interaction.user.id}` })
			.setTimestamp();

		console.log(rolesjoined.length);
		if (rolesjoined.length < 700) {
			embed.addFields({ name: `Roles (${roles.length})`, value: rolesjoined ?? 'No roles' });
			interaction.editReply({ embeds: [embed] });
		}
		else if (rolesjoined.length < 5500) {
			let embeds = ['', '', '', '', '', ''];

			let roleslist = roles;
			let i = 0;
			while (roleslist.length !== 0) {
				if (embeds[i].length > 1000) i++;

				embeds[i] += roleslist.shift();
			}
			interaction.editReply({ embeds: [embed, ...embeds.filter(e => e !== '').map(e => ({ description: e }))] });
		}
		else {

			embed.setDescription('Too many roles to display');
			interaction.editReply({ embeds: [embed] });

			// this code should display roes in their own message but I can't really make 250 roles to test so someone else can do it

			/* embed.addFields({ name: 'Roles', value: `My guy has ${roles.length} roles so I need to put them in their own messages` });
			let messages = [new EmbedBuilder().setDescription('')];

			let roleslist = roles;
			let i = 0;
			while (roleslist.length !== 0) {
				if (messages[i].data.description.length > 4000) messages[+i] = new EmbedBuilder().setDescription('');
				messages[i].setDescription(`${messages[i].data.description}${roleslist.shift()}`);
			}
			console.log(messages);

			interaction.editReply({ embeds: [embed] });

			for (let i = 0; i < messages.length; i++) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await interaction.followUp({ embeds: messages[i] });
			} */
		}

	},
};
