module.exports = {
	customId: 'information', // modal id, supports variable ids, eg information_234823467 will trigger this
	/**
	 * @param {import('discord.js').ModalSubmitInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	execute(interaction, client) {
		interaction.reply({ content: 'confirmed', flags: 'Ephemeral' });
	},
};