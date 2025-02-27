const { Client, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config({ path: './utilities/.env' });
if (!fs.existsSync('./utilities/commands.json')) fs.writeFileSync('./utilities/commands.json', '[]', 'utf-8');

const client = new Client({
	intents: [
		'MessageContent',
		'GuildMessages',
		'GuildEmojisAndStickers',
		'GuildIntegrations',
		'GuildMembers',
		'GuildMessagePolls',
		'GuildModeration',
		'Guilds',
		'GuildWebhooks',
	],
});

client.config = require('./utilities/config.json'); // Accessible through client.config anywhere where you can access the client
client.commands = new Collection();
fs.readdirSync('./commands').forEach(command => {
	const commandData = require(`./commands/${command}`);
	if (!commandData || !commandData.data || !commandData.execute) {
		console.error(`You are missing something in the command ${command}`);
		process.exit();
	}

	client.commands.set(commandData.data.name, commandData);
});

fs.readdirSync('./events').forEach(event => {
	const eventData = require(`./events/${event}`);
	if (!eventData || !eventData.name || !eventData.execute) {
		console.error(`You are missing something in the event file ${event}`);
		process.exit();
	}

	client[eventData.once ? 'once' : 'on'](eventData.name, (...args) => eventData.execute(...args, client));
});

client.components = {};

fs.readdirSync('./components').forEach(componentType => {
	console.log(`Loading component: ${componentType}`);  
	client.components[componentType] = new Collection();
	fs.readdirSync(`./components/${componentType}`).forEach(component => {
		const componentData = require(`./components/${componentType}/${component}`);
		if (!componentData.customId || !componentData.execute) {
			console.error(`Missing values in ${componentType} ${component}`);
			process.exit();
		}
		console.log(`Loaded ${componentType}: ${componentData.customId}`);  
		client.components[componentType].set(componentData.customId, componentData);
	});
});

client.login(process.env.token);

process.on('uncaughtException', error => {
	console.error(`Uncaught exception: ${error.message}\n${error.cause ?? 'No error cause'}\n\n${error.stack ?? 'No error stack'}`);
});
process.on('unhandledRejection', (reason) => {
	console.error(`Unhandled Rejection: ${reason}\n${reason.stack ?? 'No error stack'}`);
});
client.on('error', error => {
	console.error(`Discord.js error: ${error.message}\n${error.cause ?? 'No error cause'}\n\n${error.stack ?? 'No error stack'}`);
});