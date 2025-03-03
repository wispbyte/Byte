const { ChannelLocking } = require('#functions');
const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits, EmbedBuilder, ChannelType, MessageFlags, GuildChannel } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unlock')
		.setDescription('Unlocks a channel (even under lockdown)')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.MuteMembers)
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to unlock')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildMedia, ChannelType.GuildText, ChannelType.GuildVoice,
					ChannelType.GuildStageVoice),
		),

	/**
     *
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
	async execute(interaction) {
		await interaction.deferReply();
		/**
         * @type {GuildChannel}
         */
		const channel = interaction.options.getChannel('channel', true);
		const everyonePerms = channel.permissionsFor(channel.guild.roles.everyone);
		if (everyonePerms.has(PermissionFlagsBits.SendMessages)) {
			await interaction.editReply({
				embeds: [new EmbedBuilder()
					.setDescription('This channel is already unlocked.')
					.setColor('DarkBlue'),
				],
			});
			return;
		}

		await ChannelLocking.unlockChannel(channel, null, 'Unlock command', false).then(
			async () => {
				await interaction.editReply({
					embeds: [new EmbedBuilder()
						.setTitle('Channel unlocked')
						.setDescription(`<#${channel.id}> has been unlocked successfully.`)
						.setColor('DarkBlue'),
					],
				});
			},
			async (error) => {
				await interaction.editReply({
					embeds: [new EmbedBuilder()
						.setTitle('Channel not unlocked')
						.setDescription('Couldn\'t unlock channel: ' + error)
						.setColor('Red'),
					],
				});
			},
		);
	},
};