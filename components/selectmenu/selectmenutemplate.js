module.exports = {
	customId: 'information', // modal id, supports variable ids, eg information_234823467 will trigger this
	/**
	 * @param {import('discord.js').ChannelSelectMenuInteraction | import('discord.js').MentionableSelectMenuInteraction | import('discord.js').RoleSelectMenuInteraction | import('discord.js').StringSelectMenuInteraction | import('discord.js').UserSelectMenuInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	execute(interaction, client) {
		interaction.reply({ content: 'confirmed', flags: 'Ephemeral' });
	},
};