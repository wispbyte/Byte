const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');

function gay(userId) {
	const hash = crypto.createHash('md5').update(userId).digest('hex');
	const number = parseInt(hash.slice(0, 6), 16);
	return number % 101;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gay')
		.setDescription('How gay?')
		.addUserOption(option => option.setName('person').setDescription('The person to apply the gayness meter to').setRequired(false))
		.setContexts(0),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */
	async execute(interaction) {
		const user = interaction.options.getMember('person')
		?? interaction.options.getUser('person')
		?? interaction.member
		?? interaction.user;
		const gayness = gay(user.id);

		interaction.reply({
			embeds: [{ description: `${user.displayName} is ${gayness}% gay`, footer: gayness === 100 ? { text: 'G A Y  A F' } : gayness >= 90 ? { text: 'Bro is hella gay' } : gayness === 0 ? { text: 'Not gay :pensive:' } : null }],
		});

	},
	/**
	 * @param {import('discord.js').Message} message
	 * @param {string[]} args
	 * @param {import('../main').ByteClient} client
	 */
	async messageExecute(message, args, client) {
		let user;

		if (message.inGuild()) {
			user = message.mentions.members.first()
			|| (args[1]
				? (await message.guild.members.fetch(args[1]).catch(() => { /* */ }))
				: message.member);
		}

		if (!user) {
			user = message.mentions.users.first()
			|| (args[1]
				? (await client.users.fetch(args[1]).catch(() => { /* */ }))
				: message.author);
		}
		if (!user) return message.reply('I can\'t get that user D:');

		const gayness = gay(user.id);

		message.reply({
			embeds: [{ description: `${user.displayName} is ${gayness}% gay`, footer: gayness === 100 ? { text: 'G A Y  A F' } : gayness >= 90 ? { text: 'Bro is hella gay' } : gayness === 0 ? { text: 'Not gay :(' } : null }],
		});
	},
};
