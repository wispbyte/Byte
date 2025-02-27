const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong!'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Client} client
     */
    async execute(interaction, client) {
        await interaction.deferReply();
        const uptime = process.uptime();
        const seconds = Math.floor(uptime % 60);
        const minutes = Math.floor((uptime / 60) % 60);
        const hours = Math.floor((uptime / (60 * 60)) % 24);
        const days = Math.floor(uptime / (60 * 60 * 24));

        const memoryUsageMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1); //Process's Resident Set Size, converted from bytes to megabytes, rounded to the nearest 10th.

        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setTitle('Bot Info')
                .setColor('DarkBlue')
                .setTimestamp(Date.now())
                .addFields([
                    {
                        name: '• API Latency',
                        value: `> \`🟢 ${client.ws.ping}ms\``,
                        inline: true
                    },
                    {
                        name: '• Uptime',
                        value: `> \`🟢 ${days}d ${hours}h ${minutes}m ${seconds}s\``,
                        inline: true
                    },
                    {
                        name: "• Memory usage",
                        value: `> \`${memoryUsageMb}MB\``,
                        inline: true
                    },
                ])],
        });
    },
};