module.exports = {
	customId: 'confirm', // button id, supports variable ids, eg confirm_923423 will trigger this
	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	execute(interaction, client) {
		interaction.reply({ content: 'confirmed', flags: 'Ephemeral' });
	},
};