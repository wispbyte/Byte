require('#log');

const dev = process.argv.some(arg => ['-d', '--dev', '--development'].includes(arg));

module.exports = {
	name: 'messageCreate',
	/**
     * @param {import('discord.js').Message} message
     * @param {import('../main').ByteClient} client
     */
	async execute(message, client) {
		if (!message.content.startsWith(client.config.prefix)) return;
		const args = message.content.replace(client.config.prefix, '').split(' ');

		let command = client.commands.get(args[0]);

		if (!command) {
			if (!client.aliases[args[0]]) return message.reply('This command does not exist');

			command = client.commands.get(client.aliases[args[0]]);
		}

		if (command.mod && !dev) {
			if (!message.inGuild()) return message.reply({ content: 'You must be a moderator to run this command' });

			const member = await message.guild.members.fetch(message.user.id); // Making sure the member is fetched so that it's not an ApiGuildMember.
			if (!client.config.modRoles.find(role => member.roles.resolve(role) !== null)) return message.reply({ content: 'You must be a moderator to run this command' });
		}

		try {
			command.messageExecute(message, args, client);
		}
		catch (err) {
			console.error(err);
			message.reply('There was an error executing this command');
		}

	},
};