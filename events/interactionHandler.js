module.exports = {
	name: 'interactionCreate',
	/**
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Client} client
     */
	async execute(interaction, client) {
		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName);

			if (!command) {
				throw new Error(`Command not found but triggered: ${interaction.commandName}`);
			}

			if (command.mod) return interaction.reply({ content: 'You must be a moderator to run this command', flags: 'Ephemeral' });
			try {
				command.execute(interaction, client);
			}
			catch (err) {
				console.error(err);
				interaction.deferred || interaction.replied ?
					interaction.followUp({ content: 'There was an error executing this command', flags: 'Ephemeral' }) :
					interaction.reply({ content: 'There was an error executing this command', flags: 'Ephemeral' }); // reply in the appropriate manner depending on what has happened
			}
		}
		else if (interaction.isButton()) {
			const baseCustomId = interaction.customId.split('_')[0];

			console.log(`Button interaction detected with customId: ${baseCustomId}`);
			const button = client.components.buttons.get(baseCustomId);

			if (!button) {
				console.log(`No button found with customId: ${baseCustomId}`);
				return;
			}

			try {
				console.log(`Executing button interaction with customId: ${interaction.customId}`);
				await button.execute(interaction, client);
			}
			catch (err) {
				console.error('Error executing button:', err);
				interaction.deferred || interaction.replied ?
					interaction.followUp({ content: 'There was an error running this button', flags: 'Ephemeral' }) :
					interaction.reply({ content: 'There was an error running this button', flags: 'Ephemeral' });
			}
		}
		else if (interaction.isModalSubmit()) {
			const baseCustomId = interaction.customId.split('_')[0];
			console.log(`Modal interaction detected with customId: ${baseCustomId}`);

			const modal = client.components.modals.get(baseCustomId);

			if (!modal) {
				console.log(`No modal found with base customId: ${baseCustomId}`);
				return;
			}

			try {
				console.log(`Executing modal with customId: ${interaction.customId}`);
				await modal.execute(interaction, client);
			}
			catch (err) {
				console.error('Error executing modal:', err);
				interaction.deferred || interaction.replied ?
					interaction.followUp({ content: 'There was an error thinking about this modal', flags: 'Ephemeral' }) :
					interaction.reply({ content: 'There was an error thinking about this modal', flags: 'Ephemeral' });
			}
		}
		else if (interaction.isAnySelectMenu()) {
			const baseCustomId = interaction.customId.split('_')[0];
			console.log(`Select menu interaction detected with customId: ${baseCustomId}`);

			const select = client.components.selectmenu.get(baseCustomId);

			if (!select) {
				console.log(`No select menu found with customId: ${baseCustomId}`);
				return;
			}

			try {
				console.log(`Executing select menu with customId: ${interaction.customId}`);
				await select.execute(interaction, client);
			}
			catch (err) {
				console.error('Error executing select menu:', err);
				interaction.deferred || interaction.replied ?
					interaction.followUp({ content: 'There was an error thinking about this select menu', flags: 'Ephemeral' }) :
					interaction.reply({ content: 'There was an error thinking about this select menu', flags: 'Ephemeral' });
			}
		}
		else if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName);

			if (!command || !command.autocomplete) {
				console.log(`No autocomplete handler found for command: ${interaction.commandName}`);
				return;
			}

			try {
				console.log(`Executing autocomplete for command: ${interaction.commandName}`);
				await command.autocomplete(interaction, client);
			}
			catch (err) {
				console.error('Error executing autocomplete:', err);
			}
		}
	},
};