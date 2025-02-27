const { REST, Routes } = require('discord.js');
const fs = require('fs');

module.exports = {
	name: 'ready', // event name
	once: true, // only run the event once
	/**
	 * @param {import('discord.js').Client} client
	 */
	async execute(client) {
		// the function to execute for the event. The arrow function will also work if it's called the same
		// Client and the relevant arguments are passed in with the required args first and then the client.
		// For example the message create event would be (message, client)
		// You can also use the jsdoc annotation as shown above to let vscode know what the variable is.
		console.log(`Logged in as ${client.user.username}`);


		let commandArray = client.commands.map(command => command.data.toJSON());

		if (fs.readFileSync('./utilities/commands.json', 'utf-8') !== JSON.stringify(commandArray, null, 2)) {
			console.log('New/changed slash commands detected, updating commands');

			const rest = new REST({ version: '10' }).setToken(process.env.token);
			try {
				await rest.put(Routes.applicationCommands(client.user.id), { body: commandArray });
				fs.writeFileSync('./utilities/commands.json', JSON.stringify(commandArray, null, 2), 'utf-8');
				console.log('Successfully updated slash commands');
			}
			catch (err) {
				console.error(`There was an error updating commands: ${err}`);
			}
		}
		else {
			console.log('Commands up to date');
		}
	},
};