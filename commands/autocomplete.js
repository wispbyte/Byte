const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('choose')
		.setDescription('Select an option')
		.addStringOption(option =>
			option.setName('option')
				.setDescription('Choose an option')
				.setRequired(true)
				.setAutocomplete(true),
		),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	async execute(interaction) {
		const selectedOption = interaction.options.getString('option');
		await interaction.reply({ content: `You selected: **${selectedOption}**`, flags: MessageFlags.Ephemeral });
	},

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const options = ['Option 1', 'Option 2', 'Sex'];
		const filtered = options.filter(option =>
			option.toLowerCase().startsWith(focusedValue.toLowerCase()),
		).slice(0, 5);

		await interaction.respond(filtered.map(option => ({ name: option, value: option })));
	},
};