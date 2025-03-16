require('#log');

const dev = process.argv.some(arg => ['-d', '--dev', '--development'].includes(arg));

module.exports = {
	name: 'interactionCreate',
	/**
     * @param {import('discord.js').Interaction} interaction
     * @param {import('../main').ByteClient} client
     */
	async execute(interaction, client) {
		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName);

			if (!command) {
				throw new Error(`Command not found but triggered: ${interaction.commandName}`);
			}

			if (command.mod && !dev) {
				if (!interaction.inGuild()) return interaction.reply({ content: 'You must be a moderator to run this command', flags: 'Ephemeral' });

				const member = await interaction.guild.members.fetch(interaction.member.id); // Making sure the member is fetched so that it's not an ApiGuildMember.
				if (!client.config.modRoles.find(role => member.roles.resolve(role) !== null)) return interaction.reply({ content: 'You must be a moderator to run this command', flags: 'Ephemeral' });
			}

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

			console.log(`Button interaction detected with customId: ${baseCustomId}`, 'v');
			const button = client.components.get('buttons').get(baseCustomId);

			if (!button) {
				return;
			}

			try {
				console.log(`Executing button interaction with customId: ${interaction.customId}`, 'v');
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
			console.log(`Modal interaction detected with customId: ${baseCustomId}`, 'v');

			const modal = client.components.get('modals').get(baseCustomId);

			if (!modal) {
				return;
			}

			try {
				console.log(`Executing modal with customId: ${interaction.customId}`, 'v');
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
			console.log(`Select menu interaction detected with customId: ${baseCustomId}`, 'v');

			const select = client.components.get('selectmenu').get(baseCustomId);

			if (!select) {
				return;
			}

			try {
				console.log(`Executing select menu with customId: ${interaction.customId}`, 'v');
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
				console.log(`No autocomplete handler found for command: ${interaction.commandName}`, 'v');
				return;
			}

			try {
				console.log(`Executing autocomplete for command: ${interaction.commandName}`, 'v');
				await command.autocomplete(interaction, client);
			}
			catch (err) {
				console.error('Error executing autocomplete:', err);
			}
		}
	},
};